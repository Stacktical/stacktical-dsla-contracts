pragma solidity 0.5.7;

import "chainlink/contracts/ChainlinkClient.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./SLA/SLA.sol";

/**
 * @title SLARegistry
 * @dev SLARegistry is a contract for handling creation of service level
 * agreements and keeping track of the created agreements
 */
contract SLARegistry is ChainlinkClient {

    // Chainlink Ropsten JobIDs
    bytes32 constant GET_BYTES32_JOB = bytes32("5b280bfed77646d297fdb6e718c7127a");
    bytes32 constant POST_BYTES32_JOB = bytes32("469e74c5bca740c0addba9ea67eecc51");
    bytes32 constant INT256_JOB = bytes32("93032b68d4704fa6be2c3ccf7a23c107");
    bytes32 constant INT256_MUL_JOB = bytes32("e055293deb37425ba83a2d5870c57649");
    bytes32 constant UINT256_JOB = bytes32("fb5fb7b18921487fb26503cb075abf41");
    bytes32 constant UINT256_MUL_JOB = bytes32("493610cff14346f786f88ed791ab7704");
    bytes32 constant BOOL_JOB = bytes32("7ac0b3beac2c448cb2f6b2840d61d31f");

    // TEMPORARY RANDOM JOB
    bytes32 constant RANDOM_JOB = bytes32("75e0a756bbcc48678c498802a7c5929b");

    using SafeMath for uint256;

    // Array that stores the addresses of created service level agreements
    SLA[] public SLAs;

    // struct that stores information regarding a chainlink request
    struct Request {
        SLA sla;
        bytes32 sloName;
        uint timestamp;
    }

    // Mapping that stores the indexes of service level agreements owned by a user
    mapping(address => uint[]) private userToSLAIndexes;

    // Mapping that stores chainlink request information
    mapping(bytes32 => Request) private requestIdToRequest;

    /**
     * @dev event for service level agreement creation logging
     * @param sla The address of the created service level agreement contract
     * @param owner The address of the owner of the service level agreement
     */
    event SLACreated(SLA indexed sla, address indexed owner);

    /**
     * @dev constructor
     * @param _chainlinkToken the address of the LINK token
     * @param _chainlinkOracle the address of the oracle to create requests to
     */
    constructor(
        address _chainlinkToken,
        address _chainlinkOracle
    ) public {
        setChainlinkToken(_chainlinkToken);
        setChainlinkOracle(_chainlinkOracle);
    }

    /**
     * @dev public function for creating service level agreements
     * @param _owner Address of the owner of the service level agreement
     * @param _whitelist Address of the whitelist contract
     * @param _dsla Address of the DSLA token contract
     * @param _SLONames Array of the names of the service level objectives
     * in bytes32
     * @param _SLOs Array of service level objective contract addressess
     * @param _compensationAmount Uint of the amount of DSLA to compensate on
     * service level objective breach
     * @param _stake Uint of the amount required to stake when signing the
     * service level agreement
     * @param _ipfsHash String with the ipfs hash that contains extra
     * information about the service level agreement
     */
    function createSLA(
        address _owner,
        Whitelist _whitelist,
        IERC20 _dsla,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint _compensationAmount,
        uint _stake,
        string memory _ipfsHash,
        uint _poolSize
    ) public {
        require(_dsla.allowance(msg.sender, address(this)) >= _poolSize);

        SLA sla = new SLA(
            _owner,
            _whitelist,
            _dsla,
            _SLONames,
            _SLOs,
            _compensationAmount,
            _stake,
            _ipfsHash
        );

        _dsla.transferFrom(msg.sender, address(sla), _poolSize);

        uint index = SLAs.push(sla).sub(1);

        userToSLAIndexes[msg.sender].push(index);

        for(uint i = 0; i < _SLOs.length; i++) {
            requestSLI(sla, _SLOs[i], now);
        }

        emit SLACreated(sla, _owner);
    }

    /**
     * @dev Creates a ChainLink request to get a new SLI value for the
     * given params
     * @param _sla the SLA to get the SLI valye for
     * @param _sloName the SLO name to get the SLI value for
     * @param _previousTimeStamp the timestamp of the previous request
     */
    function requestSLI(SLA _sla, bytes32 _sloName, uint _previousTimeStamp)
        internal
    {
        uint newTimestamp = _previousTimeStamp + 5 minutes;

        // newRequest takes a JobID, a callback address, and callback function as input
        // Chainlink.Request memory req = buildChainlinkRequest(UINT256_MUL_JOB, this, this.fulfill.selector);

        // req.add("get", "https://stacktical.com/agreement");
        // req.add("path", _sla);
        // req.add("path", string(_sloName));

        // TEMPORARY RANDOM VALUE
        Chainlink.Request memory req = newRequest(JOB_ID, this, this.fulfillSLI.selector);
        req.addUint("min", 98);
        req.addUint("max", 100);

        // Delay the request
        req.addUint("until", newTimestamp);
        // Multiply the value with 1000
        req.addInt("times", 1000);
        // Sends the request with 1 LINK to the oracle contract
        bytes32 requestId = sendChainlinkRequest(req, 1 * LINK);


        requestIdToRequest[requestId] = new Request(_sla, _sloName, newTimestamp);
    }

    /**
     * @dev The callback function for the Chainlink SLI request which stores
     * the SLI in the SLA contract
     * @param _requestId the ID of the ChainLink request
     * @param _sliValue the SLI value returned by ChainLink
     */
    function fulfillSLI(bytes32 _requestId, uint _sliValue)
        // Use recordChainlinkFulfillment to ensure only the requesting oracle can fulfill
        public
        recordChainlinkFulfillment(_requestId)
    {
        Request request = requestIdToRequest[_requestId];

        request.sla.registerSLI(request.sloName, _sliValue, "");

        requestSLI(request.sla, request.sloName, request.timestamp);
    }

    /**
     * @dev public view function that returns the service level agreements that
     * the given user is the owner of
     * @param _user Address of the user for which to return the service level
     * agreements
     */
    function userSLAs(address _user) public view returns(SLA[] memory) {
        uint count = userSLACount(_user);
        SLA[] memory SLAList = new SLA[](count);
        uint[] memory userSLAIndexes = userToSLAIndexes[_user];

        for(uint i = 0; i < count; i++) {
            SLAList[i] = (SLAs[userSLAIndexes[i]]);
        }

        return(SLAList);
    }

    /**
     * @dev public view function that returns the amount of service level
     * agreements the given user is the owner of
     * @param _user Address of the user for which to return the amount of
     * service level agreements
     */
    function userSLACount(address _user) public view returns(uint) {
        return userToSLAIndexes[_user].length;
    }

    /**
     * @dev public view function that returns all the service level agreements
     */
    function allSLAs() public view returns(SLA[] memory) {
        return(SLAs);
    }

    /**
     * @dev public view function that returns the total amount of service
     * level agreements
     */
    function SLACount() public view returns(uint) {
        return SLAs.length;
    }

    /**
     * @dev external view function that returns the service level agreements for
     * a certain range in the array
     * @param _start the index of the start position in the array
     * @param _end the index of the end position in the array
     */
    function paginatedSLAs(uint _start, uint _end) external view returns(SLA[] memory) {
        require(_start <= _end);

        SLA[] memory SLAList = new SLA[](_end.sub(_start).add(1));

        for(uint i = 0; i < _end.sub(_start).add(1); i++) {
            SLAList[i] = (SLAs[i.add(_start)]);
        }

        return(SLAList);
    }
}
