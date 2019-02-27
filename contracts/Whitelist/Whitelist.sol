pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Whitelist is Ownable {

    mapping(address => bool) private userToWhitelisted;

    event UserAddedToWhitelist(address[] indexed _userAddresses);
    event UserRemovedFromWhitelist(address[] indexed _userAddresses);


    constructor(address _owner) public {
        transferOwnership(_owner);
    }

    function addUsersToWhitelist(address[] memory _userAddresses) public onlyOwner {
        for (uint i = 0; i < _userAddresses.length; i++) {
            addUserToWhitelist(_userAddresses[i]);
        }
        emit UserAddedToWhitelist(_userAddresses);
    }

    function addUserToWhitelist(address _userAddress) public onlyOwner {
        userToWhitelisted[_userAddress] = true;
        emit UserAddedToWhitelist(_userAddress);
    }

    function removeUsersFromWhitelist(address[] memory _userAddresses) public onlyOwner {
        for (uint i = 0; i < _userAddresses.length; i++) {
            removeUserFromWhitelist(_userAddresses[i]);
        }
        emit UserRemovedFromWhitelist(_userAddresses);
    }

    function removeUserFromWhitelist(address _userAddress) public onlyOwner {
        userToWhitelisted[_userAddress] = false;

        emit UserRemovedFromWhitelist(_userAddress);
    }

    function isWhitelisted(address _userAddress) public view returns(bool) {
        return(userToWhitelisted[_userAddress]);
    }

}
