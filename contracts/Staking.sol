// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Staking is Ownable {
    using SafeMath for uint256;

    bytes4 private constant BURN_SELECTOR =
        bytes4(keccak256(bytes("burn(uint256)")));

    // (tokenAddress=>uint256) total token staking balance
    mapping(address => uint256) tokenStake;
    // (tokenAddress=>userAddress=>uint256) staking balance per user
    mapping(address => mapping(address => uint256)) userTokenStake;
    /// @dev address[] of the stakers of the SLA contract
    address[] public stakers;
    /// @dev array with the allowed tokens addresses of the StakeRegistry
    address[] public allowedTokens;
    /// @dev mapping for all allowed tokens to be staked
    mapping(address => bool) public allowedTokensMapping;

    modifier notOwner {
        require(msg.sender != owner(), "Should not be called by the SLA owner");
        _;
    }

    modifier onlyAllowedToken(address _token) {
        require(allowedTokensMapping[_token] == true, "token is not allowed");
        _;
    }

    /**
     *@param _dslaTokenAddress 1. address of the base token
     */
    constructor(address _dslaTokenAddress) public {
        allowedTokens.push(_dslaTokenAddress);
        allowedTokensMapping[_dslaTokenAddress] = true;
    }

    /**
     *@dev add a token to ve allowed for staking
     *@param _token 1. address of the new allowed token
     */
    function addAllowedTokens(address _token) public onlyOwner {
        require(allowedTokensMapping[_token] == false, "token already added");
        allowedTokens.push(_token);
        allowedTokensMapping[_token] = true;
    }

    /**
     *@dev increase the amount staked per token
     *@param _amount 1. amount to be staked
     *@param _token 2. address of the token
     */
    function _stake(uint256 _amount, address _token)
        internal
        onlyAllowedToken(_token)
    {
        if (msg.sender != owner()) {
            require(
                tokenStake[_token].add(_amount) <=
                    userTokenStake[_token][owner()],
                "Cannot stake more than SLA owner stake"
            );
        }
        tokenStake[_token] = tokenStake[_token].add(_amount);
        userTokenStake[_token][msg.sender] = userTokenStake[_token][msg.sender]
            .add(_amount);
        if (!_isStaker(msg.sender)) {
            stakers.push(msg.sender);
        }
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
    }

    /**
     *@dev withdraw staked tokens
     *@param _amount 1. amount to withdraw
     *@param _token 2. address of the token
     */
    function _withdraw(uint256 _amount, address _token)
        internal
        onlyAllowedToken(_token)
    {
        require(
            userTokenStake[_token][msg.sender] >= _amount,
            "Should not withdraw more stake than staked"
        );
        if (msg.sender == owner()) {
            uint256 delegatorsStake =
                tokenStake[_token].sub(userTokenStake[_token][owner()]);
            require(
                tokenStake[_token].sub(_amount) >= delegatorsStake,
                "Should not withdraw more than the delegators stake"
            );
        }
        IERC20(_token).transfer(msg.sender, _amount);
        tokenStake[_token] = tokenStake[_token].sub(_amount);
        userTokenStake[_token][msg.sender] = userTokenStake[_token][msg.sender]
            .sub(_amount);
    }

    /**
     *@dev claim from validators
     *@param _period 1. period id to claim
     */
    function _claimReward(uint256 _period) internal onlyOwner {
        //        require(
        //            stakingPeriods[_period].status == Status.Respected,
        //            "SLA not respected !"
        //        );
        //        require(
        //            !stakingPeriods[_period].claimed,
        //            "You have already claimed your reward for this period !"
        //        );
        //
        //        uint256 reward = totalStaked.div(stakingPeriods.length);
        //        uint256 fees = reward.mul(3).div(10);
        //
        //        totalStaked = totalStaked.sub(reward);
        //        stakingPeriods[_period].claimed_reward = reward;
        //        stakingPeriods[_period].claimed = true;
        //
        //        DSLAToken.transfer(msg.sender, reward);
        //        (bool _success, ) =
        //            address(DSLAToken).call(
        //                abi.encodeWithSelector(BURN_SELECTOR, fees)
        //            );
        //
        //        require(_success, "DSLAToken burn process was not successful");
    }

    /**
     *@dev claim from delegators
     *@param _period 1. period id to claim
     */
    function _claimCompensation(uint256 _period) public notOwner {
        //        require(
        //            stakingPeriods[_period].status == Status.NotRespected,
        //            "SLA respected !"
        //        );
        //        require(
        //            stakingPeriods[_period].claimed_compensation[msg.sender] == 0,
        //            "You have already claimed your compensation for this period !"
        //        );
        //
        //        uint256 compensation = getUserTotalValue(msg.sender, _period);
        //        uint256 fees = compensation.mul(3).div(10);
        //
        //        totalStaked = totalStaked.sub(compensation);
        //        stakingPeriods[_period].claimed_compensation[msg.sender] = compensation;
        //
        //        DSLAToken.transfer(msg.sender, compensation);
        //        (bool _success, ) =
        //            address(DSLAToken).call(
        //                abi.encodeWithSelector(BURN_SELECTOR, fees)
        //            );
        //
        //        require(_success, "DSLAToken burn process was not successful");
    }

    function _isStaker(address _staker) internal view returns (bool) {
        for (uint256 index = 0; index < stakers.length; index++) {
            if (stakers[index] == _staker) return true;
        }
        return false;
    }

    function getAllowedTokensLength() public view returns (uint256) {
        return allowedTokens.length;
    }

    function getTokenStake(address _staker, uint256 _allowedTokenIndex)
        public
        view
        returns (address tokenAddress, uint256 stake)
    {
        address allowedTokenAddress = allowedTokens[_allowedTokenIndex];
        return (
            allowedTokenAddress,
            userTokenStake[allowedTokenAddress][_staker]
        );
    }
}
