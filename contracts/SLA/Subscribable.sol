pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../Whitelist/Whitelist.sol";

contract Subscribable {

    using SafeMath for uint256;

    Whitelist public whitelist;

    mapping(address => bool) private userToSubscribed;

    uint public subscribersCount;

    modifier onlyWhitelisted() {
        require(whitelist.isWhitelisted(msg.sender));
        _;
    }

    modifier onlySubscribed() {
        require(isSubscribed(msg.sender));
        _;
    }

    function _subscribe() internal onlyWhitelisted {
        userToSubscribed[msg.sender] = true;
        subscribersCount = subscribersCount.add(1);
    }

    function _unSubscribe() internal onlySubscribed {
        userToSubscribed[msg.sender] = false;
        subscribersCount = subscribersCount.sub(1);
    }

    function isSubscribed(address _userAddress) public view returns(bool) {
        return(userToSubscribed[_userAddress]);
    }

}
