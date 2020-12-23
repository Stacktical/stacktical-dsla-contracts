// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

/**
 * @title SLO
 * @dev SLO is a service level objective contract used to check SLI's against
 */
contract SLO {
    /// @dev checking types to check if a SLA was honored or not
    enum SLOTypes {
        EqualTo,
        NotEqualTo,
        SmallerThan,
        SmallerOrEqualTo,
        GreaterThan,
        GreaterOrEqualTo
    }

    /// @dev the checking type for this SLO
    SLOTypes public SLOType;

    /// @dev the value to check the SLI against
    uint256 public value;

    /// @dev the name of the SLO in bytes32
    bytes32 public name;

    /**
     * @dev event for logging SLO creation
     * @param _value 1. The value to check the SLI against
     * @param _SLOType 2. The checking type for this SLO
     * @param _name 3. The name of the SLO in bytes32
     */
    event SLORegistered(uint256 _value, SLOTypes _SLOType, bytes32 _name);

    /**
     * @param _value 1. The value to check the SLI against
     * @param _SLOType 2. The checking type for this SLO
     * @param _name 3. The name of the SLO in bytes32
     */
    constructor(
        uint256 _value,
        SLOTypes _SLOType,
        bytes32 _name
    ) public {
        value = _value;
        SLOType = _SLOType;
        name = _name;

        emit SLORegistered(_value, _SLOType, _name);
    }

    /**
     * @dev external view function to check a value against the SLO
     * @param _value The SLI value to check against the SL
     * @return boolean with the SLO honored state
     */
    function isSLOHonored(uint256 _value) public view returns (bool) {
        if (SLOType == SLOTypes.EqualTo) {
            return _value == value;
        }

        if (SLOType == SLOTypes.NotEqualTo) {
            return _value != value;
        }

        if (SLOType == SLOTypes.SmallerThan) {
            return _value < value;
        }

        if (SLOType == SLOTypes.SmallerOrEqualTo) {
            return _value <= value;
        }

        if (SLOType == SLOTypes.GreaterThan) {
            return _value > value;
        }

        if (SLOType == SLOTypes.GreaterOrEqualTo) {
            return _value >= value;
        }
        revert("isSLOHonoured wasn't executed properly");
    }
}
