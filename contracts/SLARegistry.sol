// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SLA.sol";
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
    /// @dev to check if registered SLA
    mapping(address => bool) private registeredSLAs;

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
        sloRegistry.setSLARegistry();
        periodRegistry = _periodRegistry;
        stakeRegistry = _stakeRegistry;
        stakeRegistry.setSLARegistry();
        messengerRegistry = _messengerRegistry;
        messengerRegistry.setSLARegistry();
    }

    /**
     * @dev public function for creating canonical service level agreements
     * @param _sloValue 1. -
     * @param _sloType 2. -
     * @param _ipfsHash 3. -
     * @param _periodType 4. -
     * @param _initialPeriodId 5. -
     * @param _finalPeriodId 6. -
     * @param _messengerAddress 7. -
     * @param _whitelisted 8. -
     * @param _extraData 9. -
     */
    function createSLA(
        uint256 _sloValue,
        SLORegistry.SLOType _sloType,
        bool _whitelisted,
        address _messengerAddress,
        PeriodRegistry.PeriodType _periodType,
        uint128 _initialPeriodId,
        uint128 _finalPeriodId,
        string memory _ipfsHash,
        bytes32[] memory _extraData
    ) public {
        bool validPeriod =
            periodRegistry.isValidPeriod(_periodType, _initialPeriodId);
        require(validPeriod, "First period id not valid");
        validPeriod = periodRegistry.isValidPeriod(_periodType, _finalPeriodId);
        require(validPeriod, "Final period id not valid");
        bool initializedPeriod =
            periodRegistry.isInitializedPeriod(_periodType);
        require(initializedPeriod, "Period type not initialized yet");
        require(
            _finalPeriodId >= _initialPeriodId,
            "finalPeriodId should be greater than or equal to initialPeriodId"
        );
        // UNCOMMENT THE NEXT 3 LINES BEFORE MAINNET
        // bool periodHasStarted =
        //     periodRegistry.periodHasStarted(_periodType, _initialPeriodId);
        // require(!periodHasStarted, "Period has started");
        bool registeredMessenger =
            messengerRegistry.registeredMessengers(_messengerAddress);
        require(
            registeredMessenger == true,
            "messenger address is not registered"
        );

        SLA sla =
            new SLA(
                msg.sender,
                address(sloRegistry),
                _whitelisted,
                _periodType,
                _messengerAddress,
                _initialPeriodId,
                _finalPeriodId,
                uint128(SLAs.length),
                _ipfsHash,
                _extraData
            );

        sloRegistry.registerSLO(_sloValue, _sloType, address(sla));
        stakeRegistry.lockDSLAValue(
            msg.sender,
            address(sla),
            _finalPeriodId - _initialPeriodId + 1
        );
        SLAs.push(sla);
        registeredSLAs[address(sla)] = true;
        uint256 index = SLAs.length.sub(1);
        userToSLAIndexes[msg.sender].push(index);
        emit SLACreated(sla, msg.sender);
    }

    /**
     * @dev Gets SLI information for the specified SLA and SLO
     * @param _periodId 1. id of the period
     * @param _sla 2. SLA Address
     * @param _ownerApproval 3. if approval by owner or msg.sender
     */
    function requestSLI(
        uint256 _periodId,
        SLA _sla,
        bool _ownerApproval
    ) public {
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
        IMessenger(slaMessenger).requestSLI(
            _periodId,
            address(_sla),
            _ownerApproval,
            msg.sender
        );
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
        uint256 lastValidPeriodId = _sla.finalPeriodId();
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

    function registerMessenger(
        address _messengerAddress,
        string memory _specificationUrl
    ) public {
        IMessenger(_messengerAddress).setSLARegistry();
        messengerRegistry.registerMessenger(
            msg.sender,
            _messengerAddress,
            _specificationUrl
        );
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
        return registeredSLAs[_slaAddress];
    }
}
