pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract Compensatable {

    using SafeMath for uint256;

    IERC20 public dsla;

    mapping (address => uint) public userToCompensated;
    mapping (address => uint) public userToWithdrawn;

    uint public compensationPerUser;
    uint public compensationAmount;

    function _setInitialuserCompensation() internal {
        userToCompensated[msg.sender] = compensationPerUser;
    }

    function _withdrawCompensation() internal {
        require(userToCompensated[msg.sender] < compensationPerUser);

        uint withdrawalAmount = compensationPerUser.sub(userToCompensated[msg.sender]);
        userToCompensated[msg.sender] = userToCompensated[msg.sender].add(withdrawalAmount);
        userToWithdrawn[msg.sender] = userToWithdrawn[msg.sender].add(withdrawalAmount);

        dsla.transfer(msg.sender, withdrawalAmount);
    }

    function _compensate() internal {
        compensationPerUser = compensationPerUser.add(compensationAmount);
    }
}

