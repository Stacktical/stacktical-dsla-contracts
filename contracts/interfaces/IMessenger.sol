pragma solidity 0.6.6;

import "../SLA/SLA.sol";

interface IMessenger {
    /**
     * @dev This sets the SLARegistry contract address and can only be called
     * once
     */
    function setSLARegistry() external;

    /**
     * @dev Creates a request to get a new SLI value for the
     * given slo
     * @param _periodId the id for the given period
     * @param _sla the service level agreement we are verifying the SLI for
     * @param _sloName the name of the SLO for which SLI must be computed
     */
    function requestSLI(
        uint256 _periodId,
        SLA _sla,
        bytes32 _sloName
    ) external;
}
