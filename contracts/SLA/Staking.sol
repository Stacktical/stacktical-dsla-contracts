// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../bDSLA/bDSLAToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Staking is Ownable {
    using SafeMath for uint256;
    
    enum Status { NotVerified, Respected, NotRespected }
    
    struct Period {
      uint sla_period_start;
      uint sla_period_end;
      uint claimed_reward;
      bool claimed;
      Status status;
      mapping(address => mapping(address => uint)) stakingBalance;   // staking balance for all tokens (address token => (address user => amount))
      mapping(address => uint256) claimed_compensation;
    }

    bDSLAToken public bDSLA;
    address public validator;
    address[] public stakers; // list of all stakers (validators, vouchers, delegators ...)
    address[] public allowedTokens; // mapping for all allowed tokens to be staked
    Period[] public periods; // all periods for an SLA 
    mapping(address => uint) public uniqueTokensStaked; // mapping to trace how many token is staked by an user
    uint public totalStaked; 

    event NewPeriodAdded(uint indexed period_index);
    
    modifier notValidator {
        require(msg.sender != validator, "You are a validator !");
        _;
    }
    
    modifier onlyValidator {
        require(msg.sender == validator, "You are not a validator !");
        _;
    }
    
    modifier onlyInPeriod(uint _period) {
        require(block.timestamp >= periods[_period].sla_period_start &&
        block.timestamp <= periods[_period].sla_period_end);
        _;
    }
    
    constructor(bDSLAToken _tokenAddress, uint[] memory _sla_period_starts, uint[] memory _sla_period_ends) public {
        require(_sla_period_starts.length == _sla_period_ends.length, "Please check the params of your periods !");
        bDSLA = bDSLAToken(_tokenAddress);
        allowedTokens.push(address(bDSLA));
        validator = msg.sender;
        
        for(uint i = 0; i < _sla_period_starts.length; i++) {
            _addPeriod(_sla_period_starts[i], _sla_period_ends[i]);
        }
    }
    
    // add new period 
    function addNewPeriod(uint _sla_period_start, uint _sla_period_end) public onlyOwner {
        _addPeriod(_sla_period_start, _sla_period_end);
    }
    
    // autorise a new token to be staked
    function addAllowedTokens(address _token) public onlyOwner {
        allowedTokens.push(_token);
    }

    // stake an amount of token
    function stakeTokens(uint _amount, address _token, uint _period) public {
        require(_amount > 0, "amount cannot be 0");
        require(_tokenIsAllowed(_token), "token should be autorised to be staked");

        // check if the staker had already staked another token or not
        _updateUniqueTokensStaked(msg.sender, _token, _period);
        // stake tokens
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        // update balance of staked tokens per staker
        periods[_period].stakingBalance[_token][msg.sender] = periods[_period].stakingBalance[_token][msg.sender].add(_amount);
        totalStaked = totalStaked.add(_amount);

        // if the token is the unique one staked by the staker
        // add the staker to the list
        if (uniqueTokensStaked[msg.sender] == 1) {
            stakers.push(msg.sender);
        }
    }

    // Unstaking Tokens
    function withdraw(address _token, uint _period) public notValidator {
        // check if staker has staked tokens
        require(periods[_period].stakingBalance[_token][msg.sender] > 0, "staking balance cannot be 0");
        require(_tokenIsAllowed(_token), "token should be autorised to be staked");

        // unstake bDSLA tokens
        uint staked = periods[_period].stakingBalance[_token][msg.sender];
        uint claimed_reward = periods[_period].claimed_reward.div(stakers.length);
        
        periods[_period].stakingBalance[_token][msg.sender] = 0;
        totalStaked = totalStaked.sub(staked);
        IERC20(_token).transfer(msg.sender, staked.sub(claimed_reward));

        // update uniqueTokensStaked for the staker
        uniqueTokensStaked[msg.sender] = uniqueTokensStaked[msg.sender].sub(1);
        
        if(uniqueTokensStaked[msg.sender] == 0) {
            uint index = _getIndex(msg.sender);
            delete stakers[index];
        }
    }

    // withdraw bDSLA and stake d Tokens
    function withdrawAndStake(address _token, uint _amount, uint _period) public notValidator {
      // check if staker has staked tokens
      require(periods[_period].stakingBalance[_token][msg.sender] > 0, "staking balance cannot be 0");
      require(_tokenIsAllowed(_token), "token should be autorised to be staked");

      // stake d tokens
      IERC20(_token).transferFrom(msg.sender, address(this), _amount);
      // update balance of staked tokens per staker
      periods[_period].stakingBalance[_token][msg.sender] = periods[_period].stakingBalance[_token][msg.sender].add(_amount);
      totalStaked = totalStaked.add(_amount);

      // unstake bDSLA tokens
      uint staked = periods[_period].stakingBalance[_token][msg.sender];
      uint claimed_reward = periods[_period].claimed_reward.div(stakers.length);

      periods[_period].stakingBalance[_token][msg.sender] = 0;
      totalStaked = totalStaked.sub(staked);
      bDSLA.transfer(msg.sender, staked.sub(claimed_reward));
      
    }
    
    // claim from validators
    function claimReward(uint _period) public onlyInPeriod(_period) onlyValidator {
        require(periods[_period].status == Status.Respected, "SLA not respected !");
        require(!periods[_period].claimed, "You have already claimed your reward for this period !");
            
        uint reward = totalStaked.div(periods.length);
        uint fees = reward.mul(3).div(10);
        
        totalStaked = totalStaked.sub(reward);
        periods[_period].claimed_reward = reward;
        periods[_period].claimed = true;

        bDSLA.transfer(msg.sender, reward);
        bDSLA.burn(fees);
    }
    
    // claim from delegators
    function claimCompensation(uint _period) public onlyInPeriod(_period) notValidator {
        require(periods[_period].status == Status.NotRespected, "SLA respected !");
        require(periods[_period].claimed_compensation[msg.sender] == 0, "You have already claimed your compensation for this period !");
           
        uint compensation = getUserTotalValue(msg.sender, _period);
        uint fees = compensation.mul(3).div(10);
        
        totalStaked = totalStaked.sub(compensation);
        periods[_period].claimed_compensation[msg.sender] = compensation;

        bDSLA.transfer(msg.sender, compensation);
        bDSLA.burn(fees);
    }
    
    function getUserTotalValue(address _user, uint _period) public view returns (uint256) {
        uint256 totalValue = 0;
        if (uniqueTokensStaked[_user] > 0) {
            for (
                uint256 allowedTokensIndex = 0;
                allowedTokensIndex < allowedTokens.length;
                allowedTokensIndex++
            ) {
                totalValue = totalValue.add(periods[_period].stakingBalance[allowedTokens[allowedTokensIndex]][_user]);
            }
        }
        return totalValue;
    }
    
    function _tokenIsAllowed(address token) internal view returns (bool){
        for (
            uint256 allowedTokensIndex = 0;
            allowedTokensIndex < allowedTokens.length;
            allowedTokensIndex++
        ) {
            if (allowedTokens[allowedTokensIndex] == token) {
                return true;
            }
        }
        return false;
    }
    
    function _updateUniqueTokensStaked(address _user, address _token, uint _period) internal {
        if (periods[_period].stakingBalance[_token][_user] <= 0) {
            uniqueTokensStaked[_user] = uniqueTokensStaked[_user].add(1);
        }
    }
    
    function _getIndex(address _user) internal view returns (uint){
        for(uint i = 0; i < stakers.length; i++){
            if(stakers[i] == _user){
                return i;
            }
        }
        return (uint(-1));
    }
    
    function _addPeriod(uint _sla_period_start, uint _sla_period_end) internal {
        Period memory _period;
        
        _period.sla_period_start = _sla_period_start;
        _period.sla_period_end = _sla_period_end;
        _period.status = Status.NotVerified; 
        
        periods.push(_period);
        
        emit NewPeriodAdded(periods.length.sub(1));
    }
}