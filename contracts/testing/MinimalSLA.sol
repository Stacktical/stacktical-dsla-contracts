pragma solidity ^0.6.0;

/**
 * @dev Minimal implementation os SLA contract for the Messenger contract,
 * to test inter contract interaction without dealing with the SLA deployment
 * overhead.
 */

contract MinimalSLA {
    enum Status {NotVerified, Respected, NotRespected}

    struct Period {
        uint256 sla_period_start;
        uint256 sla_period_end;
        uint256 claimed_reward;
        bool claimed;
        Status status;
        mapping(address => mapping(address => uint256)) stakingBalance; // staking balance for all tokens (address token => (address user => amount))
        mapping(address => uint256) claimed_compensation;
    }
    Period[] public periods; // all periods for an SLA

    // Struct used for storing registered SLI's
    struct SLI {
        uint256 timestamp;
        uint256 value;
        uint256 periodId;
    }

    // Mapping to get SLI structs from SLO names in bytes32
    mapping(bytes32 => SLI[]) public SLIs;

    /**
     * @dev event for SLI creation logging
     * @param _timestamp the time the SLI has been registered
     * @param _value the value of the SLI
     * @param _periodId the id of the given period
     */
    event SLICreated(uint256 _timestamp, uint256 _value, uint256 _periodId);

    /**
     * @dev constructor add a Period at deployment time
     * start 1577836800000000000
     * end 1594026520000000000
     */
    constructor(uint256 _sla_period_start, uint256 _sla_period_end) public {
        Period memory period =
            Period({
                sla_period_start: _sla_period_start,
                sla_period_end: _sla_period_end,
                claimed_reward: 0,
                claimed: false,
                status: Status.NotVerified
            });
        periods.push(period);
    }

    /**
     * @dev external function to register SLI's and check them against the SLO's
     * @param _SLOName the name of the SLO in bytes32
     * @param _value the value of the SLI to check
     * @param _period the id of the given period
     */
    function registerSLI(
        bytes32 _SLOName,
        uint256 _value,
        uint256 _period
    ) external {
        SLIs[_SLOName].push(SLI(block.timestamp, _value, _period));

        emit SLICreated(block.timestamp, _value, _period);
    }

    /**
     * @dev function to get a period start and end
     * @param _periodId the id of the period to get data
     */
    function getPeriodData(uint256 _periodId)
        public
        view
        returns (uint256 periodStart, uint256 periodEnd)
    {
        return (
            periods[_periodId].sla_period_start,
            periods[_periodId].sla_period_end
        );
    }
}
