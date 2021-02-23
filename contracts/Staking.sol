// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./StakeRegistry.sol";
import "./PeriodRegistry.sol";
import "./StringUtils.sol";

contract Staking is Ownable, StringUtils {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    /// @dev StakeRegistry contract
    StakeRegistry private stakeRegistry;
    /// @dev SLARegistry contract
    PeriodRegistry private periodRegistry;
    /// @dev current SLA id
    uint256 public slaID;
    /// @dev (tokenAddress=>uint256) total pooled token balance
    mapping(address => uint256) public providerPool;
    /// @dev (tokenAddress=>uint256) total pooled token balance
    mapping(address => uint256) public usersPool;

    ///@dev (tokenAddress=>dTokenAddress) to keep track of dToken per token
    mapping(address => ERC20PresetMinterPauser) public dTokenRegistry;

    ///@dev index to keep a deflationary mint of tokens
    uint256 public cumulatedDevaluation = 10 * 6;
    ///@dev to keep track of the precision used to avoid multiplying by 0
    uint256 internal cumulatedDevaluationPrecision = 10**6;

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

    /// @dev PeriodRegistry period type of the SLA contract
    PeriodRegistry.PeriodType private periodType;
    /// @dev length of the _periodIds array, to state effective APY
    uint256 public slaPeriodsLength;

    /// @dev boolean to declare if contract is whitelisted
    bool public whitelistedContract;
    /// @dev (userAddress=bool) to declare whitelisted addresses
    mapping(address => bool) public whitelist;

    modifier notOwner {
        require(msg.sender != owner(), "Should not be called by the SLA owner");
        _;
    }

    modifier onlyAllowedToken(address _token) {
        require(isAllowedToken(_token) == true, "token is not allowed");
        _;
    }

    modifier onlyWhitelisted {
        if (whitelistedContract == true) {
            require(whitelist[msg.sender] == true, "User is not whitelisted");
        }
        _;
    }

    /**
     * @dev event for provider reward log
     * @param periodId 1. id of the period
     * @param tokenAddress 2. address of the token
     * @param rewardPercentage 3. reward percentage for the provider
     * @param amount 4. amount rewarded
     */
    event ProviderRewardGenerated(
        uint256 indexed periodId,
        address indexed tokenAddress,
        uint256 rewardPercentage,
        uint256 amount
    );

    /**
     *@param _stakeRegistry 1. address of the stake registry
     *@param _periodRegistry 2. address of the period registry
     *@param _periodType 3. period type of the SLA
     *@param _slaPeriodsLength 4. length of the SLA periodsId stored on the sla contract
     *@param _whitelistedContract 5. enables the white list feature
     *@param _slaID 6. identifies the SLA to uniquely to emit dTokens
     */
    constructor(
        address _stakeRegistry,
        address _periodRegistry,
        PeriodRegistry.PeriodType _periodType,
        uint256 _slaPeriodsLength,
        bool _whitelistedContract,
        uint256 _slaID
    ) public {
        stakeRegistry = StakeRegistry(_stakeRegistry);
        periodRegistry = PeriodRegistry(_periodRegistry);
        periodType = _periodType;
        slaPeriodsLength = _slaPeriodsLength;
        whitelistedContract = _whitelistedContract;
        (
            uint256 _DSLAburnRate,
            uint256 _minimumDSLAStakedTier1,
            uint256 _minimumDSLAStakedTier2,
            uint256 _minimumDSLAStakedTier3
        ) = stakeRegistry.getStakingParameters();
        dslaTokenAddress = stakeRegistry.DSLATokenAddress();
        DSLAburnRate = _DSLAburnRate;
        minimumDSLAStakedTier1 = _minimumDSLAStakedTier1;
        minimumDSLAStakedTier2 = _minimumDSLAStakedTier2;
        minimumDSLAStakedTier3 = _minimumDSLAStakedTier3;
        addUserToWhitelist(msg.sender);
        allowedTokens.push(dslaTokenAddress);
        slaID = _slaID;
        string memory dTokenID = _uintToStr(_slaID);
        string memory dTokenName =
            string(abi.encodePacked("DSLA-DSLA-", dTokenID));
        string memory dTokenSymbol =
            string(abi.encodePacked("dDSLA-", dTokenID));
        ERC20PresetMinterPauser dDSLA =
            new ERC20PresetMinterPauser(dTokenName, dTokenSymbol);
        dTokenRegistry[dslaTokenAddress] = dDSLA;
    }

    function addUserToWhitelist(address _userAddress) public onlyOwner {
        require(whitelist[_userAddress] == false, "User already whitelisted");
        whitelist[_userAddress] = true;
    }

    function removeUserFromWhitelist(address _userAddress) public onlyOwner {
        require(whitelist[_userAddress] == true, "User not whitelisted");
        whitelist[_userAddress] = false;
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
        allowedTokens.push(_tokenAddress);
        string memory dTokenID = _uintToStr(slaID);
        string memory name = ERC20(_tokenAddress).name();
        string memory dTokenName =
            string(abi.encodePacked("DSLA-", name, "-", dTokenID));
        string memory dTokenSymbol =
            string(abi.encodePacked("d", name, "-", dTokenID));
        ERC20PresetMinterPauser dToken =
            new ERC20PresetMinterPauser(dTokenName, dTokenSymbol);
        dTokenRegistry[_tokenAddress] = dToken;
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
        ERC20(_tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        if (msg.sender != owner()) {
            (uint256 providerStake, uint256 usersStake) =
                (providerPool[_tokenAddress], usersPool[_tokenAddress]);
            require(
                usersStake.add(_amount) <= providerStake,
                "Cannot stake more than SLA provider stake"
            );
            usersPool[_tokenAddress] = usersPool[_tokenAddress].add(_amount);
            // mint dTokens considering net present value respect to first period
            uint256 dTokenAmount =
                _amount.mul(cumulatedDevaluationPrecision).div(
                    cumulatedDevaluation
                );
            ERC20PresetMinterPauser dToken = dTokenRegistry[_tokenAddress];
            dToken.mint(msg.sender, dTokenAmount);
        } else {
            // Mint pTokens here
            providerPool[_tokenAddress] = providerPool[_tokenAddress].add(
                _amount
            );
        }
        if (!isStaker(msg.sender)) {
            stakers.push(msg.sender);
        }
    }

    /**
     *@dev withdraw staked tokens. Only owner can withdraw,
     * users have to claim compensations if available
     *@param _amount 1. amount to withdraw
     *@param _tokenAddress 2. address of the token
     */
    function _withdraw(uint256 _amount, address _tokenAddress)
        internal
        onlyAllowedToken(_tokenAddress)
        onlyOwner
    {
        uint256 providerStake = providerPool[_tokenAddress];
        uint256 usersStake = usersPool[_tokenAddress];
        require(
            providerStake.sub(_amount) >= usersStake,
            "Should not withdraw more than users stake"
        );
        // Burn pTokens
        providerPool[_tokenAddress] = providerPool[_tokenAddress].sub(_amount);
        ERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
    }

    /**
     *@dev sets the provider reward
     *@notice it calculates the usersStake and calculates the provider reward from it.
     * @param _periodId 1. id of the period
     * @param _rewardPercentage to calculate the provider reward
     * @param _precision used to avoid getting 0 after division in the SLA's registerSLI function
     */
    function _setRespectedPeriodReward(
        uint256 _periodId,
        uint256 _rewardPercentage,
        uint256 _precision
    ) internal {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            address tokenAddress = allowedTokens[index];
            uint256 usersStake = usersPool[tokenAddress];
            uint256 reward =
                usersStake.mul(_rewardPercentage).div(100 * _precision);

            // Subtract before burn to match balances
            usersPool[tokenAddress] = usersPool[tokenAddress].sub(reward);

            if (tokenAddress == dslaTokenAddress) {
                uint256 fees = _burnDSLATokens(reward);
                reward = reward.sub(fees);
            }

            // Add after burn to match balances
            providerPool[tokenAddress] = providerPool[tokenAddress].add(reward);

            emit ProviderRewardGenerated(
                _periodId,
                tokenAddress,
                _rewardPercentage,
                reward
            );
        }
        // update cumulativeDevaluation to increase dTokens generation over time
        // decimalReward: the decimal proportion of rewards, e.g. 0.05)
        // rewardPercentage = precision * decimal
        // Then, by definition:
        // cumulatedDevaluation = cumulatedDevaluation*(1-decimalReward)
        // cumulatedDevaluation = cumulatedDevaluation*(1-decimalReward)*precision/precision
        // Finally
        // cumulatedDevaluation = cumulatedDevaluation*(precision-rewardPercentage)/precision
        cumulatedDevaluation = cumulatedDevaluation
            .mul(_precision - _rewardPercentage)
            .div(_precision);
    }

    /**
     *@dev sets the users compensation pool
     *@notice it calculates the usersStake and calculates the users compensation from it
     */
    function _setUsersCompensation() internal {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            address tokenAddress = allowedTokens[index];
            uint256 usersStake = usersPool[tokenAddress];
            uint256 compensation = usersStake;
            // Subtract before burn to match balances
            providerPool[tokenAddress] = providerPool[tokenAddress].sub(
                compensation
            );

            if (tokenAddress == dslaTokenAddress) {
                uint256 fees = _burnDSLATokens(compensation);
                compensation = compensation.sub(fees);
            }

            // Add after burn to match balances
            usersPool[tokenAddress] = usersPool[tokenAddress].add(compensation);
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
        ERC20PresetMinterPauser dToken = dTokenRegistry[_tokenAddress];
        uint256 dTokenBalance = dToken.balanceOf(msg.sender);
        uint256 dTokenSupply = dToken.totalSupply();
        uint256 precision = 10000;
        require(
            dTokenBalance > 0,
            "Can only claim a compensation if position is bigger than 0"
        );

        uint256 userCompensationPercentage =
            dTokenBalance.mul(precision).div(dTokenSupply);
        uint256 userCompensation =
            usersPool[_tokenAddress].mul(userCompensationPercentage).div(
                precision
            );
        dToken.burn(dTokenBalance);
        ERC20(_tokenAddress).safeTransfer(msg.sender, userCompensation);
    }

    function _burnDSLATokens(uint256 _amount) internal returns (uint256 fees) {
        bytes4 BURN_SELECTOR = bytes4(keccak256(bytes("burn(uint256)")));
        fees = _amount.mul(DSLAburnRate).div(1000);
        (bool _success, ) =
            dslaTokenAddress.call(abi.encodeWithSelector(BURN_SELECTOR, fees));
        require(_success, "DSLA burn process was not successful");
    }

    /**
     *@dev returns true if the _staker address is registered as staker
     *@param _staker 1. staker address
     *@return true if address is staker
     */
    function isStaker(address _staker) public view returns (bool) {
        for (uint256 index = 0; index < stakers.length; index++) {
            if (stakers[index] == _staker) return true;
        }
        return false;
    }

    /**
     *@dev use this function to evaluate the length of the allowed tokens length
     *@return allowedTokens.length
     */
    function getAllowedTokensLength() public view returns (uint256) {
        return allowedTokens.length;
    }

    function getTokenStake(address _staker, uint256 _allowedTokenIndex)
        public
        view
        returns (address tokenAddress, uint256 stake)
    {
        address allowedTokenAddress = allowedTokens[_allowedTokenIndex];
        if (_staker == owner()) {
            return (allowedTokenAddress, providerPool[allowedTokenAddress]);
        } else {
            ERC20PresetMinterPauser dToken =
                dTokenRegistry[allowedTokenAddress];
            uint256 dTokenBalance = dToken.balanceOf(msg.sender);
            uint256 dTokenSupply = dToken.totalSupply();
            uint256 precision = 10000;
            uint256 userCompensationPercentage =
                dTokenBalance.mul(precision).div(dTokenSupply);
            return (
                allowedTokenAddress,
                usersPool[allowedTokenAddress]
                    .mul(userCompensationPercentage)
                    .div(precision)
            );
        }
    }

    /**
     *@dev checks in the allowedTokens array if there's a token with _tokenAddress value
     *@param _tokenAddress 1. token address to check exixtence
     *@return true if _tokenAddress exists in the allowedTokens array
     */
    function isAllowedToken(address _tokenAddress) public view returns (bool) {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            if (allowedTokens[index] == _tokenAddress) {
                return true;
            }
        }
        return false;
    }
}
