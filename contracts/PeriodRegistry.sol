// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/IPeriodRegistry.sol';

/**
 * @title PeriodRegistry
 * @notice PeriodRegistry is a contract for management of period definitions
 */
contract PeriodRegistry is IPeriodRegistry, Ownable {
    using SafeMath for uint256;

    /// @notice struct to store the definition of a period
    struct PeriodDefinition {
        bool initialized;
        uint256[] starts;
        uint256[] ends;
    }

    /// @notice (periodType=>PeriodDefinition) period definitions by period type
    /// @dev period types are hourly / weekly / biWeekly / monthly / yearly
    mapping(PeriodType => PeriodDefinition) public periodDefinitions;

    /**
     * @notice event to log that a period is initialized
     * @param periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     * @param periodsAdded 2. amount of periods added
     */
    event PeriodInitialized(PeriodType periodType, uint256 periodsAdded);

    /**
     * @dev event to log that a period is modified
     * @param periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     * @param periodsAdded 2. amount of periods added
     */
    event PeriodModified(PeriodType periodType, uint256 periodsAdded);

    /**
     * @notice public function for creating canonical service level agreements
     * @param _periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     * @param _periodStarts 2. array of the starts of the period
     * @param _periodEnds 3. array of the ends of the period
     */
    function initializePeriod(
        PeriodType _periodType,
        uint256[] memory _periodStarts,
        uint256[] memory _periodEnds
    ) public onlyOwner {
        PeriodDefinition storage periodDefinition = periodDefinitions[
            _periodType
        ];
        require(
            !periodDefinition.initialized,
            'Period type already initialized'
        );
        require(
            _periodStarts.length == _periodEnds.length,
            'Period type starts and ends should match'
        );
        require(_periodStarts.length > 0, "Period length can't be 0");
        for (uint256 index = 0; index < _periodStarts.length; index++) {
            require(
                _periodStarts[index] < _periodEnds[index],
                'Start should be before end'
            );
            if (index < _periodStarts.length - 1) {
                require(
                    _periodStarts[index + 1].sub(_periodEnds[index]) == 1,
                    'Start of a period should be 1 second after the end of the previous period'
                );
            }
            periodDefinition.starts.push(_periodStarts[index]);
            periodDefinition.ends.push(_periodEnds[index]);
        }
        periodDefinition.initialized = true;
        emit PeriodInitialized(_periodType, _periodStarts.length);
    }

    /**
     * @notice public function to add a new period definition
     * @dev only owner can call this function
     * @param _periodType type of period to add
     * @param _periodStarts array of the period starting timestamps to add
     * @param _periodEnds 3. array of the period ending timestamps to add
     */
    function addPeriodsToPeriodType(
        PeriodType _periodType,
        uint256[] memory _periodStarts,
        uint256[] memory _periodEnds
    ) public onlyOwner {
        require(_periodStarts.length > 0, "Period length can't be 0");
        require(
            _periodStarts.length == _periodEnds.length,
            'should provide same length of array'
        );
        PeriodDefinition storage periodDefinition = periodDefinitions[
            _periodType
        ];
        require(periodDefinition.initialized, 'Period was not initialized yet');
        for (uint256 index = 0; index < _periodStarts.length; index++) {
            require(
                _periodStarts[index] < _periodEnds[index],
                'Start should be before end'
            );
            if (index < _periodStarts.length.sub(1)) {
                require(
                    _periodStarts[index + 1].sub(_periodEnds[index]) == 1,
                    'Start of a period should be 1 second after the end of the previous period'
                );
            }
            periodDefinition.starts.push(_periodStarts[index]);
            periodDefinition.ends.push(_periodEnds[index]);
        }
        emit PeriodModified(_periodType, _periodStarts.length);
    }

    /**
     * @notice public function to get the start and end of a period
     * @param _periodType type of period to check
     * @param _periodId id of period to check
     * @return start starting timestamp
     * @return end ending timestamp
     */
    function getPeriodStartAndEnd(PeriodType _periodType, uint256 _periodId)
        external
        view
        override
        returns (uint256 start, uint256 end)
    {
        start = periodDefinitions[_periodType].starts[_periodId];
        end = periodDefinitions[_periodType].ends[_periodId];
    }

    /**
     * @notice public function to check if the period definition is initialized by period type
     * @param _periodType type of period to check
     * @return initialized if initialized or not
     */
    function isInitializedPeriod(PeriodType _periodType)
        external
        view
        override
        returns (bool initialized)
    {
        initialized = periodDefinitions[_periodType].initialized;
    }

    /**
     * @notice public function to check if a period id is valid i.e. it belongs to the added id array
     * @param _periodType type of period to check
     * @param _periodId id of period to check
     * @return valid if valid or invalid
     */
    function isValidPeriod(PeriodType _periodType, uint256 _periodId)
        public
        view
        override
        returns (bool valid)
    {
        valid =
            periodDefinitions[_periodType].starts.length.sub(1) >= _periodId;
    }

    /**
     * @notice public function to check if a period has finished
     * @param _periodType type of period to check
     * @param _periodId id of period to check
     * @return finished if finished or not
     */
    function periodIsFinished(PeriodType _periodType, uint256 _periodId)
        external
        view
        override
        returns (bool finished)
    {
        require(
            isValidPeriod(_periodType, _periodId),
            'Period data is not valid'
        );
        finished =
            periodDefinitions[_periodType].ends[_periodId] < block.timestamp;
    }

    /**
     * @notice public function to check if a period has started
     * @param _periodType type of period to check
     * @param _periodId id of period to check
     * @return started if started or not
     */
    function periodHasStarted(PeriodType _periodType, uint256 _periodId)
        external
        view
        override
        returns (bool started)
    {
        require(
            isValidPeriod(_periodType, _periodId),
            'Period data is not valid'
        );
        started =
            periodDefinitions[_periodType].starts[_periodId] < block.timestamp;
    }

    /**
     * @notice public function to get the definitions of period for all period types
     * @return array of period definitions
     */
    function getPeriodDefinitions()
        public
        view
        returns (PeriodDefinition[] memory)
    {
        // 6 period types
        PeriodDefinition[] memory periodDefinition = new PeriodDefinition[](6);
        periodDefinition[0] = periodDefinitions[PeriodType.Hourly];
        periodDefinition[1] = periodDefinitions[PeriodType.Daily];
        periodDefinition[2] = periodDefinitions[PeriodType.Weekly];
        periodDefinition[3] = periodDefinitions[PeriodType.BiWeekly];
        periodDefinition[4] = periodDefinitions[PeriodType.Monthly];
        periodDefinition[5] = periodDefinitions[PeriodType.Yearly];
        return periodDefinition;
    }
}
