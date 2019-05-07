pragma solidity 0.5.7;

import "./SLO/SLO.sol";

/**
 * @title SLORegistry
 * @dev SLORegistry is a contract for handling creation of service level
 * objectives and querying those service level objectives
 */
contract SLORegistry {

    // Mapping that stores the service level objectives created by a user
    mapping(address => SLO[]) private userToSLOs;

    /**
     * @dev event for service level objective creation logging
     * @param slo The address of the created service level objective contract
     */
    event SLOCreated(SLO indexed slo);

    /**
     * @dev public function for creating service level objectives
     * @param _value the value to check against
     * @param _SLOType type of check
     * @param _name name of the service level objective in bytes32
     */
    function createSLO(uint _value, SLO.SLOTypes _SLOType, bytes32 _name) public {
        SLO slo = new SLO(_value, _SLOType, _name);
        userToSLOs[msg.sender].push(slo);

        emit SLOCreated(slo);
    }

    /**
     * @dev public view function that returns the service level objectives that
     * the given user has created
     * @param _user Address of the user for which to return the service level
     * objectives
     */
    function userSLOs(address _user) public view returns(SLO[] memory) {
        return(userToSLOs[_user]);
    }
}
