// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SLA.sol";
import "./SLO.sol";
import "./SLORegistry.sol";
import "./PeriodRegistry.sol";
import "./MessengerRegistry.sol";
import "./StakeRegistry.sol";
import "./messenger/IMessenger.sol";

/**
 * @title SLARegistry
 * @dev SLARegistry is a contract for handling creation of service level
 * agreements and keeping track of the created agreements
 */
contract SLARegistry is Ownable {
    using SafeMath for uint256;

    /// @dev SLO registry
    SLORegistry public sloRegistry;
    /// @dev Periods registry
    PeriodRegistry public periodRegistry;
    /// @dev Messengers registry
    MessengerRegistry public messengerRegistry;
    /// @dev Stake registry
    StakeRegistry public stakeRegistry;
    /// @dev stores the addresses of created SLAs
    SLA[] public SLAs;
    /// @dev stores the indexes of service level agreements owned by an user
    mapping(address => uint256[]) private userToSLAIndexes;

    /**
     * @dev event for service level agreement creation logging
     * @param sla 1. The address of the created service level agreement contract
     * @param owner 2. The address of the owner of the service level agreement
     */
    event SLACreated(SLA indexed sla, address indexed owner);

    /**
     * @dev constructor
     * @param _sloRegistry 1. SLO Registry
     * @param _periodRegistry 2. Periods registry
     * @param _messengerRegistry 3. Messenger registry
     * @param _stakeRegistry 4. Stake registry
     */
    constructor(
        SLORegistry _sloRegistry,
        PeriodRegistry _periodRegistry,
        MessengerRegistry _messengerRegistry,
        StakeRegistry _stakeRegistry
    ) public {
        sloRegistry = _sloRegistry;
        periodRegistry = _periodRegistry;
        stakeRegistry = _stakeRegistry;
        stakeRegistry.setSLARegistry();
        messengerRegistry = _messengerRegistry;
        messengerRegistry.setSLARegistry();
    }

    /**
     * @dev public function for creating canonical service level agreements
     * @param _SLO 1. SLO
     * @param _ipfsHash 2. string with the ipfs hash that contains extra information about the service level agreement
     * @param _periodType 3. period type
     * @param _periodIds 4. array of allowed period ids
     * @param _messengerAddress 5. address of the messenger for the corresponding SLA
     * @param _whitelisted 6. bool to declare whitelisted SLA
     * @param _extraData 7. bytes32 to embed extra data for customized workflows
     */
    function createSLA(
        SLO _SLO,
        string memory _ipfsHash,
        PeriodRegistry.PeriodType _periodType,
        uint256[] memory _periodIds,
        address _messengerAddress,
        bool _whitelisted,
        bytes32[] memory _extraData
    ) public {
        bool initialized = periodRegistry.periodDefinitions(_periodType);
        require(initialized == true, "Period type is not initialized yet");
        require(
            sloRegistry.isRegisteredSLO(address(_SLO)) == true,
            "SLO not registered on SLORegistry"
        );
        require(_periodIds.length > 0, "Periods information is empty");
        // check if _periodIds are valid and sorted in ascendant order
        for (uint256 index = 0; index < _periodIds.length; index++) {
            bool validPeriod =
                periodRegistry.isValidPeriod(_periodType, _periodIds[index]);
            require(validPeriod, "Period id not valid");
            if (index < _periodIds.length - 1) {
                require(
                    _periodIds[index] < _periodIds[index + 1],
                    "Period ids should be sorted "
                );
                require(
                    _periodIds[index + 1].sub(_periodIds[index]) == 1,
                    "Period ids should be consecutive"
                );
            }
        }
        bool registeredMessenger =
            messengerRegistry.registeredMessengers(_messengerAddress);
        require(
            registeredMessenger == true,
            "messenger address is not registered"
        );

        SLA sla =
            new SLA(
                msg.sender,
                _SLO,
                _ipfsHash,
                _messengerAddress,
                _periodIds,
                _periodType,
                address(stakeRegistry),
                address(periodRegistry),
                _whitelisted,
                _extraData,
                SLAs.length
            );

        stakeRegistry.lockDSLAValue(
            msg.sender,
            address(sla),
            _periodIds.length
        );
        SLAs.push(sla);
        uint256 index = SLAs.length.sub(1);
        userToSLAIndexes[msg.sender].push(index);
        emit SLACreated(sla, msg.sender);
    }

    /**
     * @dev Gets SLI information for the specified SLA and SLO
     * @param _periodId 1. id of the period
     * @param _sla 2. SLA Address
     */
    function requestSLI(uint256 _periodId, SLA _sla) public {
        require(
            _periodId == _sla.nextVerifiablePeriod(),
            "Should only verify next period"
        );
        (, , SLA.Status status) = _sla.periodSLIs(_periodId);
        require(
            status == SLA.Status.NotVerified,
            "SLA contract was already verified for the period"
        );
        bool breachedContract = _sla.breachedContract();
        require(
            breachedContract == false,
            "Should only be called for not breached contracts"
        );
        bool slaAllowedPeriodId = _sla.isAllowedPeriod(_periodId);
        require(
            slaAllowedPeriodId == true,
            "Period ID not registered in the SLA contract"
        );
        PeriodRegistry.PeriodType slaPeriodType = _sla.periodType();
        bool periodFinished =
            periodRegistry.periodIsFinished(slaPeriodType, _periodId);
        require(
            periodFinished == true,
            "SLA contract period has not finished yet"
        );
        address slaMessenger = _sla.messengerAddress();
        IMessenger(slaMessenger).requestSLI(_periodId, address(_sla));
        stakeRegistry.distributeVerificationRewards(
            address(_sla),
            msg.sender,
            _periodId
        );
    }

    function returnLockedValue(SLA _sla) public {
        require(
            msg.sender == _sla.owner(),
            "Only SLA owner can claim locked value"
        );
        uint256 periodIdsLength = _sla.getPeriodIdsLength();
        uint256 lastValidPeriodId = _sla.periodIds(periodIdsLength - 1);
        PeriodRegistry.PeriodType periodType = _sla.periodType();
        (, uint256 endOfLastValidPeriod) =
            periodRegistry.getPeriodStartAndEnd(periodType, lastValidPeriodId);

        (, , SLA.Status lastPeriodStatus) = _sla.periodSLIs(lastValidPeriodId);
        require(
            _sla.breachedContract() == true ||
                (block.timestamp >= endOfLastValidPeriod &&
                    lastPeriodStatus != SLA.Status.NotVerified),
            "Can only withdraw locked DSLA after the final period is verified or if the contract is breached"
        );
        stakeRegistry.returnLockedValue(address(_sla));
    }

    /**
     * @dev function to declare this SLARegistry contract as SLARegistry of _messengerAddress
     * @param _messengerAddress 1. address of the messenger
     */

    function setMessengerSLARegistryAddress(address _messengerAddress) public {
        IMessenger(_messengerAddress).setSLARegistry();
        messengerRegistry.registerMessenger(_messengerAddress, msg.sender);
    }

    /**
     * @dev public view function that returns the service level agreements that
     * the given user is the owner of
     * @param _user Address of the user for which to return the service level
     * agreements
     * @return array of SLAs
     */
    function userSLAs(address _user) public view returns (SLA[] memory) {
        uint256 count = userSLACount(_user);
        SLA[] memory SLAList = new SLA[](count);
        uint256[] memory userSLAIndexes = userToSLAIndexes[_user];

        for (uint256 i = 0; i < count; i++) {
            SLAList[i] = (SLAs[userSLAIndexes[i]]);
        }

        return (SLAList);
    }

    /**
     * @dev public view function that returns the amount of service level
     * agreements the given user is the owner of
     * @param _user 1. address of the user for which to return the amount of
     * service level agreements
     * @return uint256 corresponding to the amount of user's SLAs
     */
    function userSLACount(address _user) public view returns (uint256) {
        return userToSLAIndexes[_user].length;
    }

    /**
     * @dev public view function that returns all the service level agreements
     * @return SLA[] array of SLAs
     */
    function allSLAs() public view returns (SLA[] memory) {
        return (SLAs);
    }

    /**
     * @dev public view function that returns the total amount of service
     * level agreements
     * @return uint256, the length of SLA array
     */
    function SLACount() public view returns (uint256) {
        return SLAs.length;
    }

    /**
     * @dev public view function that returns true if _slaAddress was deployed using this SLARegistry
     * @param _slaAddress address of the SLA to be checked
     */
    function isRegisteredSLA(address _slaAddress) public view returns (bool) {
        for (uint256 index = 0; index < SLAs.length; index++) {
            if (address(SLAs[index]) == _slaAddress) {
                return true;
            }
        }
        return false;
    }
}
