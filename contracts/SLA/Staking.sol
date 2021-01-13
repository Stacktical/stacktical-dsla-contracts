// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

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
    bytes4 private constant BURN_SELECTOR =
        bytes4(keccak256(bytes("burn(uint256)")));

    /// @dev IERC20 of the base stake address for the SLA
    IERC20 public BaseToken;

    /// @dev all periods for an SLA
    Period[] public periods;

    /// @dev userAddress => erc20Address => index of userStakes mapping array
    uint256 public totalStaked;
    /// @dev address of the validator for the SLA
    address public validator;
    /// @dev list of all stakers (validators, vouchers, delegators ...)
    address[] public stakers;
    /// @dev array with the allowed tokens addresses of the SLA
    address[] public allowedTokens;
    /// @dev mapping for all allowed tokens to be staked
    mapping(address => bool) public allowedTokensMapping;
    /// @dev (mapping) userAddress => amountOf tokens mapping
    mapping(address => uint256) public uniqueTokensStaked;
    /// @dev (mapping) userAddress => TokenStake[] mapping
    mapping(address => TokenStake[]) public userStakes;
    /// @dev (mapping) userAddress => erc20Address => index: index of the TokenStake array
    mapping(address => mapping(address => uint256))
        public userStakedTokensIndex;
    /// @dev (mapping) userAddress => erc20Address => bool: user has erc20Address staked
    mapping(address => mapping(address => bool)) public userStakedTokens;
    /// @dev (mapping) erc20Address => stakeAmount: stake amount by tokenAddress
    mapping(address => uint256) public tokensPool;

    /**
     *@param period_index 1. index of the period added
     */
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

    /**
     *@param _baseTokenAddress 1. address of the base token
     *@param _sla_period_starts 2. array of starts of period
     *@param _sla_period_ends 3. array of ends of period
     *@param _owner 4. address of the owner of the SLA
     */
    constructor(
        address _baseTokenAddress,
        uint256[] memory _sla_period_starts,
        uint256[] memory _sla_period_ends,
        address _owner
    ) public {
        require(
            _sla_period_starts.length == _sla_period_ends.length,
            "Please check the params of your periods !"
        );
        validator = _owner;

        // Add BaseToken as allowed token
        BaseToken = IERC20(_baseTokenAddress);
        allowedTokens.push(_baseTokenAddress);
        allowedTokensMapping[_baseTokenAddress] = true;

        for (uint256 i = 0; i < _sla_period_starts.length; i++) {
            _addPeriod(_sla_period_starts[i], _sla_period_ends[i]);
        }
    }

    /**
     *@dev add a new period to the array
     *@param _sla_period_start 1. uint256 of the start of the period
     *@param _sla_period_end 2. uint256 of the end of the period
     */
    function addNewPeriod(uint256 _sla_period_start, uint256 _sla_period_end)
        public
        onlyOwner
    {
        _addPeriod(_sla_period_start, _sla_period_end);
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
     *@param _token 1. address of the token
     *@param _amount 2. amount to be staked
     */
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
        tokensPool[_token] = tokensPool[_token].add(_amount);
    }

    /**
     *@dev decrease the amount staked per token
     *@param _token 1. address of the token
     *@param _amount 2. amount to be decreased
     */
    function _decreaseTokenStaking(address _token, uint256 _amount) internal {
        uint256 tokenIndex = userStakedTokensIndex[msg.sender][_token];
        userStakes[msg.sender][tokenIndex].stake.sub(_amount);
        tokensPool[_token] = tokensPool[_token].sub(_amount);
    }

    /**
     *@dev increase the amount staked per token
     *@param _amount 1. amount to be staked
     *@param _token 2. address of the token
     *@param _period 3. period id to stake
     */
    function _stakeTokens(
        uint256 _amount,
        address _token,
        uint256 _period
    ) internal onlyAllowedToken(_token) {
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

    /**
     *@dev withdraw staked tokens
     *@param _token 1. address of the token
     *@param _period 2. period id to withdraw
     */
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

    /**
     *@dev withdraw BaseToken and stake d Tokens
     *@param _token 1. address of the token
     *@param _amount 2. amount to withdraw
     *@param _period 3. period id to withdraw
     */
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

        // unstake base tokens
        uint256 staked = periods[_period].stakingBalance[_token][msg.sender];
        uint256 claimed_reward =
            periods[_period].claimed_reward.div(stakers.length);

        periods[_period].stakingBalance[_token][msg.sender] = 0;
        totalStaked = totalStaked.sub(staked);
        BaseToken.transfer(msg.sender, staked.sub(claimed_reward));

        _decreaseTokenStaking(address(BaseToken), staked);
    }

    /**
     *@dev claim from validators
     *@param _period 1. period id to claim
     */
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

        BaseToken.transfer(msg.sender, reward);
        (bool _success, ) =
            address(BaseToken).call(
                abi.encodeWithSelector(BURN_SELECTOR, fees)
            );

        require(_success, "BaseToken burn process was not successful");
    }

    /**
     *@dev claim from delegators
     *@param _period 1. period id to claim
     */
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

        BaseToken.transfer(msg.sender, compensation);
        (bool _success, ) =
            address(BaseToken).call(
                abi.encodeWithSelector(BURN_SELECTOR, fees)
            );

        require(_success, "BaseToken burn process was not successful");
    }

    /**
     *@dev get the user total value staked
     *@param _user 1. address of the user
     *@param _period 2. period id to claim
     */
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

    /**
     * @dev returns the length of TokenStakes per user
     * @param _owner 1. owner of the stake
     */

    function getTokenStakeLength(address _owner) public view returns (uint256) {
        return userStakes[_owner].length;
    }

    /**
     * @dev returns the token stake according to index
     * @param _owner 1. owner of the stake
     * @param _index 2. index of the TokenStake
     */
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
