// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/ISLARegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './interfaces/IMessenger.sol';
import './interfaces/IERC20Query.sol';
import './dToken.sol';
import './StringUtils.sol';

contract Staking is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    enum Position {
        LONG,
        SHORT
    }

    /// @dev StakeRegistry contract
    IStakeRegistry private _stakeRegistry;

    /// @dev SLARegistry contract
    IPeriodRegistry internal immutable _periodRegistry;

    /// @dev DSLA token address to burn fees
    address private immutable _dslaTokenAddress;
    /// @dev messenger address
    address public immutable messengerAddress;
    /// @dev current SLA id
    uint128 public immutable slaID;

    /// @dev (tokenAddress=>uint256) total pooled token balance
    mapping(address => uint256) public providerPool;

    /// @dev (userAddress=>uint256) provider staking activity
    mapping(address => uint256) public lastProviderStake;

    /// @dev (tokenAddress=>uint256) user staking
    mapping(address => uint256) public usersPool;

    /// @dev (userAddress=>uint256) user staking activity
    mapping(address => uint256) public lastUserStake;

    ///@dev (tokenAddress=>dTokenAddress) to keep track of dToken for users
    mapping(address => dToken) public duTokenRegistry;

    ///@dev (tokenAddress=>dTokenAddress) to keep track of dToken for provider
    mapping(address => dToken) public dpTokenRegistry;

    /// @dev address[] of the stakers of the SLA contract
    address[] public stakers;

    /// @dev (slaOwner=>bool)
    mapping(address => bool) public registeredStakers;

    /// @dev array with the allowed tokens addresses for the current SLA
    address[] public allowedTokens;

    /// @dev corresponds to the burn rate of DSLA tokens, but divided by 1000 i.e burn percentage = burnRate/1000 %
    uint256 public immutable DSLAburnRate;

    /// @dev boolean to declare if contract is whitelisted
    bool public immutable whitelistedContract;

    /// @dev (userAddress=bool) to declare whitelisted addresses
    mapping(address => bool) public whitelist;

    uint64 public immutable leverage;

    /// @dev claiming fees when a user claim tokens, should by divided by 10000
    uint256 private ownerRewardsRate = 30; // 0.3%
    uint256 private protocolRewardsRate = 15; // 0.15%

    modifier onlyAllowedToken(address _token) {
        require(isAllowedToken(_token), 'token not allowed');
        _;
    }

    modifier onlyWhitelisted() {
        if (whitelistedContract) {
            require(whitelist[msg.sender], 'not whitelisted');
        }
        _;
    }

    event ProviderRewardGenerated(
        uint256 indexed periodId,
        address indexed tokenAddress,
        uint256 rewardPercentage,
        uint256 rewardPercentagePrecision,
        uint256 rewardAmount
    );

    event UserCompensationGenerated(
        uint256 indexed periodId,
        address indexed tokenAddress,
        uint256 usersStake,
        uint256 leverage,
        uint256 compensation
    );

    event DTokensCreated(
        address indexed tokenAddress,
        address indexed dpTokenAddress,
        string dpTokenName,
        string dpTokenSymbol,
        address indexed duTokenAddress,
        string duTokenName,
        string duTokenSymbol
    );

    constructor(
        ISLARegistry slaRegistry_,
        bool whitelistedContract_,
        uint128 slaID_,
        uint64 leverage_,
        address contractOwner_,
        address messengerAddress_
    ) public {
        _stakeRegistry = IStakeRegistry(slaRegistry_.stakeRegistry());
        _periodRegistry = IPeriodRegistry(slaRegistry_.periodRegistry());
        whitelistedContract = whitelistedContract_;
        (
            uint256 _DSLAburnRate,
            ,
            ,
            ,
            ,
            ,
            ,
            uint64 _maxLeverage,
        ) = _stakeRegistry.getStakingParameters();
        _dslaTokenAddress = _stakeRegistry.DSLATokenAddress();
        DSLAburnRate = _DSLAburnRate;
        whitelist[contractOwner_] = true;
        slaID = slaID_;
        require(
            leverage_ <= _maxLeverage && leverage_ >= 1,
            'incorrect leverage'
        );
        leverage = leverage_;
        messengerAddress = messengerAddress_;
    }

    function addUsersToWhitelist(address[] memory _userAddresses)
        public
        onlyOwner
    {
        for (uint256 index = 0; index < _userAddresses.length; index++) {
            if (!whitelist[_userAddresses[index]]) {
                whitelist[_userAddresses[index]] = true;
            }
        }
    }

    function removeUsersFromWhitelist(address[] calldata _userAddresses)
        external
        onlyOwner
    {
        for (uint256 index = 0; index < _userAddresses.length; index++) {
            if (whitelist[_userAddresses[index]]) {
                whitelist[_userAddresses[index]] = false;
            }
        }
    }

    function addAllowedTokens(address _tokenAddress) external onlyOwner {
        (, , , , , , uint256 maxTokenLength, , ) = _stakeRegistry
            .getStakingParameters();
        require(!isAllowedToken(_tokenAddress), 'already added');
        require(_stakeRegistry.isAllowedToken(_tokenAddress), 'not allowed');
        allowedTokens.push(_tokenAddress);
        require(maxTokenLength >= allowedTokens.length, 'max token length');
        string memory dTokenID = StringUtils.uintToStr(slaID);
        string memory duTokenName = IMessenger(messengerAddress).spName();
        string memory duTokenSymbol = string(
            abi.encodePacked('DSLA-SP-', dTokenID)
        );
        string memory dpTokenName = IMessenger(messengerAddress).lpName();
        string memory dpTokenSymbol = string(
            abi.encodePacked('DSLA-LP-', dTokenID)
        );
        uint8 decimals = IERC20Query(_tokenAddress).decimals();

        dToken duToken = dToken(
            _stakeRegistry.createDToken(duTokenName, duTokenSymbol, decimals)
        );
        dToken dpToken = dToken(
            _stakeRegistry.createDToken(dpTokenName, dpTokenSymbol, decimals)
        );

        dpTokenRegistry[_tokenAddress] = dpToken;
        duTokenRegistry[_tokenAddress] = duToken;
        emit DTokensCreated(
            _tokenAddress,
            address(dpToken),
            dpTokenName,
            dpTokenSymbol,
            address(duToken),
            duTokenName,
            duTokenSymbol
        );
    }

    function _stake(
        address _tokenAddress,
        uint256 _nextVerifiablePeriod,
        uint256 _amount,
        Position _position
    )
        internal
        onlyAllowedToken(_tokenAddress)
        onlyWhitelisted
        nonReentrant
    {
        IERC20(_tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );

        // DSLA-SP proofs of SLA Position
        // string memory short = 'short';
        if (_position == Position.SHORT) {
            require(
                usersPool[_tokenAddress].add(_amount).mul(leverage) <= providerPool[_tokenAddress],
                'Stake exceeds leveraged cap.'
            );

            dToken duToken = duTokenRegistry[_tokenAddress];
            uint256 p0 = duToken.totalSupply();

            // If there are no minted tokens, then mint them 1:1
            if (p0 == 0) {
                duToken.mint(msg.sender, _amount);
            } else {
                // mint dTokens proportionally
                duToken.mint(
                    msg.sender,
                    _amount.mul(p0).div(usersPool[_tokenAddress])
                );
            }
            usersPool[_tokenAddress] = usersPool[_tokenAddress].add(_amount);

            lastUserStake[msg.sender] = _nextVerifiablePeriod;
        }

        // DSLA-LP proofs of SLA Position
        // string memory long = 'long';
        if (_position == Position.LONG) {
            dToken dpToken = dpTokenRegistry[_tokenAddress];
            uint256 p0 = dpToken.totalSupply();

            if (p0 == 0) {
                dpToken.mint(msg.sender, _amount);
            } else {
                // mint dTokens proportionally
                dpToken.mint(
                    msg.sender,
                    _amount.mul(p0).div(providerPool[_tokenAddress])
                );
            }
            providerPool[_tokenAddress] = providerPool[_tokenAddress].add(
                _amount
            );

            lastProviderStake[msg.sender] = _nextVerifiablePeriod;
        }

        if (!registeredStakers[msg.sender]) {
            registeredStakers[msg.sender] = true;
            stakers.push(msg.sender);
        }
    }

    function _setProviderReward(
        uint256 _periodId,
        uint256 _rewardPercentage,
        uint256 _precision
    ) internal {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            address tokenAddress = allowedTokens[index];
            uint256 usersStake = usersPool[tokenAddress];
            uint256 reward = usersStake.mul(_rewardPercentage).div(_precision);

            usersPool[tokenAddress] = usersPool[tokenAddress].sub(reward);

            providerPool[tokenAddress] = providerPool[tokenAddress].add(reward);

            emit ProviderRewardGenerated(
                _periodId,
                tokenAddress,
                _rewardPercentage,
                _precision,
                reward
            );
        }
    }

    function _setUserReward(
        uint256 _periodId,
        uint256 _rewardPercentage,
        uint256 _precision
    ) internal {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            address tokenAddress = allowedTokens[index];
            uint256 usersStake = usersPool[tokenAddress];

            uint256 compensation = usersStake
                .mul(leverage)
                .mul(_rewardPercentage)
                .div(_precision);

            providerPool[tokenAddress] = providerPool[tokenAddress].sub(
                compensation
            );

            usersPool[tokenAddress] = usersPool[tokenAddress].add(compensation);

            emit UserCompensationGenerated(
                _periodId,
                tokenAddress,
                usersStake,
                leverage,
                compensation
            );
        }
    }

    function _withdrawProviderTokens(
        uint256 _amount,
        address _tokenAddress,
        uint256 _nextVerifiablePeriod
    ) internal onlyAllowedToken(_tokenAddress) nonReentrant {
        require(
            lastProviderStake[msg.sender] < _nextVerifiablePeriod,
            'Provider lock-up until the next verification.'
        );

        require(
            providerPool[_tokenAddress].sub(_amount) >=
                usersPool[_tokenAddress].mul(leverage),
            'Withdrawal exceeds leveraged cap.'
        );

        dToken dpToken = dpTokenRegistry[_tokenAddress];
        // Burn duTokens in a way that doesn't affect the Provider Pool / DSLA-SP Pool average
        // t0/p0 = (t0-_amount)/(p0-burnedDPTokens)
        dpToken.burnFrom(
            msg.sender,
            _amount.mul(dpToken.totalSupply()).div(providerPool[_tokenAddress])
        );
        providerPool[_tokenAddress] = providerPool[_tokenAddress].sub(_amount);
        uint256 outstandingAmount = _distributeClaimingRewards(
            _amount,
            _tokenAddress
        );
        IERC20(_tokenAddress).safeTransfer(msg.sender, outstandingAmount);
    }

    function _withdrawUserTokens(
        uint256 _amount,
        address _tokenAddress,
        uint256 _nextVerifiablePeriod
    ) internal onlyAllowedToken(_tokenAddress) nonReentrant {
        require(
            lastUserStake[msg.sender] < _nextVerifiablePeriod,
            'User lock-up until the next verification.'
        );

        dToken duToken = duTokenRegistry[_tokenAddress];
        // Burn duTokens in a way that doesn't affect the User Pool / DSLA-SP Pool average
        // t0/p0 = (t0-_amount)/(p0-burnedDUTokens)
        duToken.burnFrom(
            msg.sender,
            _amount.mul(duToken.totalSupply()).div(usersPool[_tokenAddress])
        );
        usersPool[_tokenAddress] = usersPool[_tokenAddress].sub(_amount);
        uint256 outstandingAmount = _distributeClaimingRewards(
            _amount,
            _tokenAddress
        );
        IERC20(_tokenAddress).safeTransfer(msg.sender, outstandingAmount);
    }

    function _distributeClaimingRewards(uint256 _amount, address _tokenAddress)
        internal
        returns (uint256)
    {
        uint256 slaOwnerRewards = _amount.mul(ownerRewardsRate).div(10000);
        uint256 protocolRewards = _amount.mul(protocolRewardsRate).div(10000);
        IERC20(_tokenAddress).safeTransfer(owner(), slaOwnerRewards);
        IERC20(_tokenAddress).safeTransfer(
            _stakeRegistry.owner(),
            protocolRewards
        );
        return _amount.sub(slaOwnerRewards).sub(protocolRewards);
    }

    function getAllowedTokensLength() external view returns (uint256) {
        return allowedTokens.length;
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
