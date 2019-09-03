pragma solidity 0.5.7;

import "../SLA/SLA.sol";

interface IMessenger {

    /**
     * @dev Creates an Oraclize request to get a new SLI value for the
     * given params
     * @param _sla the SLA to get the SLI values for
     * @param _sloName the SLO name to get the SLI values for
     * @param _interval the interval in seconds between requesting a new SLI
     */
    function initializeSLIRegistering(
        SLA _sla,
        bytes32 _sloName,
        uint _interval
    )  external;

    /**
     * @dev Creates an Oraclize request to get a new SLI value for the
     * given slo
     * @param _sloDetailsId the id for the SLO details
     * @param _previousTimestamp the timestamp of the previous request
     */
    function requestSLI(uint _sloDetailsId, uint _previousTimestamp) external;

    /**
     * @dev The callback function for the Provable SLI request which stores
     * the SLI in the SLA contract
     * @param _requestId the ID of the ChainLink request
     * @param _result the SLI value returned by ChainLink
     */
    function __callback(bytes32 _requestId, string calldata _result) external;

    /**
     * @dev This sets the SLARegistry contract address and can only be called
     * once
     */
    function setSLARegistry() external;
}
