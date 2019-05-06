pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../Whitelist/Whitelist.sol";

/**
 * @title Subscribable
 * @dev Subscribable adds the functionality to subscribe to a contract
 */
contract Subscribable {

    using SafeMath for uint256;

    // Address of the whitelist contract
    Whitelist public whitelist;

    // Mapping to return if a user address is subscribed
    mapping(address => bool) private userToSubscribed;

    // Array with all users that are subsribed or have been subscribed
    address[] internal allUsers;

    // Total amount of subscribers
    uint public subscribersCount;

    // Total amount of users that are subscribed or have been subscribed
    uint internal usersCount;

    /**
     * @dev event for logging users subscribing
     * @param user the address of the subscribed user
     */
    event Subscribed(address indexed user);

    /**
     * @dev event for logging users unsubscribing
     * @param user the address of the unsubscribed user
     */
    event Unsubscribed(address indexed user);

    /**
     * @dev Throws if sender is not whitelisted when whitelist is present
     */
    modifier onlyWhitelisted() {
        if (whitelist != Whitelist(0)) {
            require(whitelist.isWhitelisted(msg.sender));
        }
        _;
    }

    /**
     * @dev Throws if sender is not subscribed
     */
    modifier onlySubscribed() {
        require(isSubscribed(msg.sender));
        _;
    }

    /**
     * @dev Throws if sender is subscribed
     */
    modifier onlyNotSubscribed() {
        require(!isSubscribed(msg.sender));
        _;
    }

    /**
     * @dev internal function for subscribing to the contract
     */
    function _subscribe() internal onlyWhitelisted {
        userToSubscribed[msg.sender] = true;
        subscribersCount = subscribersCount.add(1);
        allUsers.push(msg.sender);
        usersCount = usersCount.add(1);

        emit Subscribed(msg.sender);
    }

    /**
     * @dev internal function for unsubscribing to the contract
     */
    function _unSubscribe() internal onlySubscribed {
        userToSubscribed[msg.sender] = false;
        subscribersCount = subscribersCount.sub(1);

        emit Unsubscribed(msg.sender);
    }

    /**
     * @dev public view funtion to check if a given user is subscribed to the
     * contract
     * @param _userAddress the address of the user to check
     * @return true if _userAddress is subscribed to the contract
     */
    function isSubscribed(address _userAddress) public view returns(bool) {
        return(userToSubscribed[_userAddress]);
    }

}
