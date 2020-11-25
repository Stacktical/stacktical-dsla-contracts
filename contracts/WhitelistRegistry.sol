pragma solidity 0.6.6;

import "./Whitelist/Whitelist.sol";

/**
 * @title WhitelistRegistry
 * @dev WhitelistRegistry is a contract for handling creation of whitelists
 * and querying those whitelists
 */
contract WhitelistRegistry {

    // Mapping that stores the whitelists owned by a user
    mapping(address => Whitelist[]) private userToWhitelists;

    /**
     * @dev event for whitelist creation logging
     * @param whitelist the address of the created whitelist contract
     */
    event WhitelistCreated(Whitelist indexed whitelist);

    /**
     * @dev public function for creating whitelists
     */
    function createWhitelist() public {
        Whitelist whitelist = new Whitelist(msg.sender);
        userToWhitelists[msg.sender].push(whitelist);

        emit WhitelistCreated(whitelist);
    }

    /**
     * @dev public view function that returns the whitelists that are owned by
     * the given user
     * @param _user Address of the user for which to return the whitelists
     */
    function userWhitelists(address _user) public view returns(Whitelist[] memory) {
        return(userToWhitelists[_user]);
    }

}
