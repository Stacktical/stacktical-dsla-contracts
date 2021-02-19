pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "../SLA.sol";
import "../SLO.sol";
import "../PeriodRegistry.sol";
import "../StringUtils.sol";
import "./NetworkAnalytics.sol";
import "../messenger/IMessenger.sol";

/**
 * @title SEMessenger
 * @dev Staking efficiency Messenger
 */

contract SEMessenger is ChainlinkClient, IMessenger, StringUtils {
    /// @dev Mapping that stores chainlink sli request information
    mapping(bytes32 => SLIRequest) public requestIdToSLIRequest;
    /// @dev Array with all request IDs
    bytes32[] public requests;
    /// @dev The address of the SLARegistry contract
    address public slaRegistryAddress;
    /// @dev Network analytics contract address
    address public networkAnalyticsAddress;
    /// @dev Chainlink oracle address
    address public oracle;
    /// @dev chainlink jobId
    bytes32 public jobId;
    /// @dev fee for Chainlink querys. Currently 0.1 LINK
    uint256 public fee = 0.1 * 10**18;

    /**
     * @dev parameterize the variables according to network
     * @notice sets the Chainlink parameters (oracle address, token address, jobId) and sets the SLARegistry to 0x0 address
     * @param _chainlinkOracle 1. the address of the oracle to create requests to
     * @param _chainlinkToken 2. the address of LINK token contract
     * @param _jobId 3. the job id for Staking efficiency job
     * @param _networkAnalyticsAddress 4. Network analytics contract address
     */
    constructor(
        address _chainlinkOracle,
        address _chainlinkToken,
        bytes32 _jobId,
        address _networkAnalyticsAddress
    ) public {
        jobId = _jobId;
        setChainlinkToken(_chainlinkToken);
        oracle = _chainlinkOracle;
        networkAnalyticsAddress = _networkAnalyticsAddress;
    }

    /// @dev Throws if called by any address other than the SLARegistry contract or Chainlink Oracle.
    modifier onlySLARegistry() {
        require(
            msg.sender == slaRegistryAddress,
            "Can only be called by SLARegistry"
        );
        _;
    }

    /**
     * @dev sets the SLARegistry contract address and can only be called
     * once
     */
    function setSLARegistry() public override {
        // Only able to trigger this function once
        require(
            slaRegistryAddress == address(0),
            "SLARegistry address has already been set"
        );

        slaRegistryAddress = msg.sender;
    }

    /**
     * @dev creates a ChainLink request to get a new SLI value for the
     * given params. Can only be called by the SLARegistry contract or Chainlink Oracle.
     * @param _periodId value of the period id
     * @param _slaAddress SLA Address
     */

    function requestSLI(uint256 _periodId, address _slaAddress)
        public
        override
        onlySLARegistry
    {
        SLA sla = SLA(_slaAddress);
        PeriodRegistry.PeriodType periodType = sla.periodType();
        // extraData[0] is the networkName for StakingEfficiency use case
        bytes32 networkName = sla.extraData(0);
        bytes32 ipfsAnalytics =
            NetworkAnalytics(networkAnalyticsAddress).periodAnalytics(
                networkName,
                periodType,
                _periodId
            );
        require(
            ipfsAnalytics != 0,
            "Network analytics object is not assigned yet"
        );
        Chainlink.Request memory request =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.fulfillSLI.selector
            );
        request.add("job_type", "staking_efficiency");
        request.add("period_id", _uintToStr(_periodId));
        request.add("sla_address", _addressToString(_slaAddress));
        request.add(
            "network_analytics_address",
            _addressToString(networkAnalyticsAddress)
        );

        // Sends the request with 0.1 LINK to the oracle contract
        bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);

        requests.push(requestId);

        requestIdToSLIRequest[requestId] = SLIRequest({
            slaAddress: _slaAddress,
            periodId: _periodId
        });
    }

    /**
     * @dev callback function for the Chainlink SLI request which stores
     * the SLI in the SLA contract
     * @param _requestId the ID of the ChainLink request
     * @param _chainlinkResponse response object from Chainlink Oracles
     */
    function fulfillSLI(bytes32 _requestId, bytes32 _chainlinkResponse)
        public
        override
        recordChainlinkFulfillment(_requestId)
    {
        SLIRequest memory request = requestIdToSLIRequest[_requestId];
        emit SLIReceived(
            request.slaAddress,
            request.periodId,
            _requestId,
            _chainlinkResponse
        );
        (uint256 hits, uint256 misses) = parseSLIData(_chainlinkResponse);
        uint256 total = hits.add(misses);
        uint256 stakingEfficiency = hits.mul(100 * 1000).div(total);
        SLA(request.slaAddress).registerSLI(
            stakingEfficiency,
            request.periodId
        );
    }

    /**
     * @dev recieves a string of "hits,misses" data and returns hits and misses as uint256
     * @param sliData the ID of the ChainLink request
     */
    function parseSLIData(bytes32 sliData)
        public
        pure
        returns (uint256, uint256)
    {
        bytes memory bytesSLIData = bytes(_bytes32ToStr(sliData));
        uint256 sliDataLength = bytesSLIData.length;
        bytes memory bytesHits = new bytes(sliDataLength);
        bytes memory bytesMisses = new bytes(sliDataLength);
        for (uint256 index; index < sliDataLength; index++) {
            if (bytesSLIData[index] == bytes1(",")) {
                for (uint256 index2 = 0; index2 < index; index2++) {
                    bytesHits[index2] = bytesSLIData[index2];
                }
                for (
                    uint256 index3 = 0;
                    index3 < sliDataLength - index - 1;
                    index3++
                ) {
                    bytesMisses[index3] = bytesSLIData[index + 1 + index3];
                }
            }
        }
        uint256 hits = _bytesToUint(bytesHits);
        uint256 misses = _bytesToUint(bytesMisses);
        return (hits, misses);
    }
}
