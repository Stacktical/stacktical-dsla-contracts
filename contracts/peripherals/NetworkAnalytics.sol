pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../StringUtils.sol";
import "../PeriodRegistry.sol";

/**
 * @title NetworkAnalytics
 * @dev contract to get the network analytics for the staking efficiency use case
 */

contract NetworkAnalytics is Ownable, ChainlinkClient, StringUtils {
    struct AnalyticsRequest {
        bytes32 networkName;
        uint256 periodId;
        PeriodRegistry.PeriodType periodType;
    }

    /// @dev Period registry
    PeriodRegistry private periodRegistry;
    /// @dev bytes32 to store the available network names
    bytes32[] public networkNames;
    /// @dev (networkName=>periodType=>periodId=>bytes32) to store ipfsHash of the analytics corresponding to periodId
    mapping(bytes32 => mapping(PeriodRegistry.PeriodType => mapping(uint256 => bytes32)))
        public periodAnalytics;

    /// @dev Mapping that stores chainlink analytics request information
    mapping(bytes32 => AnalyticsRequest) public requestIdToAnalyticsRequest;
    /// @dev Array with all request IDs
    bytes32[] public requests;
    /// @dev Chainlink oracle address
    address public oracle;
    /// @dev chainlink jobId
    bytes32 public jobId;
    /// @dev fee for Chainlink querys. Currently 0.1 LINK
    uint256 public fee = 0.1 * 10**18;

    /**
     * @dev event emitted when having a response from Chainlink with the SLI
     * @param networkName 1. network name
     * @param periodType 2. id of the period
     * @param periodId 3. id of the period
     * @param ipfsHash 4. hash of the ipfs object
     */
    event AnalyticsReceived(
        bytes32 networkName,
        PeriodRegistry.PeriodType periodType,
        uint256 periodId,
        bytes32 ipfsHash
    );

    /**
     * @dev parameterize the variables according to network
     * @notice sets the Chainlink parameters (oracle address, token address, jobId) and sets the SLARegistry to 0x0 address
     * @param _chainlinkOracle 1. the address of the oracle to create requests to
     * @param _chainlinkToken 2. the address of LINK token contract
     * @param _jobId 3. the job id for the HTTPGet job
     * @param _periodRegistry 4. the job id for the HTTPGet job
     */
    constructor(
        address _chainlinkOracle,
        address _chainlinkToken,
        bytes32 _jobId,
        PeriodRegistry _periodRegistry
    ) public {
        jobId = _jobId;
        setChainlinkToken(_chainlinkToken);
        oracle = _chainlinkOracle;
        periodRegistry = _periodRegistry;
    }

    function isValidNetwork(bytes32 _networkName) public view returns (bool) {
        for (uint256 index; index < networkNames.length; index++) {
            if (networkNames[index] == _networkName) return true;
        }
        return false;
    }

    /**
     * @dev function to add a valid network name
     * @param _networkName 1. bytes32 network name
     */
    function addNetwork(bytes32 _networkName) public onlyOwner returns (bool) {
        require(
            isValidNetwork(_networkName) == false,
            "Network name already registered"
        );
        networkNames.push(_networkName);
        return false;
    }

    /**
     * @dev Request analytics object for the current period.
     * @param _periodId 1. id of the canonical period to be analyzed
     * @param _periodType 2. type of period to be queried
     * @param _networkName 3. network name to publish analytics
     */
    function requestAnalytics(
        uint256 _periodId,
        PeriodRegistry.PeriodType _periodType,
        bytes32 _networkName
    ) public {
        require(isValidNetwork(_networkName), "Invalid network name");
        bool periodIsFinished =
            periodRegistry.periodIsFinished(_periodType, _periodId);
        require(periodIsFinished == true, "Period has not finished yet");
        require(
            periodAnalytics[_networkName][_periodType][_periodId] == "",
            "Analytics object already published"
        );

        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.fulFillAnalytics.selector
            );

        (uint256 start, uint256 end) =
            periodRegistry.getPeriodStartAndEnd(_periodType, _periodId);

        request.add("job_type", "staking_efficiency_analytics");
        request.add("network_name", _bytes32ToStr(_networkName));
        request.add("period_id", _uintToStr(_periodId));
        request.add("period_type", _uintToStr(uint256(uint8(_periodType))));
        request.add("sla_monitoring_start", _uintToStr(start));
        request.add("sla_monitoring_end", _uintToStr(end));

        // Sends the request with 0.1 LINK to the oracle contract
        bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);
        requests.push(requestId);
        requestIdToAnalyticsRequest[requestId] = AnalyticsRequest({
            networkName: _networkName,
            periodId: _periodId,
            periodType: _periodType
        });
    }

    /**
     * @dev callback function for the Chainlink SLI request which stores
     * the SLI in the SLA contract
     * @param _requestId the ID of the ChainLink request
     * @param _chainlinkResponse response object from Chainlink Oracles
     */
    function fulFillAnalytics(bytes32 _requestId, bytes32 _chainlinkResponse)
        public
        recordChainlinkFulfillment(_requestId)
    {
        AnalyticsRequest memory request =
            requestIdToAnalyticsRequest[_requestId];

        emit AnalyticsReceived(
            request.networkName,
            request.periodType,
            request.periodId,
            _chainlinkResponse
        );

        periodAnalytics[request.networkName][request.periodType][
            request.periodId
        ] = _chainlinkResponse;
    }
}
