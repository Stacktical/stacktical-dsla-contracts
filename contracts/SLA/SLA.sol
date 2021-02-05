// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../SLO/SLO.sol";
import "../SLARegistry.sol";
import "./Staking.sol";

/**
 * @title SLA
 * @dev SLA is a service level agreement contract used for service downtime
 * compensation
 */
contract SLA is Ownable, Staking {
    using SafeMath for uint256;

    /// @dev The required amount to stake when subscribing to the agreement
    uint256 public stake;

    /// @dev The ipfs hash that stores extra information about the agreement
    string public ipfsHash;

    /// @dev The address of the registry contract
    SLARegistry public registry;

    /// @dev Struct used for storing registered SLI's
    struct SLI {
        uint256 timestamp;
        uint256 value;
        uint256 periodId;
    }

    struct SLAPeriod {
        uint256 sla_period_start;
        uint256 sla_period_end;
        uint256 claimed_reward;
        bool claimed;
        Status status;
        uint256 sli;
        uint256 timestamp;
    }

    /// @dev mapping to get SLO addresses from SLO names in bytes32
    mapping(bytes32 => SLO) public SLOs;

    /// @dev mapping to get SLI structs from SLO names in bytes32
    mapping(bytes32 => SLI[]) public SLIs;

    /// @dev array storing the names of the SLO's of this agreement
    bytes32[] public SLONames;

    /// @dev block timestamp of SLA deployment
    uint256 public blockNumberCreation;

    /**
     * @dev event for SLI creation logging
     * @param _timestamp 1. the time the SLI has been registered
     * @param _value 2. the value of the SLI
     * @param _periodId 3. the id of the given period
     */
    event SLICreated(uint256 _timestamp, uint256 _value, uint256 _periodId);

    /**
     * @dev throws if called by any address other than the messenger contract.
     */
    modifier onlyMessenger() {
        require(
            msg.sender == address(registry.messenger()),
            "Only Messenger can call this function"
        );
        _;
    }

    /**
     * @dev throws if called by any address other than the messenger contract.
     */
    modifier onlySLARegistry() {
        require(
            msg.sender == address(registry),
            "Only SLARegistry can call this function"
        );
        _;
    }

    /**
     * @param _owner 1. address of the owner of the service level agreement
     * @param _SLONames 2. array of the names of the service level objectives
     * in bytes32
     * @param _SLOs 3. array of service level objective contract addressess
     * service level objective breach
     * @param _stake 4. uint of the amount required to stake when signing the
     * service level agreement
     * @param _ipfsHash 5. string with the ipfs hash that contains extra
     * information about the service level agreement
     * @param _baseTokenAddress 6. address of the Base Token to be unlocked for staking
     * @param _sla_period_starts 7. array with the values for the "start" of every period
     * @param _sla_period_ends 8. array with the values for the "end" of every period
     */
    constructor(
        address _owner,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint256 _stake,
        string memory _ipfsHash,
        address _baseTokenAddress,
        uint256[] memory _sla_period_starts,
        uint256[] memory _sla_period_ends
    )
        public
        Staking(_baseTokenAddress, _sla_period_starts, _sla_period_ends, _owner)
    {
        require(_SLOs.length < 5, "max amount of SLOs is 5");
        require(
            _SLONames.length == _SLOs.length,
            "_SLONames and _SLOs should have the same length"
        );

        for (uint256 i = 0; i < _SLOs.length; i++) {
            SLOs[_SLONames[i]] = _SLOs[i];
        }

        transferOwnership(_owner);
        SLONames = _SLONames;
        stake = _stake;
        ipfsHash = _ipfsHash;
        registry = SLARegistry(msg.sender);
        blockNumberCreation = block.number;
    }

    /**
     * @dev external function to register SLI's and check them against the SLO's
     * @param _SLOName 1. the name of the SLO in bytes32
     * @param _value 2. the value of the SLI to check
     * @param _periodId 3. the id of the given period
     */
    function registerSLI(
        bytes32 _SLOName,
        uint256 _value,
        uint256 _periodId
    ) external onlyMessenger {
        SLIs[_SLOName].push(SLI(block.timestamp, _value, _periodId));
        periods[_periodId].sli = _value;
        periods[_periodId].timestamp = block.timestamp;

        emit SLICreated(block.timestamp, _value, _periodId);

        if (!SLOs[_SLOName].isSLOHonored(_value)) {
            periods[_periodId].status = Status.NotRespected;
        } else {
            periods[_periodId].status = Status.Respected;
        }
    }

    /**
     * @dev external function to get SLIs of certain _SLO
     * @param _SLOName 1. the name of the SLO in bytes32
     * @return SLI[] array of SLIs associated to the input SLOs
     */
    function getSLI(bytes32 _SLOName) public view returns (SLI[] memory) {
        return SLIs[_SLOName];
    }

    /**
     * @dev external view function that returns all agreement information
     * @return _slaOwner 1. address  owner
     * @return _ipfsHash 2. string  ipfsHash
     * @return _stake 3. uint256  amount necessary to stake
     * @return _SLONames 4. bytes32[]  array
     * @return _SLOAddresses 5. SLO[]  addresses array
     * @return _SLAPeriods 6. SLAPeriod[]  addresses array
     */

    function getDetails()
        external
        view
        returns (
            address _slaOwner,
            string memory _ipfsHash,
            uint256 _stake,
            bytes32[] memory _SLONames,
            SLO[] memory _SLOAddresses,
            SLAPeriod[] memory _SLAPeriods,
            uint256 _stakersCount,
            Staking.TokenStake[] memory _tokensStake
        )
    {
        _slaOwner = owner();
        _ipfsHash = ipfsHash;
        _stake = stake;
        _SLONames = SLONames;
        _SLOAddresses = new SLO[](SLONames.length);

        for (uint256 i = 0; i < SLONames.length; i++) {
            _SLOAddresses[i] = SLOs[SLONames[i]];
        }

        uint256 periodsLength = getPeriodLength();
        _SLAPeriods = new SLAPeriod[](periodsLength);
        for (uint256 index = 0; index < periodsLength; index++) {
            Staking.Period memory period = periods[index];
            _SLAPeriods[index] = SLAPeriod({
                sla_period_start: period.sla_period_start,
                sla_period_end: period.sla_period_end,
                claimed_reward: period.claimed_reward,
                claimed: period.claimed,
                status: period.status,
                sli: period.sli,
                timestamp: period.timestamp
            });
        }
        _stakersCount = stakers.length;
        _tokensStake = new Staking.TokenStake[](allowedTokens.length);
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            _tokensStake[index] = Staking.TokenStake({
                tokenAddress: allowedTokens[index],
                stake: tokensPool[allowedTokens[index]]
            });
        }
    }

    /**
     *@dev increase the _amount staked per _token of _sla
     *@param _amount 1. amount to be staked
     *@param _token 2. address of the ERC to be staked
     *@param _period 3. period id to stake
     */

    function stakeTokens(
        uint256 _amount,
        address _token,
        uint256 _period
    ) public {
        bool success = registry.registerStakedSla(msg.sender);
        require(success, "sla was not registered as staked by the msg.sender");
        _stakeTokens(_amount, _token, _period);
    }
}
