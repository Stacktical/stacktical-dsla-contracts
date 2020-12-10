pragma solidity ^0.6.0;

import "./SLA/SLA.sol";
import "./StringUtils.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

contract Messenger is ChainlinkClient, StringUtils {
    // struct that stores information regarding a chainlink request
    struct Request {
        SLA sla;
        bytes32 sloName;
        uint256 periodId;
    }

    // Mapping that stores chainlink request information
    mapping(bytes32 => Request) public requestIdToRequest;

    // Array with all request IDs
    bytes32[] public requests;

    // The address of the SLARegistry contract
    address public SLARegistry;
    uint256[] public results;

    // jobId corresponds to API call
    address private oracle;
    bytes32 private jobId = "29fa9aa13bf1468788b7cc4a500a45b8";
    uint256 private fee = 0.1 * 10**18; // 0.1 LINK;

    /**
     * @dev event emitted when having a response from Chainlink with the SLI
     */
    event SLIReceived(
        address slaAdress,
        uint256 sliValue,
        bytes32 sloName,
        uint256 _periodId
    );

    /**
     * @dev constructor
     * @param _chainlinkOracle the address of the oracle to create requests to
     */
    constructor(address _chainlinkOracle) public {
        setPublicChainlinkToken();
        oracle = _chainlinkOracle;
        SLARegistry = address(0);
    }

    /**
     * @dev Throws if called by any address other than the registry contract.
     */
    modifier onlySLARegistry() {
        require(
            msg.sender == SLARegistry || msg.sender == chainlinkOracleAddress(),
            "Can only be called by connected SLARegistry"
        );
        _;
    }

    /**
     * @dev Creates a ChainLink request to get a new SLI value for the
     * given params
     * @param _periodId bytes32 value of the period id
     * @param _sla SLA Address
     * @param _sloName the SLO name to get the SLI value for
     */

    function requestSLI(
        uint256 _periodId,
        SLA _sla,
        bytes32 _sloName
    ) public onlySLARegistry {
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.fulfillSLI.selector
            );

        // Get the period start and end
        (uint256 startPeriod, uint256 endPeriod) =
            SLA(_sla).getPeriodData(_periodId);

        // State the query string, transforming address and uint to strings
        string memory query =
            _encodeQuery(
                _addressToString(address(_sla)),
                _uintTostr(startPeriod),
                _uintTostr(endPeriod)
            );
        request.add("get", query);

        // Adds an integer with the key "times" to the request parameters
        request.addInt("times", 1000);

        // States the path to the data, i.e. {data:{getSLI:value}}
        request.add("path", "data.getSLI");

        // Sends the request with 1 LINK to the oracle contract
        bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);

        requests.push(requestId);

        requestIdToRequest[requestId] = Request(_sla, _sloName, _periodId);
    }

    /**
     * @dev The callback function for the Chainlink SLI request which stores
     * the SLI in the SLA contract
     * @param _requestId the ID of the ChainLink request
     * @param _sliValue the SLI value returned by ChainLink
     */
    function fulfillSLI(bytes32 _requestId, uint256 _sliValue)
        public
        // Use recordChainlinkFulfillment to ensure only the requesting oracle can fulfill
        recordChainlinkFulfillment(_requestId)
    {
        Request memory request = requestIdToRequest[_requestId];

        request.sla.registerSLI(request.sloName, _sliValue, request.periodId);

        results.push(_sliValue);

        emit SLIReceived(
            address(request.sla),
            _sliValue,
            request.sloName,
            request.periodId
        );
    }

    /**
     * @dev This sets the SLARegistry contract address and can only be called
     * once
     */
    function setSLARegistry() public {
        // Only able to trigger this function once
        require(
            SLARegistry == address(0),
            "SLARegistry address has already been set"
        );

        SLARegistry = msg.sender;
    }

    /**
     * @dev gets the start and end of a given SLA on a given period
     */
    function getPeriod(address _slaAddress, uint256 _periodId)
        public
        view
        returns (uint256 start, uint256 end)
    {
        (start, end) = SLA(_slaAddress).getPeriodData(_periodId);
    }
}
