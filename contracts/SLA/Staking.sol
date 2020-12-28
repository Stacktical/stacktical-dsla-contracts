// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "../bDSLA/bDSLAToken.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Staking is Ownable {
    using SafeMath for uint256;

    enum Status {NotVerified, Respected, NotRespected}

    struct Period {
        uint256 sla_period_start;
        uint256 sla_period_end;
        uint256 claimed_reward;
        bool claimed;
        Status status;
        mapping(address => mapping(address => uint256)) stakingBalance; // staking balance for all tokens (address token => (address user => amount))
        mapping(address => uint256) claimed_compensation;
    }

    struct TokenStake {
        address tokenAddress;
        uint256 stake;
    }

    bDSLAToken public bDSLA;
    address public validator;
    address[] public stakers; // list of all stakers (validators, vouchers, delegators ...)
    address[] public allowedTokens; // mapping for all allowed tokens to be staked
    mapping(address => bool) public allowedTokensMapping;
    Period[] public periods; // all periods for an SLA
    mapping(address => uint256) public uniqueTokensStaked; // mapping to trace how many token is staked by an user
    mapping(address => TokenStake[]) public userStakes; // mapping from address to TokenStake to retrieve balances staked
    mapping(address => mapping(address => uint256))
        public userStakedTokensIndex; // userAddress => erc20Address => index of userStakes mapping array
    mapping(address => mapping(address => bool)) public userStakedTokens; // // userAddress => erc20Address => token is staked
    uint256 public totalStaked;

    // @dev DAI token
    IERC20 public DAI;

    event NewPeriodAdded(uint256 indexed period_index);

    modifier notValidator {
        require(msg.sender != validator, "You are a validator !");
        _;
    }

    modifier onlyValidator {
        require(msg.sender == validator, "You are not a validator !");
        _;
    }

    modifier onlyInPeriod(uint256 _period) {
        require(
            block.timestamp >= periods[_period].sla_period_start &&
                block.timestamp <= periods[_period].sla_period_end
        );
        _;
    }

    modifier onlyAllowedToken(address _token) {
        require(allowedTokensMapping[_token] == true, "token is not allowed");
        _;
    }

    constructor(
        bDSLAToken _tokenAddress,
        uint256[] memory _sla_period_starts,
        uint256[] memory _sla_period_ends,
        address _owner,
        address _daiAddress
    ) public {
        require(
            _sla_period_starts.length == _sla_period_ends.length,
            "Please check the params of your periods !"
        );
        validator = _owner;
        // Add bDSLA as allowed token
        bDSLA = bDSLAToken(_tokenAddress);
        allowedTokens.push(address(bDSLA));
        allowedTokensMapping[address(bDSLA)] = true;

        // Add bDSLA as allowed token
        DAI = IERC20(_daiAddress);
        allowedTokens.push(address(DAI));
        allowedTokensMapping[address(DAI)] = true;

        for (uint256 i = 0; i < _sla_period_starts.length; i++) {
            _addPeriod(_sla_period_starts[i], _sla_period_ends[i]);
        }
    }

    // add new period
    function addNewPeriod(uint256 _sla_period_start, uint256 _sla_period_end)
        public
        onlyOwner
    {
        _addPeriod(_sla_period_start, _sla_period_end);
    }

    // authorize a new token to be staked
    function addAllowedTokens(address _token) public onlyOwner {
        require(allowedTokensMapping[_token] == false, "token already added");
        allowedTokens.push(_token);
        allowedTokensMapping[_token] = true;
    }

    function _increaseTokenStaking(address _token, uint256 _amount) internal {
        if (userStakedTokens[msg.sender][_token] == false) {
            userStakes[msg.sender].push(
                TokenStake({tokenAddress: _token, stake: _amount})
            );
            uint256 newTokenIndex = userStakes[msg.sender].length - 1;
            userStakedTokensIndex[msg.sender][_token] = newTokenIndex;
            userStakedTokens[msg.sender][_token] = true;
        } else {
            uint256 tokenIndex = userStakedTokensIndex[msg.sender][_token];
            userStakes[msg.sender][tokenIndex].stake = userStakes[msg.sender][
                tokenIndex
            ]
                .stake
                .add(_amount);
        }
    }

    function _decreaseTokenStaking(address _token, uint256 _amount) internal {
        uint256 tokenIndex = userStakedTokensIndex[msg.sender][_token];
        userStakes[msg.sender][tokenIndex].stake.sub(_amount);
    }

    // stake an amount of token
    function stakeTokens(
        uint256 _amount,
        address _token,
        uint256 _period
    ) public onlyAllowedToken(_token) {
        require(_amount > 0, "amount cannot be 0");
        // check if the staker had already staked another token or not
        _updateUniqueTokensStaked(msg.sender, _token, _period);
        // stake tokens
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        // update balance of staked tokens per staker
        periods[_period].stakingBalance[_token][msg.sender] = periods[_period]
            .stakingBalance[_token][msg.sender]
            .add(_amount);
        totalStaked = totalStaked.add(_amount);

        // if the token is the unique one staked by the staker
        // add the staker to the list
        if (uniqueTokensStaked[msg.sender] == 1) {
            stakers.push(msg.sender);
        }

        _increaseTokenStaking(_token, _amount);
    }

    // Unstaking Tokens
    function withdraw(address _token, uint256 _period)
        public
        notValidator
        onlyAllowedToken(_token)
    {
        // check if staker has staked tokens
        require(
            periods[_period].stakingBalance[_token][msg.sender] > 0,
            "staking balance cannot be 0"
        );

        // unstake bDSLA tokens
        uint256 staked = periods[_period].stakingBalance[_token][msg.sender];
        uint256 claimed_reward =
            periods[_period].claimed_reward.div(stakers.length);

        periods[_period].stakingBalance[_token][msg.sender] = 0;
        totalStaked = totalStaked.sub(staked);
        IERC20(_token).transfer(msg.sender, staked.sub(claimed_reward));

        // update uniqueTokensStaked for the staker
        uniqueTokensStaked[msg.sender] = uniqueTokensStaked[msg.sender].sub(1);

        if (uniqueTokensStaked[msg.sender] == 0) {
            uint256 index = _getIndex(msg.sender);
            delete stakers[index];
        }

        _decreaseTokenStaking(_token, staked);
    }

    // withdraw bDSLA and stake d Tokens
    function withdrawAndStake(
        address _token,
        uint256 _amount,
        uint256 _period
    ) public notValidator onlyAllowedToken(_token) {
        // check if staker has staked tokens
        require(
            periods[_period].stakingBalance[_token][msg.sender] > 0,
            "staking balance cannot be 0"
        );

        // stake d tokens
        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        // update balance of staked tokens per staker
        periods[_period].stakingBalance[_token][msg.sender] = periods[_period]
            .stakingBalance[_token][msg.sender]
            .add(_amount);
        totalStaked = totalStaked.add(_amount);

        _increaseTokenStaking(_token, _amount);

        // unstake bDSLA tokens
        uint256 staked = periods[_period].stakingBalance[_token][msg.sender];
        uint256 claimed_reward =
            periods[_period].claimed_reward.div(stakers.length);

        periods[_period].stakingBalance[_token][msg.sender] = 0;
        totalStaked = totalStaked.sub(staked);
        bDSLA.transfer(msg.sender, staked.sub(claimed_reward));

        _decreaseTokenStaking(address(bDSLA), staked);
    }

    // claim from validators
    function claimReward(uint256 _period)
        public
        onlyInPeriod(_period)
        onlyValidator
    {
        require(
            periods[_period].status == Status.Respected,
            "SLA not respected !"
        );
        require(
            !periods[_period].claimed,
            "You have already claimed your reward for this period !"
        );

        uint256 reward = totalStaked.div(periods.length);
        uint256 fees = reward.mul(3).div(10);

        totalStaked = totalStaked.sub(reward);
        periods[_period].claimed_reward = reward;
        periods[_period].claimed = true;

        bDSLA.transfer(msg.sender, reward);
        bDSLA.burn(fees);
    }

    // claim from delegators
    function claimCompensation(uint256 _period)
        public
        onlyInPeriod(_period)
        notValidator
    {
        require(
            periods[_period].status == Status.NotRespected,
            "SLA respected !"
        );
        require(
            periods[_period].claimed_compensation[msg.sender] == 0,
            "You have already claimed your compensation for this period !"
        );

        uint256 compensation = getUserTotalValue(msg.sender, _period);
        uint256 fees = compensation.mul(3).div(10);

        totalStaked = totalStaked.sub(compensation);
        periods[_period].claimed_compensation[msg.sender] = compensation;

        bDSLA.transfer(msg.sender, compensation);
        bDSLA.burn(fees);
    }

    function getUserTotalValue(address _user, uint256 _period)
        public
        view
        returns (uint256)
    {
        uint256 totalValue = 0;
        if (uniqueTokensStaked[_user] > 0) {
            for (
                uint256 allowedTokensIndex = 0;
                allowedTokensIndex < allowedTokens.length;
                allowedTokensIndex++
            ) {
                totalValue = totalValue.add(
                    periods[_period].stakingBalance[
                        allowedTokens[allowedTokensIndex]
                    ][_user]
                );
            }
        }
        return totalValue;
    }

    function _updateUniqueTokensStaked(
        address _user,
        address _token,
        uint256 _period
    ) internal {
        if (periods[_period].stakingBalance[_token][_user] <= 0) {
            uniqueTokensStaked[_user] = uniqueTokensStaked[_user].add(1);
        }
    }

    function _getIndex(address _user) internal view returns (uint256) {
        for (uint256 i = 0; i < stakers.length; i++) {
            if (stakers[i] == _user) {
                return i;
            }
        }
        return (uint256(-1));
    }

    function _addPeriod(uint256 _sla_period_start, uint256 _sla_period_end)
        internal
    {
        Period memory _period;

        _period.sla_period_start = _sla_period_start;
        _period.sla_period_end = _sla_period_end;
        _period.status = Status.NotVerified;

        periods.push(_period);

        emit NewPeriodAdded(periods.length.sub(1));
    }

    /**
     * @dev public view function that returns the total amount of stakers
     *
     */
    function stakersCount() public view returns (uint256) {
        return stakers.length;
    }

    function getPeriodData(uint256 _periodId)
        public
        view
        returns (uint256 periodStart, uint256 periodEnd)
    {
        return (
            periods[_periodId].sla_period_start,
            periods[_periodId].sla_period_end
        );
    }

    function getTokenStakeLength(address _owner) public view returns (uint256) {
        return userStakes[_owner].length;
    }

    function getTokenStake(address _owner, uint256 _index)
        public
        view
        returns (address tokenAddress, uint256 stake)
    {
        return (
            userStakes[_owner][_index].tokenAddress,
            userStakes[_owner][_index].stake
        );
    }
}
