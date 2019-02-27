pragma solidity ^0.5.0;

import "./SLA/SLA.sol";

contract SLARegistry {

    mapping(address => SLA[]) private userToSLAs;

    event SLARegistered(address indexed sla);

    function createSLA(
        address _owner,
        Whitelist _whitelist,
        IERC20 _dsla,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint _compensationAmount,
        uint _stake
    ) public {
        SLA sla = new SLA(
            _owner,
            _whitelist,
            _dsla,
            _SLONames,
            _SLOs,
            _compensationAmount,
            _stake
        );

        emit SLARegistered(sla);

        userToSLAs[msg.sender].push(sla);
    }

    function userSLAs(address _user) public view returns(SLA[] memory) {
        return(userToSLAs[_user]);
    }
}
