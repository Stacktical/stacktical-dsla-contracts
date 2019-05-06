pragma solidity 0.5.7;

/**
 * @title SLO
 * @dev SLO is a service level objective contract used to check SLI's against
 */
contract SLO {

    // The available checking types
    enum SLOTypes { EqualTo, NotEqualTo, SmallerThan, SmallerOrEqualTo, GreaterThan, GreaterOrEqualTo }

    // The checking type for this SLO
    SLOTypes public SLOType;

    // The value to check the SLI against
    uint public value;

    // The name of the SLO in bytes32
    bytes32 public name;

    /**
     * @dev event for logging SLO creation
     * @param _value The value to check the SLI against
     * @param _SLOType The checking type for this SLO
     * @param _name The name of the SLO in bytes32
     */
    event SLORegistered(uint _value, SLOTypes _SLOType, bytes32 _name);

    /**
     * @dev constructor
     * @param _value The value to check the SLI against
     * @param _SLOType The checking type for this SLO
     * @param _name The name of the SLO in bytes32
     */
    constructor(uint _value, SLOTypes _SLOType, bytes32 _name) public {
        value = _value;
        SLOType = _SLOType;
        name = _name;

        emit SLORegistered(_value, _SLOType, _name);
    }

    /**
     * @dev external view function to check a value against the SLO
     * @param _value The SLI value to check against the SL
     * @return true if the SLO is honored
     */
    function isSLOHonored(uint _value) external view returns(bool) {
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
    }

}
