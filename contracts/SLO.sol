// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "./SLORegistry.sol";

/**
 * @title SLO
 * @dev SLO is a service level objective contract used to check SLI's against
 */
contract SLO {
    /// @dev the checking sloType for this SLO
    SLORegistry.SLOType public sloType;

    /// @dev the value to check the SLI against
    uint256 public value;

    /**
     * @param _value 1. The value to check the SLI against
     * @param _sloType 2. The checking sloType for this SLO
     */
    constructor(uint256 _value, SLORegistry.SLOType _sloType) public {
        value = _value;
        sloType = _sloType;
    }

    /**
     * @dev external view function to check a value against the SLO
     * @param _value The SLI value to check against the SL
     * @return boolean with the SLO honored state
     */
    function isRespected(uint256 _value) public view returns (bool) {
        if (sloType == SLORegistry.SLOType.EqualTo) {
            return _value == value;
        }

        if (sloType == SLORegistry.SLOType.NotEqualTo) {
            return _value != value;
        }

        if (sloType == SLORegistry.SLOType.SmallerThan) {
            return _value < value;
        }

        if (sloType == SLORegistry.SLOType.SmallerOrEqualTo) {
            return _value <= value;
        }

        if (sloType == SLORegistry.SLOType.GreaterThan) {
            return _value > value;
        }

        if (sloType == SLORegistry.SLOType.GreaterOrEqualTo) {
            return _value >= value;
        }
        revert("isRespected wasn't executed properly");
    }

    function getDetails()
        public
        view
        returns (uint256 _value, SLORegistry.SLOType _sloType)
    {
        _value = value;
        _sloType = sloType;
    }
}
