// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin-contracts/contracts/access/Ownable.sol";
import "@openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin-contracts/contracts/math/SafeMath.sol";
import "../interfaces/IMessenger.sol";
import "../Whitelist/Whitelist.sol";
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

    // The required amount to stake when subscribing to the agreement
    uint256 public stake;

    // The time between SLI registration
    uint256 private sliInterval;

    // The ipfs hash that stores extra information about the agreement
    string public ipfsHash;

    // The address of the registry contract
    SLARegistry public registry;

    // Struct used for storing registered SLI's
    struct SLI {
        uint256 timestamp;
        uint256 value;
        uint256 periodId;
    }

    // Mapping to get SLO addresses from SLO names in bytes32
    mapping(bytes32 => SLO) public SLOs;

    // Mapping to get SLI structs from SLO names in bytes32
    mapping(bytes32 => SLI[]) public SLIs;

    // Array storing the names of the SLO's of this agreement
    bytes32[] SLONames;

    /**
     * @dev event for SLI creation logging
     * @param _timestamp the time the SLI has been registered
     * @param _value the value of the SLI
     * @param _periodId the id of the given period
     */
    event SLICreated(uint256 _timestamp, uint256 _value, string _periodId);


    /**
     * @dev Throws if called by any address other than the Oraclize or
     * messenger contract.
     */
    modifier onlyMessenger() {
        require(msg.sender == address(registry.messenger()));
        _;
    }
    
    /**
     * @dev constructor
     * @param _owner the owner of the service level agreement
     * @param _SLONames the names of the service level objectives in a bytes32
     * array
     * @param _SLOs an array with the service level objective addresses
     * @param _stake the amount required to stake when subscribing to the
     * agreement
     * @param _ipfsHash the ipfs hash that stores extra information about the
     * agreement
     */
    constructor(
        address _owner,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint256 _stake,
        string memory _ipfsHash,
        uint256 _sliInterval,
        bDSLAToken _tokenAddress
    )
    public Staking(_tokenAddress){
        require(_SLOs.length < 5);
        require(_SLONames.length == _SLOs.length);

        for(uint256 i = 0; i < _SLOs.length; i++) {
            SLOs[_SLONames[i]] = _SLOs[i];
        }

        transferOwnership(_owner);
        SLONames = _SLONames;
        stake = _stake;
        ipfsHash = _ipfsHash;
        registry = SLARegistry(msg.sender);
        sliInterval = _sliInterval;
    }

    /**
     * @dev external function to register SLI's and check them against the SLO's
     * @param _SLOName the name of the SLO in bytes32
     * @param _value the value of the SLI to check
     * @param _periodId the id of the given period
     */
    function registerSLI(bytes32 _SLOName, uint256 _value, uint256 _periodId)
        external
        onlyMessenger
    {
        SLIs[_SLOName].push(SLI(block.timestamp, _value, _periodId));

        emit SLICreated(block.timestamp, _value, _periodId);

        
        if(!SLOs[_SLOName].isSLOHonored(_value)) {
            periods[_period].status = Status.NotRespected;
        }else{
            periods[_period].status = Status.Respected;
        }
    }

    /**
     * @dev external function to get SLI
     * @param _SLOName the name of the SLO in bytes32
     */
    function getSLI(bytes32 _SLOName) public view returns(SLI[] memory) {
        return SLIs[_SLOName];
    }

    /**
     * @dev external view function that returns the sliInterval value
     */
    function getSliInterval() external view returns(uint256) {
        return sliInterval;
    }

}
