pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./SLA/SLA.sol";
import "./StringUtils.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";

/**
* @title Messenger
* @notice Messenger is a contract to interact with an Oracle and request SLI information to Stacktical API
on a decentralized fashion. Is not meant to be interacted directly.
* @dev This contract is attached immediately after deployment to a SLARegistry
*/

contract Messenger is ChainlinkClient, StringUtils {
    /// @dev stores information regarding a chainlink request
    struct Request {
        SLA sla;
        bytes32 sloName;
        uint256 periodId;
    }

    /// @dev Mapping that stores chainlink request information
    mapping(bytes32 => Request) public requestIdToRequest;
    /// @dev Array with all request IDs
    bytes32[] public requests;
    /// @dev The address of the SLARegistry contract
    address public SLARegistry;
    /// @dev Chainlink oracle address
    address public oracle;
    /// @dev chainlink jobId
    bytes32 public jobId;
    /// @dev fee for Chainlink querys. Currently 0.1 LINK
    uint256 public fee = 0.1 * 10**18;
    /// @dev api url stated on deployment time
    string public apiURL = "";

    /**
     * @dev event emitted when having a response from Chainlink with the SLI
     * @param slaAddress 1. SLA address to store the SLI
     * @param hits 2. SLI value
     * @param misses 3. SLI value
     * @param sliValue 4. SLI value
     * @param sloName 5. SLO name
     * @param periodId 6. id of the period
     */
    event SLIReceived(
        address slaAddress,
        uint256 hits,
        uint256 misses,
        uint256 sliValue,
        bytes32 sloName,
        uint256 periodId
    );

    /**
     * @dev parameterize the variables according to network
     * @notice sets the Chainlink parameters (oracle address, token address, jobId) and sets the SLARegistry to 0x0 address
     * @param _chainlinkOracle the address of the oracle to create requests to
     * @param _chainlinkToken the address of LINK token contract
     * @param _jobId the job id for the HTTPGet job
     */
    constructor(
        string memory _apiUrl,
        address _chainlinkOracle,
        address _chainlinkToken,
        bytes32 _jobId
    ) public {
        jobId = _jobId;
        setChainlinkToken(_chainlinkToken);
        oracle = _chainlinkOracle;
        SLARegistry = address(0);
        apiURL = _apiUrl;
    }

    /// @dev Throws if called by any address other than the SLARegistry contract or Chainlink Oracle.
    modifier onlyAllowedAddresses() {
        require(
            msg.sender == SLARegistry || msg.sender == chainlinkOracleAddress(),
            "Can only be called by connected SLARegistry or Chainlink Oracle"
        );
        _;
    }

    /**
     * @dev creates a ChainLink request to get a new SLI value for the
     * given params. Can only be called by the SLARegistry contract or Chainlink Oracle.
     * @param _periodId value of the period id
     * @param _sla SLA Address
     * @param _sloName the SLO name to get the SLI value for
     */

    function requestSLI(
        uint256 _periodId,
        SLA _sla,
        bytes32 _sloName
    ) public onlyAllowedAddresses {
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.fulfillSLI.selector
            );

        // Get the period start and end
        (uint256 sla_monitoring_start, uint256 sla_monitoring_end) =
            SLA(_sla).getPeriodData(_periodId);
        request.add("sla_monitoring_start", _uintToStr(sla_monitoring_start));
        request.add("sla_monitoring_end", _uintToStr(sla_monitoring_end));
        request.add("sla_address", _addressToString(address(_sla)));

        // Sends the request with 0.1 LINK to the oracle contract
        bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);

        requests.push(requestId);

        requestIdToRequest[requestId] = Request(_sla, _sloName, _periodId);
    }

    /**
     * @dev callback function for the Chainlink SLI request which stores
     * the SLI in the SLA contract
     * @param _requestId the ID of the ChainLink request
     * @param _chainlinkResponse response object from Chainlink Oracles
     */
    function fulfillSLI(bytes32 _requestId, bytes32 _chainlinkResponse)
        public
        recordChainlinkFulfillment(_requestId)
    {
        Request memory request = requestIdToRequest[_requestId];
        string memory sliData = _bytes32ToString(_chainlinkResponse);
        (uint256 hits, uint256 misses) = _parseSLIData(sliData);
        uint256 num = hits.mul(100 * 1000);
        uint256 total = hits.add(misses);
        uint256 efficiency = num.div(total);
        emit SLIReceived(
            address(request.sla),
            hits,
            misses,
            efficiency,
            request.sloName,
            request.periodId
        );

        request.sla.registerSLI(request.sloName, efficiency, request.periodId);
    }

    /**
     * @dev sets the SLARegistry contract address and can only be called
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
     * @param _slaAddress address of the SLA Contract
     * @param _periodId id of the period
     */
    function getPeriod(address _slaAddress, uint256 _periodId)
        public
        view
        returns (uint256 start, uint256 end)
    {
        (start, end) = SLA(_slaAddress).getPeriodData(_periodId);
    }
}
