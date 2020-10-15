// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Whitelist
 * @dev Whitelist is a whitelisting contract to check if users are allowed
 * to perform specific actions
 */
contract Whitelist is Ownable {

    // mapping to store which user addresses are whitelisted
    mapping(address => bool) private userToWhitelisted;

    /**
     * @dev event for logging when a user address has been added to the
     * whitelist
     * @param _userAddress address of the user that has been added to the
     * whitelist
     */
    event UserAddedToWhitelist(address indexed _userAddress);

    /**
     * @dev event for logging when a user address has been removed from
     * the whitelist
     * @param _userAddress address of the user that has been removed from the
     * whitelist
     */
    event UserRemovedFromWhitelist(address indexed _userAddress);

    /**
     * @dev constructor
     * @param _owner The address of the owner of the contract
     */
    constructor(address _owner) public {
        transferOwnership(_owner);
    }

    /**
     * @dev public function for adding multiple users to the whitelist
     * @param _userAddresses array of user addresses to add to the whitelist
     */
    function addUsersToWhitelist(address[] memory _userAddresses) public onlyOwner {
        for (uint i = 0; i < _userAddresses.length; i++) {
            addUserToWhitelist(_userAddresses[i]);
        }
    }

    /**
     * @dev public function for adding a user to the whitelist
     * @param _userAddress address of a user to add to the whitelist
     */
    function addUserToWhitelist(address _userAddress) public onlyOwner {
        userToWhitelisted[_userAddress] = true;
        emit UserAddedToWhitelist(_userAddress);
    }

    /**
     * @dev public function for removing multiple users from the whitelist
     * @param _userAddresses array of user addresses to remove from the whitelist
     */
    function removeUsersFromWhitelist(address[] memory _userAddresses) public onlyOwner {
        for (uint i = 0; i < _userAddresses.length; i++) {
            removeUserFromWhitelist(_userAddresses[i]);
        }
    }

    /**
     * @dev public function for removing a user from the whitelist
     * @param _userAddress address of a user to remove from the whitelist
     */
    function removeUserFromWhitelist(address _userAddress) public onlyOwner {
        userToWhitelisted[_userAddress] = false;
        emit UserRemovedFromWhitelist(_userAddress);
    }

    /**
     * @dev public view function to check if the given user is whitelisted
     * @param _userAddress the address of the user to check
     * @return true if the user is whitelisted
     */
    function isWhitelisted(address _userAddress) public view returns(bool) {
        return(userToWhitelisted[_userAddress]);
    }

}
