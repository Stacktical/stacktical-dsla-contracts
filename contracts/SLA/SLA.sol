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

    /// @dev The time between SLI registration
    uint256 private sliInterval;

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
     * @param _sliInterval 6. uint the interval in seconds between requesting a new SLI
     * @param _baseTokenAddress 7. address of the Base Token to be unlocked for staking
     * @param _sla_period_starts 8. array with the values for the "start" of every period
     * @param _sla_period_ends 9. array with the values for the "end" of every period
     */
    constructor(
        address _owner,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint256 _stake,
        string memory _ipfsHash,
        uint256 _sliInterval,
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
        sliInterval = _sliInterval;
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
     * @dev external view function that returns the sliInterval value
     · @return uint256 value of the sliInterval
     */
    function getSliInterval() external view returns (uint256) {
        return sliInterval;
    }

    /**
     * @dev external view function that returns all agreement information
     * @return address owner
     * @return string ipfsHash
     * @return uint256 amount necessary to stake
     * @return bytes32[] SLONames array
     * @return SLO[] SLO addresses array
     */

    function getDetails()
        external
        view
        returns (
            address,
            string memory,
            uint256,
            bytes32[] memory,
            SLO[] memory
        )
    {
        SLO[] memory _SLOAddresses = new SLO[](SLONames.length);

        for (uint256 i = 0; i < SLONames.length; i++) {
            _SLOAddresses[i] = SLOs[SLONames[i]];
        }

        return (owner(), ipfsHash, stake, SLONames, _SLOAddresses);
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
