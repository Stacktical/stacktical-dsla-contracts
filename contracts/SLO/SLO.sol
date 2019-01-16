pragma solidity ^0.5.0;

contract SLO {

    enum SLOTypes { EqualTo, NotEqualTo, SmallerThan, SmallerOrEqualTo, GreaterThan, GreaterOrEqualTo }

    SLOTypes public SLOType;

    uint public value;
    bytes32 public name;

    constructor(uint _value, SLOTypes _SLOType, bytes32 _name) public {
        value = _value;
        SLOType = _SLOType;
        name = _name;
    }

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
