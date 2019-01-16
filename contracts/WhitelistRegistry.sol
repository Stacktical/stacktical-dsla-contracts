pragma solidity ^0.5.0;

import "./Whitelist/Whitelist.sol";

contract WhitelistRegistry {

    mapping(address => Whitelist[]) private userToWhitelists;

    function createWhitelist() public {
        Whitelist whitelist = new Whitelist(msg.sender);
        userToWhitelists[msg.sender].push(whitelist);
    }

    function userWhitelists(address _user) public view returns(Whitelist[] memory) {
        return(userToWhitelists[_user]);
    }

}
