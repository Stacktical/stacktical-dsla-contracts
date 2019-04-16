pragma solidity 0.5.7;

import "./Whitelist/Whitelist.sol";

contract WhitelistRegistry {

    mapping(address => Whitelist[]) private userToWhitelists;

    event WhitelistCreated(Whitelist indexed whitelist);

    function createWhitelist() public {
        Whitelist whitelist = new Whitelist(msg.sender);
        userToWhitelists[msg.sender].push(whitelist);

        emit WhitelistCreated(whitelist);
    }

    function userWhitelists(address _user) public view returns(Whitelist[] memory) {
        return(userToWhitelists[_user]);
    }

}
