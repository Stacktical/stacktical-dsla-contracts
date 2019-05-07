pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

/**
 * @title Compensatable
 * @dev Compensatable makes it possible to track compensations for users of the
 * contract and let them withdraw their entitled compensation as ERC20 tokens
 */
contract Compensatable {

    using SafeMath for uint256;

    // Address of the ERC20 contract
    IERC20 public dsla;

    // Mapping to to track the amount a user address has already been compensated
    mapping (address => uint) public userToCompensated;

    // Mapping to to track the amount a user address has actually withdrawn
    mapping (address => uint) public userToWithdrawn;

    // The compensation amount a single user is entitled to
    uint public compensationPerUser;

    // The amount to compensate on a single breach
    uint public compensationAmount;

    /**
     * @dev event for logging setting the initial user compensation amount
     * @param user the address of the user
     * @param value the amount of compensation set
     */
    event InitialUserCompensation(address indexed user, uint value);

    /**
     * @dev event for logging a compensation withdrawal
     * @param user the address of the user
     * @param value the amount withdrawn
     */
    event CompensationWithdrawn(address indexed user, uint value);

    /**
     * @dev event for logging when a new compensation is added
     * @param compenssationPerUser The new amount of compensation every user
     * is entitled to
     */
    event CompensationAdded(uint compensationPerUser);

    /**
     * @dev internal function to set the initial compensation amount for the
     * sender
     */
    function _setInitialuserCompensation() internal {
        userToCompensated[msg.sender] = compensationPerUser;

        emit InitialUserCompensation(msg.sender, compensationPerUser);
    }

    /**
     * @dev internal function to withdraw the compensation a user is entitled
     * to
     * @param _user Address of the user to withdraw the compensation for
     * @return amount withdrawn
     */
    function _withdrawCompensation(address _user) internal returns(uint) {
        require(_compensationWithdrawable(_user));

        uint withdrawalAmount = compensationPerUser.sub(userToCompensated[_user]);
        userToCompensated[_user] = userToCompensated[_user].add(withdrawalAmount);
        userToWithdrawn[_user] = userToWithdrawn[_user].add(withdrawalAmount);

        emit CompensationWithdrawn(_user, withdrawalAmount);

        return withdrawalAmount;
    }

    /**
     * @dev internal function to trigger a compensation and update the
     * compensation amount every used is entitled to
     */
    function _compensate() internal {
        compensationPerUser = compensationPerUser.add(compensationAmount);

        emit CompensationAdded(compensationPerUser);
    }

    /**
     * @dev internal view function to check if a user is able to withdraw
     * a compensation
     * @param _user The user address to check
     * @return true if the given user is able to witdraw a compensation
     */
    function _compensationWithdrawable(address _user) internal view returns(bool) {
        return userToCompensated[_user] < compensationPerUser;
    }
}
