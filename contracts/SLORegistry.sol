pragma solidity ^0.5.0;

import "./SLO/SLO.sol";

contract SLORegistry {

    mapping(address => SLO[]) private userToSLOs;

    event SLOCreated(address indexed slo);

    function createSLO(uint _value, SLO.SLOTypes _SLOType, bytes32 _name) public {
        SLO slo = new SLO(_value, _SLOType, _name);
        userToSLOs[msg.sender].push(slo);

        emit SLOCreated(slo);
    }

    function userSLOs(address _user) public view returns(SLO[] memory) {
        return(userToSLOs[_user]);
    }
}
