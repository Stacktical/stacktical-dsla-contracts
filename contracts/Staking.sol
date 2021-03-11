// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./StakeRegistry.sol";
import "./PeriodRegistry.sol";

contract Staking is Ownable {
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

    ///@dev (tokenAddress=>dTokenAddress) to keep track of dToken for users
    mapping(address => ERC20PresetMinterPauser) public duTokenRegistry;
    ///@dev (tokenAddress=>dTokenAddress) to keep track of dToken for provider
    mapping(address => ERC20PresetMinterPauser) public dpTokenRegistry;

    ///@dev index to keep a deflationary mint of tokens
    uint256 public cumulatedDevaluation = 10**6;
    ///@dev to keep track of the precision used to avoid multiplying by 0
    uint256 public cumulatedDevaluationPrecision = 10**6;

    /// @dev address[] of the stakers of the SLA contract
    address[] public stakers;
    /// @dev DSLA token address to burn fees
    address public dslaTokenAddress;
    /// @dev array with the allowed tokens addresses for the current SLA
    address[] public allowedTokens;

    /// @dev corresponds to the burn rate of DSLA tokens, but divided by 1000 i.e burn percentage = burnRate/1000 %
    uint256 public DSLAburnRate;

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
     * @param rewardPercentagePrecision 4. reward percentage for the provider
     * @param rewardAmount 5. amount rewarded
     */
    event ProviderRewardGenerated(
        uint256 indexed periodId,
        address indexed tokenAddress,
        uint256 rewardPercentage,
        uint256 rewardPercentagePrecision,
        uint256 rewardAmount
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
        (uint256 _DSLAburnRate, , , , ) = stakeRegistry.getStakingParameters();
        dslaTokenAddress = stakeRegistry.DSLATokenAddress();
        DSLAburnRate = _DSLAburnRate;
        addUserToWhitelist(msg.sender);
        slaID = _slaID;
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
        string memory symbol = ERC20(_tokenAddress).symbol();
        string memory duTokenName =
            string(abi.encodePacked("DSLA-USER-", symbol, "-", dTokenID));
        string memory duTokenSymbol =
            string(abi.encodePacked("du", symbol, "-", dTokenID));
        string memory dpTokenName =
            string(abi.encodePacked("DSLA-PROVIDER-", symbol, "-", dTokenID));
        string memory dpTokenSymbol =
            string(abi.encodePacked("dp", symbol, "-", dTokenID));

        ERC20PresetMinterPauser duToken =
            ERC20PresetMinterPauser(
                stakeRegistry.createDToken(duTokenName, duTokenSymbol)
            );
        ERC20PresetMinterPauser dpToken =
            ERC20PresetMinterPauser(
                stakeRegistry.createDToken(dpTokenName, dpTokenSymbol)
            );

        dpTokenRegistry[_tokenAddress] = dpToken;
        duTokenRegistry[_tokenAddress] = duToken;
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
            // mint duTokens considering net present value respect to first period
            uint256 duTokenAmount =
                _amount.mul(cumulatedDevaluationPrecision).div(
                    cumulatedDevaluation
                );
            ERC20PresetMinterPauser duToken = duTokenRegistry[_tokenAddress];
            duToken.mint(msg.sender, duTokenAmount);
        } else {
            ERC20PresetMinterPauser dpToken = dpTokenRegistry[_tokenAddress];
            uint256 p0 = dpToken.totalSupply();
            uint256 t0 = providerPool[_tokenAddress];

            // if there's no minted tokens, then create 1-1 proportion
            if (p0 == 0) {
                dpToken.mint(msg.sender, _amount);
            } else {
                // Mint dpTokens in a way that it doesn't affect the PoolTokens/LPTokens average
                // of current period, so contract owner cannot affect proportional stake of other
                // provider token owners.
                // t0/p0 = (t0+_amount)/(p0+mintedDPTokens)
                // mintedDPTokens = _amount*p0/t0
                uint256 mintedDPTokens = _amount.mul(p0).div(t0);
                dpToken.mint(msg.sender, mintedDPTokens);
            }

            providerPool[_tokenAddress] = providerPool[_tokenAddress].add(
                _amount
            );
        }

        if (!isStaker(msg.sender)) {
            stakers.push(msg.sender);
        }
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
            uint256 reward = usersStake.mul(_rewardPercentage).div(_precision);

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
                _precision,
                reward
            );
        }
        // update cumulativeDevaluation to increase dTokens generation over time
        // decimalReward: the decimal proportion of rewards, e.g. 0.05)
        // rewardPercentage = precision * decimalReward
        // Then, by definition:
        // cumulatedDevaluation = cumulatedDevaluation*(1-decimalReward)
        // cumulatedDevaluation = cumulatedDevaluation*(1-decimalReward)*precision/precision
        // Finally
        // cumulatedDevaluation = cumulatedDevaluation*(precision-rewardPercentage)/precision
        cumulatedDevaluation = cumulatedDevaluation
            .mul(_precision.sub(_rewardPercentage))
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
     *@dev withdraw staked tokens. Only dpToken owners can withdraw,
     *@param _amount 1. amount to be withdrawn
     *@param _tokenAddress 2. address of the token
     *@param _contractFinished 3. contract finished
     */
    function _withdrawProviderTokens(
        uint256 _amount,
        address _tokenAddress,
        bool _contractFinished
    ) internal onlyAllowedToken(_tokenAddress) {
        uint256 providerStake = providerPool[_tokenAddress];
        uint256 usersStake = usersPool[_tokenAddress];
        if (!_contractFinished) {
            require(
                providerStake.sub(_amount) >= usersStake,
                "Should not withdraw more than users stake"
            );
        }
        ERC20PresetMinterPauser dpToken = dpTokenRegistry[_tokenAddress];
        uint256 p0 = dpToken.totalSupply();
        uint256 t0 = providerPool[_tokenAddress];
        // Burn duTokens in a way that it doesn't affect the PoolTokens/LPTokens average
        // t0/p0 = (t0-_amount)/(p0-burnedDPTokens)
        // burnedDPTokens = _amount*p0/t0
        uint256 burnedDPTokens = _amount.mul(p0).div(t0);
        dpToken.burnFrom(msg.sender, burnedDPTokens);
        providerPool[_tokenAddress] = providerPool[_tokenAddress].sub(_amount);
        ERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
    }

    /**
     *@dev withdraw staked tokens. Only duToken owners can withdraw,
     *@param _amount 1. amount to be withdrawn
     *@param _tokenAddress 2. address of the token
     */
    function _withdrawUserTokens(uint256 _amount, address _tokenAddress)
        internal
        onlyAllowedToken(_tokenAddress)
    {
        ERC20PresetMinterPauser duToken = duTokenRegistry[_tokenAddress];
        uint256 p0 = duToken.totalSupply();
        uint256 t0 = usersPool[_tokenAddress];
        // Burn duTokens in a way that it doesn't affect the PoolTokens/LPTokens
        // average for current period.
        // t0/p0 = (t0-_amount)/(p0-burnedDUTokens)
        // burnedDUTokens = _amount*p0/t0
        uint256 burnedDUTokens = _amount.mul(p0).div(t0);
        duToken.burnFrom(msg.sender, burnedDUTokens);
        usersPool[_tokenAddress] = usersPool[_tokenAddress].sub(_amount);
        ERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
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
        ERC20PresetMinterPauser duToken = duTokenRegistry[_tokenAddress];
        uint256 duTokenBalance = duToken.balanceOf(msg.sender);
        uint256 duTokenSupply = duToken.totalSupply();
        uint256 precision = 10000;
        require(
            duTokenBalance > 0,
            "Can only claim a compensation if position is bigger than 0"
        );

        uint256 userCompensationPercentage =
            duTokenBalance.mul(precision).div(duTokenSupply);
        uint256 userCompensation =
            usersPool[_tokenAddress].mul(userCompensationPercentage).div(
                precision
            );
        duToken.burnFrom(msg.sender, duTokenBalance);
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
                duTokenRegistry[allowedTokenAddress];
            uint256 dTokenSupply = dToken.totalSupply();
            if (dTokenSupply == 0) {
                return (allowedTokenAddress, 0);
            }
            uint256 dTokenBalance = dToken.balanceOf(_staker);
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

    function _uintToStr(uint256 _i)
        internal
        pure
        returns (string memory _uintAsString)
    {
        uint256 number = _i;
        if (number == 0) {
            return "0";
        }
        uint256 j = number;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len - 1;
        while (number != 0) {
            bstr[k--] = bytes1(uint8(48 + (number % 10)));
            number /= 10;
        }
        return string(bstr);
    }
}
