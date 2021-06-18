// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/ISLARegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './StringUtils.sol';

contract Staking is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    /// @dev StakeRegistry contract
    IStakeRegistry private _stakeRegistry;
    /// @dev SLARegistry contract
    IPeriodRegistry private immutable _periodRegistry;
    /// @dev DSLA token address to burn fees
    address private immutable _dslaTokenAddress;

    /// @dev current SLA id
    uint128 public immutable slaID;

    /// @dev (tokenAddress=>uint256) total pooled token balance
    mapping(address => uint256) public providerPool;
    /// @dev (tokenAddress=>uint256) total pooled token balance
    mapping(address => uint256) public usersPool;

    ///@dev (tokenAddress=>dTokenAddress) to keep track of dToken for users
    mapping(address => ERC20PresetMinterPauser) public duTokenRegistry;
    ///@dev (tokenAddress=>dTokenAddress) to keep track of dToken for provider
    mapping(address => ERC20PresetMinterPauser) public dpTokenRegistry;

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

    modifier onlyAllowedToken(address _token) {
        require(isAllowedToken(_token) == true, 'token not allowed');
        _;
    }

    modifier onlyWhitelisted {
        if (whitelistedContract == true) {
            require(whitelist[msg.sender] == true, 'not whitelisted');
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
        address contractOwner_
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
    }

    function addUsersToWhitelist(address[] memory _userAddresses)
        public
        onlyOwner
    {
        for (uint256 index = 0; index < _userAddresses.length; index++) {
            if (whitelist[_userAddresses[index]] == false) {
                whitelist[_userAddresses[index]] = true;
            }
        }
    }

    function removeUsersFromWhitelist(address[] calldata _userAddresses)
        external
        onlyOwner
    {
        for (uint256 index = 0; index < _userAddresses.length; index++) {
            if (whitelist[_userAddresses[index]] == true) {
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
        string memory duTokenName = string(
            abi.encodePacked('DSLA-SHORT-', dTokenID)
        );
        string memory duTokenSymbol = string(
            abi.encodePacked('DSLA-SP-', dTokenID)
        );
        string memory dpTokenName = string(
            abi.encodePacked('DSLA-LONG-', dTokenID)
        );
        string memory dpTokenSymbol = string(
            abi.encodePacked('DSLA-LP-', dTokenID)
        );

        ERC20PresetMinterPauser duToken = ERC20PresetMinterPauser(
            _stakeRegistry.createDToken(duTokenName, duTokenSymbol)
        );
        ERC20PresetMinterPauser dpToken = ERC20PresetMinterPauser(
            _stakeRegistry.createDToken(dpTokenName, dpTokenSymbol)
        );

        dpTokenRegistry[_tokenAddress] = dpToken;
        duTokenRegistry[_tokenAddress] = duToken;
        emit DTokensCreated(
            _tokenAddress,
            address(dpToken),
            dpTokenName,
            dpTokenName,
            address(duToken),
            duTokenName,
            duTokenName
        );
    }

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
        //duTokens
        if (msg.sender != owner()) {
            (uint256 providerStake, uint256 usersStake) = (
                providerPool[_tokenAddress],
                usersPool[_tokenAddress]
            );
            require(
                usersStake.add(_amount).mul(leverage) <= providerStake,
                'user stake'
            );
            ERC20PresetMinterPauser duToken = duTokenRegistry[_tokenAddress];
            uint256 p0 = duToken.totalSupply();

            // if there's no minted tokens, then create 1-1 proportion
            if (p0 == 0) {
                duToken.mint(msg.sender, _amount);
            } else {
                uint256 t0 = usersPool[_tokenAddress];
                // mint dTokens proportionally
                uint256 mintedDUTokens = _amount.mul(p0).div(t0);
                duToken.mint(msg.sender, mintedDUTokens);
            }
            usersPool[_tokenAddress] = usersPool[_tokenAddress].add(_amount);
            //dpTokens
        } else {
            ERC20PresetMinterPauser dpToken = dpTokenRegistry[_tokenAddress];
            uint256 p0 = dpToken.totalSupply();

            if (p0 == 0) {
                dpToken.mint(msg.sender, _amount);
            } else {
                uint256 t0 = providerPool[_tokenAddress];
                // mint dTokens proportionally
                uint256 mintedDPTokens = _amount.mul(p0).div(t0);
                dpToken.mint(msg.sender, mintedDPTokens);
            }

            providerPool[_tokenAddress] = providerPool[_tokenAddress].add(
                _amount
            );
        }

        if (registeredStakers[msg.sender] == false) {
            registeredStakers[msg.sender] = true;
            stakers.push(msg.sender);
        }
    }

    function _setRespectedPeriodReward(
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

    function _setUsersCompensation(uint256 _periodId) internal {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            address tokenAddress = allowedTokens[index];
            uint256 usersStake = usersPool[tokenAddress];
            uint256 compensation = usersStake.mul(leverage);
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
        bool _contractFinished
    ) internal onlyAllowedToken(_tokenAddress) {
        uint256 providerStake = providerPool[_tokenAddress];
        uint256 usersStake = usersPool[_tokenAddress];
        if (!_contractFinished) {
            require(
                providerStake.sub(_amount) >= usersStake.mul(leverage),
                'bad amount'
            );
        }
        ERC20PresetMinterPauser dpToken = dpTokenRegistry[_tokenAddress];
        uint256 p0 = dpToken.totalSupply();
        uint256 t0 = providerPool[_tokenAddress];
        // Burn duTokens in a way that it doesn't affect the PoolTokens/LPTokens average
        // t0/p0 = (t0-_amount)/(p0-burnedDPTokens)
        uint256 burnedDPTokens = _amount.mul(p0).div(t0);
        dpToken.burnFrom(msg.sender, burnedDPTokens);
        providerPool[_tokenAddress] = providerPool[_tokenAddress].sub(_amount);
        ERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
    }

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
        uint256 burnedDUTokens = _amount.mul(p0).div(t0);
        duToken.burnFrom(msg.sender, burnedDUTokens);
        usersPool[_tokenAddress] = usersPool[_tokenAddress].sub(_amount);
        ERC20(_tokenAddress).safeTransfer(msg.sender, _amount);
    }

    function getAllowedTokensLength() external view returns (uint256) {
        return allowedTokens.length;
    }

    function getTokenStake(address _staker, uint256 _allowedTokenIndex)
        external
        view
        returns (address tokenAddress, uint256 stake)
    {
        address allowedTokenAddress = allowedTokens[_allowedTokenIndex];
        if (_staker == owner()) {
            return (allowedTokenAddress, providerPool[allowedTokenAddress]);
        } else {
            ERC20PresetMinterPauser dToken = duTokenRegistry[
                allowedTokenAddress
            ];
            uint256 dTokenSupply = dToken.totalSupply();
            if (dTokenSupply == 0) {
                return (allowedTokenAddress, 0);
            }
            uint256 dTokenBalance = dToken.balanceOf(_staker);
            return (
                allowedTokenAddress,
                usersPool[allowedTokenAddress].mul(dTokenBalance).div(
                    dTokenSupply
                )
            );
        }
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
