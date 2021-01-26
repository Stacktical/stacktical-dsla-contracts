// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Messenger.sol";
import "./SLA/SLA.sol";
import "./SLO/SLO.sol";
import "./SLA/Staking.sol";

/**
 * @title SLARegistry
 * @dev SLARegistry is a contract for handling creation of service level
 * agreements and keeping track of the created agreements
 */
contract SLARegistry {
    using SafeMath for uint256;
    bytes4 private constant NAME_SELECTOR = bytes4(keccak256(bytes("name()")));

    /// @dev struct to return on getActivePool function.
    struct ActivePool {
        address SLAaddress;
        uint256 stake;
        string assetName;
        address assetAddress;
    }

    /// @dev struct to store the start and end of the periods
    struct CanonicalPeriod {
        uint256 start;
        uint256 end;
    }

    /// @dev mapping periodId=>CanonicalPeriod to check if SLA is registered
    mapping(uint256 => CanonicalPeriod) public canonicalPeriods;

    /// @dev mapping periodId=>CanonicalPeriod to check if SLA is registered
    uint256 public canonicalPeriodLastID;

    /// @dev mapping networkName=>periodId=>bytes32 to store ipfsHash of the analytics corresponding to periodId
    mapping(bytes32 => mapping(uint256 => bytes32))
        public canonicalPeriodsAnalytics;

    /// @dev Messenger of the SLA Registry
    Messenger public messenger;

    /// @dev stores the addresses of created SLAs
    SLA[] public SLAs;

    /// @dev mapping SLA=>bool to check if SLA is registered
    mapping(address => bool) public registeredSLAs;

    /// @dev bytes32 to store the available network names
    bytes32[] public networkNames;

    /// @dev mapping SLA=>bool to store the if the network is valid
    mapping(bytes32 => bool) public validNetworks;

    /// @dev stores the indexes of service level agreements owned by an user
    mapping(address => uint256[]) private userToSLAIndexes;

    /// @dev mapping userAddress => SLA[]
    mapping(address => SLA[]) public userStakedSlas;

    modifier onlyRegisteredSla {
        require(registeredSLAs[msg.sender] == true, "Only for registered SLAs");
        _;
    }

    /**
     * @dev event for service level agreement creation logging
     * @param sla 1. The address of the created service level agreement contract
     * @param owner 2. The address of the owner of the service level agreement
     */
    event SLACreated(SLA indexed sla, address indexed owner);

    /**
     * @dev constructor
     * @param _messengerAddress 1. the address of the chainlink messenger contract
     * @param _sla_week_period_starts 3. array of the starts of the weeks period
     * @param _sla_week_period_ends 4. array of the ends of the weeks period
     * @param _networkNames 5. array of bytes32 with the names of the valid networks
     */
    constructor(
        Messenger _messengerAddress,
        uint256[] memory _sla_week_period_starts,
        uint256[] memory _sla_week_period_ends,
        bytes32[] memory _networkNames
    ) public {
        require(
            _sla_week_period_starts.length == _sla_week_period_ends.length,
            "Periods starts and ends lengths should match"
        );
        for (
            uint256 index = 0;
            index < _sla_week_period_starts.length;
            index++
        ) {
            require(
                _sla_week_period_starts[index] < _sla_week_period_ends[index],
                "Period end should be greater than period start"
            );
            canonicalPeriods[index] = CanonicalPeriod({
                start: _sla_week_period_starts[index],
                end: _sla_week_period_ends[index]
            });
        }
        messenger = _messengerAddress;
        messenger.setSLARegistry();
        networkNames = _networkNames;
        canonicalPeriodLastID = _sla_week_period_starts.length - 1;
    }

    /**
     * @dev public function for creating canonical service level agreements
     * @param _owner 1. address of the owner of the service level agreement
     * @param _SLONames 2. array of the names of the service level objectives
     * in bytes32
     * @param _SLOs 3. array of service level objective contract addressess
     * service level objective breach
     * @param _stake 4. uint of the amount required to stake when signing the
     * service level agreement
     * @param _ipfsHash 5. string with the ipfs hash that contains extra information about the service level agreement
     * @param _baseTokenAddress 6. address of the base token
     * @param _periodIds 7. array of week ids to look in the
     */
    function createSLA(
        address _owner,
        bytes32[] calldata _SLONames,
        SLO[] calldata _SLOs,
        uint256 _stake,
        string memory _ipfsHash,
        address _baseTokenAddress,
        uint256[] calldata _periodIds
    ) public {
        require(_periodIds.length > 0, "Periods information is empty");

        uint256[] memory period_starts = new uint256[](_periodIds.length);
        uint256[] memory period_ends = new uint256[](_periodIds.length);
        for (uint256 index = 0; index < _periodIds.length; index++) {
            CanonicalPeriod memory period = canonicalPeriods[_periodIds[index]];
            period_starts[index] = period.start;
            period_ends[index] = period.end;
        }
        SLA sla =
            new SLA(
                _owner,
                _SLONames,
                _SLOs,
                _stake,
                _ipfsHash,
                _baseTokenAddress,
                period_starts,
                period_ends
            );

        SLAs.push(sla);
        registeredSLAs[address(sla)] = true;
        uint256 index = SLAs.length.sub(1);

        userToSLAIndexes[msg.sender].push(index);

        emit SLACreated(sla, _owner);
    }

    /**
     * @dev Gets SLI information for the specified SLA and SLO
     * @param _periodId 1. id of the period
     * @param _sla 2. SLA Address
     * @param _sloName 3. SLO Name
     * @notice it will revert if the SLO is not registered in the SLA
     */
    function requestSLI(
        uint256 _periodId,
        SLA _sla,
        bytes32 _sloName
    ) public {
        require(
            address(SLA(_sla).SLOs(_sloName)) != address(0),
            "_sloName does not exist in the SLA contract"
        );
        (, uint256 sla_period_end, , , Staking.Status status, , ) =
            _sla.periods(_periodId);
        require(
            status == Staking.Status.NotVerified,
            "SLA contract was already verified for the period"
        );
        require(
            sla_period_end < block.timestamp,
            "SLA contract period has not finished yet"
        );
        messenger.requestSLI(_periodId, _sla, _sloName);
    }

    function isValidNetwork(bytes32 _networkName) internal view returns (bool) {
        for (uint256 index; index < networkNames.length; index++) {
            if (networkNames[index] == _networkName) return true;
        }
        return false;
    }

    /**
     * @dev Gets SLI information for the specified SLA and SLO
     * @param _canonicalPeriodId 1. id of the canonical period to be analyzed
     * @param _network 2. network name to publish analytics
     */
    function requestAnalytics(uint256 _canonicalPeriodId, bytes32 _network)
        public
    {
        require(isValidNetwork(_network), "Network name not recognized");
        CanonicalPeriod memory period = canonicalPeriods[_canonicalPeriodId];
        require(period.end < block.timestamp, "Period has not finished yet");
        require(
            canonicalPeriodsAnalytics[_network][_canonicalPeriodId] == "",
            "Analytics object already published"
        );
        messenger.requestAnalytics(_canonicalPeriodId, _network);
    }

    /**
     * @dev Gets SLI information for the specified SLA and SLO
     * @param _ipfsHash 1. id of the canonical period to be analyzed
     * @param _network 2. network name to publish analytics
     */
    function publishAnalyticsHash(
        bytes32 _ipfsHash,
        bytes32 _network,
        uint256 _periodId
    ) public {
        require(
            address(messenger) == msg.sender,
            "Can only be called by the Messenger contract"
        );
        canonicalPeriodsAnalytics[_network][_periodId] = _ipfsHash;
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
     *@dev public view function that returns true if the _owner has staked on _sla
     *@param _user 1. address to check
     *@param _sla 2. sla to check
     *@return bool, true if _sla was staked by _user
     */
    function slaWasStakedByUser(address _user, address _sla)
        public
        view
        returns (bool)
    {
        for (uint256 index = 0; index < userStakedSlas[_user].length; index++) {
            if (address(userStakedSlas[_user][index]) == _sla) {
                return true;
            }
        }
        return false;
    }

    /**
     *@dev register the sending SLA contract as staked by _owner
     *@param _owner 1. SLA contract to stake
     */
    function registerStakedSla(address _owner)
        public
        onlyRegisteredSla
        returns (bool)
    {
        if (slaWasStakedByUser(_owner, msg.sender) == false) {
            userStakedSlas[_owner].push(SLA(msg.sender));
        }
        return true;
    }

    /**
     * @dev returns the active pools owned by a user.
     * @param _slaOwner 1. owner of the active pool
     * @return ActivePool[], array of structs: {SLAaddress,stake,assetName}
     */
    function getActivePool(address _slaOwner)
        public
        view
        returns (ActivePool[] memory)
    {
        uint256 stakeCounter = 0;
        // Count the stakes of the user, checking every SLA staked
        for (
            uint256 index = 0;
            index < userStakedSlas[_slaOwner].length;
            index++
        ) {
            SLA currentSLA = SLA(userStakedSlas[_slaOwner][index]);
            stakeCounter = stakeCounter.add(
                currentSLA.getTokenStakeLength(_slaOwner)
            );
        }

        ActivePool[] memory activePools = new ActivePool[](stakeCounter);
        // to insert on activePools array
        uint256 stakePosition = 0;
        for (
            uint256 index = 0;
            index < userStakedSlas[_slaOwner].length;
            index++
        ) {
            SLA currentSLA = userStakedSlas[_slaOwner][index];
            for (
                uint256 tokenIndex = 0;
                tokenIndex < currentSLA.getTokenStakeLength(_slaOwner);
                tokenIndex++
            ) {
                (address tokenAddress, uint256 stake) =
                    currentSLA.getTokenStake(_slaOwner, tokenIndex);
                (, bytes memory tokenNameBytes) =
                    tokenAddress.staticcall(
                        abi.encodeWithSelector(NAME_SELECTOR)
                    );
                ActivePool memory currentActivePool =
                    ActivePool({
                        SLAaddress: address(currentSLA),
                        stake: stake,
                        assetName: string(tokenNameBytes),
                        assetAddress: tokenAddress
                    });
                activePools[stakePosition] = currentActivePool;
                stakePosition = stakePosition.add(1);
            }
        }
        return activePools;
    }
}
