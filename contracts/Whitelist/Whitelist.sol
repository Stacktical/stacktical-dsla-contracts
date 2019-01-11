pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Whitelist is Ownable {

    mapping(address => bool) private userToWhitelisted;

    constructor(address _owner) public {
        transferOwnership(_owner);
    }

    function addUsersToWhitelist(address[] memory _userAddresses) public onlyOwner {
        for (uint i = 0; i < _userAddresses.length; i++) {
            addUserToWhitelist(_userAddresses[i]);
        }
    }

    function addUserToWhitelist(address _userAddress) public onlyOwner {
        userToWhitelisted[_userAddress] = true;
    }

    function removeUsersFromWhitelist(address[] memory _userAddresses) public onlyOwner {
        for (uint i = 0; i < _userAddresses.length; i++) {
            removeUserFromWhitelist(_userAddresses[i]);
        }
    }

    function removeUserFromWhitelist(address _userAddress) public onlyOwner {
        userToWhitelisted[_userAddress] = false;
    }

    function isWhitelisted(address _userAddress) public view returns(bool) {
        return(userToWhitelisted[_userAddress]);
    }

}
