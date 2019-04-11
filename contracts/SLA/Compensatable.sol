pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract Compensatable {

    using SafeMath for uint256;

    IERC20 public dsla;

    mapping (address => uint) public userToCompensated;
    mapping (address => uint) public userToWithdrawn;

    uint public compensationPerUser;
    uint public compensationAmount;

    event InitialUserCompensation(address indexed user, uint value);
    event CompensationWithdrawn(address indexed user, uint value);
    event CompensationAdded(uint compensationPerUser);

    function _setInitialuserCompensation() internal {
        userToCompensated[msg.sender] = compensationPerUser;

        emit InitialUserCompensation(msg.sender, compensationPerUser);
    }

    function _withdrawCompensation(address _user) internal {
        require(_compensationWithdrawable(_user));

        uint withdrawalAmount = compensationPerUser.sub(userToCompensated[_user]);
        userToCompensated[_user] = userToCompensated[_user].add(withdrawalAmount);
        userToWithdrawn[_user] = userToWithdrawn[_user].add(withdrawalAmount);

        dsla.transfer(_user, withdrawalAmount);

        emit CompensationWithdrawn(_user, withdrawalAmount);
    }

    function _compensate() internal {
        compensationPerUser = compensationPerUser.add(compensationAmount);

        emit CompensationAdded(compensationPerUser);
    }

    function _compensationWithdrawable(address _user) internal view returns(bool) {
        return userToCompensated[_user] < compensationPerUser;
    }
}
