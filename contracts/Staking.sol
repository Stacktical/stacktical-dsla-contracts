// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./StakeRegistry.sol";
import "./PeriodRegistry.sol";

contract Staking is Ownable {
    using SafeMath for uint256;

    /// @dev StakeRegistry contract
    StakeRegistry private stakeRegistry;
    /// @dev SLARegistry contract
    PeriodRegistry private periodRegistry;

    /// @dev (tokenAddress=>uint256) total pooled token balance
    mapping(address => uint256) tokenPools;
    /// @dev (tokenAddress=>stakerAddress=>uint256) staker position to represent his proportion staked
    mapping(address => mapping(address => uint256)) stakeHoldersPositions;
    /// @dev (tokenAddress=>uint256) used to keep track of the stakes of the users, to calculate proportion of compensation pool
    mapping(address => uint256) public usersTotalPositions;
    /// @dev (tokenAddress=>uint256) users available compensation per token
    mapping(address => uint256) public usersCompensationPools;
    /// @dev (periodId=>tokenAddress=>uint256) provider compensation per period and per token
    mapping(uint256 => mapping(address => uint256))
        public providerPeriodsRewards;
    /// @dev address[] of the stakers of the SLA contract
    address[] public stakers;
    /// @dev DSLA token address to burn fees
    address public dslaTokenAddress;
    /// @dev array with the allowed tokens addresses for the current SLA
    address[] public allowedTokens;

    /// @dev corresponds to the burn rate of DSLA tokens, but divided by 1000 i.e burn percentage = burnRate/1000 %
    uint256 public DSLAburnRate;
    /// @dev minimum deposit for Tier 1 staking
    uint256 public minimumDSLAStakedTier1;
    /// @dev minimum deposit for Tier 2 staking
    uint256 public minimumDSLAStakedTier2;
    /// @dev minimum deposit for Tier 3 staking
    uint256 public minimumDSLAStakedTier3;

    /// @dev PeriodRegistry defined apy
    uint256 public apy;
    /// @dev PeriodRegistry defined amount of periods over a year
    uint256 public yearlyPeriods;
    /// @dev PeriodRegistry period type of the SLA contract
    PeriodRegistry.PeriodType private periodType;
    /// @dev length of the _periodIds array, to state effective APY
    uint256 public slaPeriodsLength;

    /// @dev boolean to declare if contract is whitelisted
    bool public whitelisted;
    /// @dev (userAddress=bool) to declare whitelisted addresses
    mapping(address => bool) whitelist;

    modifier notOwner {
        require(msg.sender != owner(), "Should not be called by the SLA owner");
        _;
    }

    modifier onlyAllowedToken(address _token) {
        require(isAllowedToken(_token) == true, "token is not allowed");
        _;
    }

    modifier onlyWhitelisted {
        if (whitelisted == true) {
            require(whitelist[msg.sender] == true, "User is not whitelisted");
        }
        _;
    }

    /**
     *@param _stakeRegistry 1. address of the base token
     */
    constructor(
        address _stakeRegistry,
        address _periodRegistry,
        PeriodRegistry.PeriodType _periodType,
        uint256 _slaPeriodsLength,
        bool _whitelisted
    ) public {
        stakeRegistry = StakeRegistry(_stakeRegistry);
        periodRegistry = PeriodRegistry(_periodRegistry);
        periodType = _periodType;
        slaPeriodsLength = _slaPeriodsLength;
        whitelisted = _whitelisted;
        (
            uint256 _DSLAburnRate,
            uint256 _minimumDSLAStakedTier1,
            uint256 _minimumDSLAStakedTier2,
            uint256 _minimumDSLAStakedTier3
        ) = stakeRegistry.getStakingParameters();
        (uint256 _apy, uint256 _yearlyPeriods, ) =
            periodRegistry.periodDefinitions(_periodType);
        apy = _apy;
        yearlyPeriods = _yearlyPeriods;
        dslaTokenAddress = stakeRegistry.DSLATokenAddress();
        DSLAburnRate = _DSLAburnRate;
        minimumDSLAStakedTier1 = _minimumDSLAStakedTier1;
        minimumDSLAStakedTier2 = _minimumDSLAStakedTier2;
        minimumDSLAStakedTier3 = _minimumDSLAStakedTier3;
    }

    function whitelistUser(address _userAddress) public onlyOwner {
        require(whitelist[_userAddress] == false, "User already whitelisted");
        whitelist[_userAddress] = true;
    }

    /**
     *@dev add a token to ve allowed for staking
     *@param _tokenAddress 1. address of the new allowed token
     */
    function addAllowedTokens(address _tokenAddress) public onlyOwner {
        require(isAllowedToken(_tokenAddress) == false, "Token already added");
        require(
            stakeRegistry.isAllowedToken(_tokenAddress) == true,
            "Token not allowed by the SLARegistry contract"
        );
        (uint256 providerStake, ) = getStakeholdersPositions(dslaTokenAddress);
        require(
            providerStake > minimumDSLAStakedTier1,
            "Should stake at least minimumDSLAStakedTier1 to add a new token"
        );
        allowedTokens.push(_tokenAddress);
    }

    /**
     *@dev increase the amount staked per token
     *@param _amount 1. amount to be staked
     *@param _tokenAddress 2. address of the token
     *@notice providers can stake at any time
     *@notice users can stake at any time but no more than provider pool
     */
    function _stake(uint256 _amount, address _tokenAddress)
        internal
        onlyAllowedToken(_tokenAddress)
        onlyWhitelisted
    {
        if (msg.sender != owner()) {
            (uint256 providerStake, uint256 usersStake) =
                getStakeholdersPositions(_tokenAddress);
            require(
                usersStake.add(_amount) <= providerStake,
                "Cannot stake more than SLA providerstake"
            );
        }
        bool success =
            IERC20(_tokenAddress).transferFrom(
                msg.sender,
                address(this),
                _amount
            );
        require(success == true, "Staking process was not succesful");
        tokenPools[_tokenAddress] = tokenPools[_tokenAddress].add(_amount);
        stakeHoldersPositions[_tokenAddress][
            msg.sender
        ] = stakeHoldersPositions[_tokenAddress][msg.sender].add(_amount);
        if (!_isStaker(msg.sender)) {
            stakers.push(msg.sender);
        }
        // after staking successfully, increase the usersTotalPositions of the token
        if (msg.sender != owner()) {
            usersTotalPositions[_tokenAddress] = usersTotalPositions[
                _tokenAddress
            ]
                .add(_amount);
        }
    }

    /**
     *@dev withdraw staked tokens
     *@param _amount 1. amount to withdraw
     *@param _tokenAddress 2. address of the token
     */
    function _withdraw(uint256 _amount, address _tokenAddress)
        internal
        onlyAllowedToken(_tokenAddress)
        onlyWhitelisted
    {
        require(
            stakeHoldersPositions[_tokenAddress][msg.sender] >= _amount,
            "Should not withdraw more stake than staked"
        );
        tokenPools[_tokenAddress] = tokenPools[_tokenAddress].sub(_amount);
        stakeHoldersPositions[_tokenAddress][
            msg.sender
        ] = stakeHoldersPositions[_tokenAddress][msg.sender].sub(_amount);

        bool success = IERC20(_tokenAddress).transfer(msg.sender, _amount);
        require(success == true, "Stake withdraw was not succesful");
    }

    /**
     *@dev sets the provider reward
     *@notice it calculates the usersStake and calculates the provider reward from it.
     * Then it subtract the reward from the users stake, by adding the reward to the
     * owner position without decreasing the tokenPool size
     */
    function _setRespectedPeriodReward(uint256 _periodId) internal {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            address tokenAddress = allowedTokens[index];
            (, uint256 usersStake) = getStakeholdersPositions(tokenAddress);
            uint256 precision = 10000;
            uint256 providerRewardPercentage =
                slaPeriodsLength.mul(precision).mul(apy).div(yearlyPeriods);
            uint256 reward =
                usersStake.mul(providerRewardPercentage).div(100 * precision);
            if (tokenAddress == dslaTokenAddress) {
                uint256 fees = _burnDSLATokens(reward);
                reward.sub(fees);
            }
            stakeHoldersPositions[tokenAddress][
                owner()
            ] = stakeHoldersPositions[tokenAddress][owner()].add(reward);
            providerPeriodsRewards[_periodId][tokenAddress] = reward;
        }
    }

    /**
     *@dev sets the users compensation pool
     *@notice it calculates the usersStake and calculates the users compensation from it
     * then it subtract it from the provider stake, to compensate users with a compensation pool
     */
    function _setUsersCompensationPool() internal {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            address tokenAddress = allowedTokens[index];
            (, uint256 usersStake) = getStakeholdersPositions(tokenAddress);
            uint256 compensation = usersStake;
            if (tokenAddress == dslaTokenAddress) {
                uint256 fees = _burnDSLATokens(compensation);
                compensation.sub(fees);
            }
            tokenPools[tokenAddress] = tokenPools[tokenAddress].sub(
                compensation
            );
            // discount the compensation from the provider position
            stakeHoldersPositions[tokenAddress][
                owner()
            ] = stakeHoldersPositions[tokenAddress][owner()].sub(compensation);
            usersCompensationPools[tokenAddress] = usersCompensationPools[
                tokenAddress
            ]
                .add(compensation);
        }
    }

    /**
     *@dev claim user compensation. Transfers both the compensation and the user remaining stake.
     *@param _tokenAddress 1. address of the token to claim compensation
     *@notice it uses the user position and the user total position per token to check
     * the proportion of the compensation pool that corresponds to every user
     */
    function _claimCompensation(address _tokenAddress)
        public
        notOwner
        onlyWhitelisted
    {
        uint256 precision = 10000;
        uint256 userPosition = stakeHoldersPositions[_tokenAddress][msg.sender];
        require(
            userPosition > 0,
            "Can only claim a compensation if position is bigger than 0"
        );
        // userPosition[tokenAddress]/usersTotalPositions[tokenAddress] is the proportion
        // of the compensation pool to be delivered.
        uint256 userCompensationPercentage =
            userPosition.mul(precision).div(usersTotalPositions[_tokenAddress]);
        uint256 userCompensation =
            usersCompensationPools[_tokenAddress]
                .mul(userCompensationPercentage)
                .div(precision);
        // transfers the user compensation times two, to return compensation and remaining stake
        bool success =
            IERC20(_tokenAddress).transfer(msg.sender, userCompensation * 2);
        require(
            success == true,
            "Transfer process from SLA contract to msg.sender was not succesful"
        );
        usersTotalPositions[_tokenAddress] = usersTotalPositions[_tokenAddress]
            .sub(userPosition);
        usersCompensationPools[_tokenAddress] = usersCompensationPools[
            _tokenAddress
        ]
            .sub(userCompensation);
        stakeHoldersPositions[_tokenAddress][msg.sender] = 0;
    }

    /**
     *@dev gets the positions of stake both for provider and for users
     *@param _tokenAddress 1. token address to get the positions
     *@return providerStake position of the provider (owner) of the SLA contract
     *@return usersStake position of the user of the SLA contract
     */
    function getStakeholdersPositions(address _tokenAddress)
        public
        view
        returns (uint256 providerStake, uint256 usersStake)
    {
        providerStake = stakeHoldersPositions[_tokenAddress][owner()];
        usersStake = tokenPools[_tokenAddress].sub(providerStake);
    }

    function _burnDSLATokens(uint256 _amount) internal returns (uint256 fees) {
        bytes4 BURN_SELECTOR = bytes4(keccak256(bytes("burn(uint256)")));
        fees = _amount.mul(DSLAburnRate).div(1000);
        (bool _success, ) =
            dslaTokenAddress.call(abi.encodeWithSelector(BURN_SELECTOR, fees));
        require(_success, "DSLA burn process was not successful");
        tokenPools[dslaTokenAddress] = tokenPools[dslaTokenAddress].sub(fees);
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
            stakeHoldersPositions[allowedTokenAddress][_staker]
        );
    }

    function isAllowedToken(address _tokenAddress) public view returns (bool) {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            if (allowedTokens[index] == _tokenAddress) {
                return true;
            }
        }
        return false;
    }
}
