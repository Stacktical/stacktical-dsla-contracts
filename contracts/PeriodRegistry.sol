// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SLARegistry
 * @dev SLARegistry is a contract for handling creation of service level
 * agreements and keeping track of the created agreements
 */
contract PeriodRegistry is Ownable {
    using SafeMath for uint256;

    enum PeriodType {Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly}

    /// @dev struct to store the definition of a period
    struct PeriodDefinition {
        uint256 yearlyPeriods;
        bool initialized;
        uint256[] starts;
        uint256[] ends;
    }

    /// @dev (periodType=>PeriodDefinition) hourly/weekly/biWeekly/monthly/yearly are periodTypes
    mapping(PeriodType => PeriodDefinition) public periodDefinitions;

    /**
     * @dev event to log a new period initialized
     *@param periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     *@param periodsAdded 2. amount of periods added
     *@param apy 3. annual percentage yield offered for a year long SLA
     *@param yearlyPeriods 4. amount of periods of the corresponding periods per year to calculate real APY
     */
    event PeriodInitialized(
        PeriodType periodType,
        uint256 periodsAdded,
        uint256 apy,
        uint256 yearlyPeriods
    );

    /**
     * @dev public function for creating canonical service level agreements
     *@param _periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     *@param _periodStarts 2. array of the starts of the period
     *@param _periodEnds 3. array of the ends of the period
     *@param _yearlyPeriods 5. amount of periods of the corresponding periods per year to calculate real APY
     */
    function initializePeriod(
        PeriodType _periodType,
        uint256[] memory _periodStarts,
        uint256[] memory _periodEnds,
        uint256 _yearlyPeriods
    ) public onlyOwner {
        PeriodDefinition storage periodDefinition =
            periodDefinitions[_periodType];
        require(
            periodDefinition.initialized == false,
            "Period type already initialized"
        );
        require(
            _periodStarts.length == _periodEnds.length,
            "Period type starts and ends should match"
        );
        require(_periodStarts.length > 0, "Period length can't be 0");
        for (uint256 index = 0; index < _periodStarts.length; index++) {
            require(
                _periodStarts[index] < _periodEnds[index],
                "Start should be before end"
            );
            periodDefinition.starts.push(_periodStarts[index]);
            periodDefinition.ends.push(_periodEnds[index]);
        }
        periodDefinition.yearlyPeriods = _yearlyPeriods;
        periodDefinition.initialized = true;
    }

    /**
     * @dev public function to get the start and end of a period
     *@param _periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     *@param _periodId 2. period id to get start and end
     */
    function getPeriodStartAndEnd(PeriodType _periodType, uint256 _periodId)
        public
        view
        returns (uint256 start, uint256 end)
    {
        start = periodDefinitions[_periodType].starts[_periodId];
        end = periodDefinitions[_periodType].ends[_periodId];
    }

    /**
     * @dev public function to check if a period id is valid
     *@param _periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     *@param _periodId 2. period id to get start and end
     */
    function isValidPeriod(PeriodType _periodType, uint256 _periodId)
        public
        view
        returns (bool valid)
    {
        PeriodDefinition memory periodDefinition =
            periodDefinitions[_periodType];
        require(
            periodDefinition.initialized,
            "Period type not initialized yet"
        );
        // check if _periodId is smaller or equal to the last periodId value
        valid = periodDefinition.starts.length.sub(1) >= _periodId;
    }

    /**
     * @dev public function to check if a period has finished
     *@param _periodType 1. period type i.e. Hourly, Daily, Weekly, BiWeekly, Monthly, Yearly
     *@param _periodId 2. period id to get start and end
     */
    function periodIsFinished(PeriodType _periodType, uint256 _periodId)
        public
        view
        returns (bool finished)
    {
        PeriodDefinition memory periodDefinition =
            periodDefinitions[_periodType];
        require(
            periodDefinition.initialized,
            "Period type not initialized yet"
        );
        finished =
            periodDefinitions[_periodType].ends[_periodId] < block.timestamp;
    }
}