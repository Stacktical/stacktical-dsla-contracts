// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './SLA.sol';
import './dToken.sol';
import './interfaces/IMessenger.sol';
import './interfaces/ISLARegistry.sol';
import './interfaces/IStakeRegistry.sol';
import './StringUtils.sol';

/**
 * @title StakeRegistry
 * @dev StakeRegistry is a contract to register the staking activity of the platform, along
 with controlling certain admin privileged parameters
 */
contract StakeRegistry is IStakeRegistry, Ownable, ReentrancyGuard {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;

    struct LockedValue {
        uint256 lockedValue;
        uint256 slaPeriodIdsLength;
        uint256 dslaDepositByPeriod;
        uint256 dslaPlatformReward;
        uint256 dslaMessengerReward;
        uint256 dslaUserReward;
        uint256 dslaBurnedByVerification;
        mapping(uint256 => bool) verifiedPeriods;
    }

    address private _DSLATokenAddress;
    ISLARegistry public slaRegistry;

    //______ onlyOwner modifiable parameters ______

    /// @dev corresponds to the burn rate of DSLA tokens, but divided by 1000 i.e burn percentage = DSLAburnRate/1000 %
    uint256 private _DSLAburnRate = 3;
    /// @dev (ownerAddress => slaAddress => LockedValue) stores the locked value by the staker
    mapping(address => LockedValue) public slaLockedValue;
    /// @dev DSLA deposit by period to create SLA
    uint256 private _dslaDepositByPeriod = 1000 ether;
    /// @dev DSLA rewarded to the foundation
    uint256 private _dslaPlatformReward = 250 ether;
    /// @dev DSLA rewarded to the Messenger creator
    uint256 private _dslaMessengerReward = 250 ether;
    /// @dev DSLA rewarded to user calling the period verification
    uint256 private _dslaUserReward = 250 ether;
    /// @dev DSLA burned after every period verification
    uint256 private _dslaBurnedByVerification = 250 ether;
    /// @dev max token length for allowedTokens array of Staking contracts
    uint256 private _maxTokenLength = 1;
    /// @dev max times of hedge leverage
    uint64 private _maxLeverage = 100;
    /// @dev burn DSLA after verification
    bool private _burnDSLA = true;

    /// @dev array with the allowed tokens addresses of the StakeRegistry
    address[] public allowedTokens;

    /// @dev (userAddress => SLA[]) with user staked SLAs to get tokenPool
    mapping(address => SLA[]) public userStakedSlas;

    /**
     * @dev event to log a verifiation reward distributed
     * @param sla 1. The address of the created service level agreement contract
     * @param requester 2. -
     * @param userReward 3. -
     * @param platformReward 4. -
     * @param messengerReward 5. -
     * @param burnedDSLA 6. -
     */
    event VerificationRewardDistributed(
        address indexed sla,
        address indexed requester,
        uint256 userReward,
        uint256 platformReward,
        uint256 messengerReward,
        uint256 burnedDSLA
    );

    /**
     * @dev event to log modifications on the staking parameters
     *@param DSLAburnRate 1. (DSLAburnRate/1000)% of DSLA to be burned after a reward/compensation is paid
     *@param dslaDepositByPeriod 2. DSLA deposit by period to create SLA
     *@param dslaPlatformReward 3. DSLA rewarded to Stacktical team
     *@param dslaUserReward 4. DSLA rewarded to user calling the period verification
     *@param dslaBurnedByVerification 5. DSLA burned after every period verification
     */
    event StakingParametersModified(
        uint256 DSLAburnRate,
        uint256 dslaDepositByPeriod,
        uint256 dslaPlatformReward,
        uint256 dslaMessengerReward,
        uint256 dslaUserReward,
        uint256 dslaBurnedByVerification,
        uint256 maxTokenLength,
        uint64 maxLeverage,
        bool burnDSLA
    );

    /**
     * @dev event to log modifications on the staking parameters
     *@param sla 1. -
     *@param owner 2. -
     *@param amount 3. -
     */

    event LockedValueReturned(
        address indexed sla,
        address indexed owner,
        uint256 amount
    );

    /**
     * @dev event to log modifications on the staking parameters
     *@param dTokenAddress 1. -
     *@param sla 2. -
     *@param name 3. -
     *@param symbol 4. -
     */
    event DTokenCreated(
        address indexed dTokenAddress,
        address indexed sla,
        string name,
        string symbol
    );

    /**
     * @dev event to log modifications on the staking parameters
     *@param sla 1. -
     *@param owner 2. -
     *@param amount 3. -
     */
    event ValueLocked(
        address indexed sla,
        address indexed owner,
        uint256 amount
    );

    /**
     * @param _dslaTokenAddress 1. DSLA Token
     */
    constructor(address _dslaTokenAddress) public {
        require(
            _dslaDepositByPeriod ==
                _dslaPlatformReward
                .add(_dslaMessengerReward)
                .add(_dslaUserReward)
                .add(_dslaBurnedByVerification),
            'Staking parameters should match on summation'
        );
        _DSLATokenAddress = _dslaTokenAddress;
        allowedTokens.push(_dslaTokenAddress);
    }

    function owner() public view override(IStakeRegistry, Ownable) returns (address) {
        return super.owner();
    }

    /// @dev Throws if called by any address other than the SLARegistry contract or Chainlink Oracle.
    modifier onlySLARegistry() {
        require(
            msg.sender == address(slaRegistry),
            'Can only be called by SLARegistry'
        );
        _;
    }

    /**
     * @dev sets the SLARegistry contract address and can only be called
     * once
     */
    function setSLARegistry() external override {
        // Only able to trigger this function once
        require(
            address(slaRegistry) == address(0),
            'SLARegistry address has already been set'
        );

        slaRegistry = ISLARegistry(msg.sender);
    }

    /**
     *@dev add a token to ve allowed for staking
     *@param _tokenAddress 1. address of the new allowed token
     */
    function addAllowedTokens(address _tokenAddress) external onlyOwner {
        require(!isAllowedToken(_tokenAddress), 'token already added');
        allowedTokens.push(_tokenAddress);
    }

    function isAllowedToken(address _tokenAddress)
        public
        view
        override
        returns (bool)
    {
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            if (allowedTokens[index] == _tokenAddress) {
                return true;
            }
        }
        return false;
    }

    /**
     *@dev public view function that returns true if the _owner has staked on _sla
     *@param _user 1. address to check
     *@param _sla 2. sla to check
     *@return bool, true if _sla was staked by _user
     */

    function slaWasStakedByUser(address _user, address _sla)
        public
        view
        returns (bool)
    {
        for (uint256 index = 0; index < userStakedSlas[_user].length; index++) {
            if (address(userStakedSlas[_user][index]) == _sla) {
                return true;
            }
        }
        return false;
    }

    /**
     *@dev register the sending SLA contract as staked by _owner
     *@param _owner 1. SLA contract to stake
     */
    function registerStakedSla(address _owner)
        external
        override
        returns (bool)
    {
        require(
            slaRegistry.isRegisteredSLA(msg.sender),
            'Only for registered SLAs'
        );
        if (!slaWasStakedByUser(_owner, msg.sender)) {
            userStakedSlas[_owner].push(SLA(msg.sender));
        }
        return true;
    }

    /**
     *@dev to create dTokens for staking
     *@param _name 1. token name
     *@param _symbol 2. token symbol
     */
    function createDToken(string calldata _name, string calldata _symbol, uint8 decimals)
        external
        override
        returns (address)
    {
        require(
            slaRegistry.isRegisteredSLA(msg.sender),
            'Only for registered SLAs'
        );
        dToken newDToken = new dToken(_name, _symbol, decimals);
        newDToken.grantRole(newDToken.MINTER_ROLE(), msg.sender);
        emit DTokenCreated(address(newDToken), msg.sender, _name, _symbol);
        return address(newDToken);
    }

    function lockDSLAValue(
        address _slaOwner,
        address _sla,
        uint256 _periodIdsLength
    ) external override onlySLARegistry nonReentrant {
        uint256 lockedValue = _dslaDepositByPeriod.mul(_periodIdsLength);
        ERC20(_DSLATokenAddress).safeTransferFrom(
            _slaOwner,
            address(this),
            lockedValue
        );
        slaLockedValue[_sla] = LockedValue({
            lockedValue: lockedValue,
            slaPeriodIdsLength: _periodIdsLength,
            dslaDepositByPeriod: _dslaDepositByPeriod,
            dslaPlatformReward: _dslaPlatformReward,
            dslaMessengerReward: _dslaMessengerReward,
            dslaUserReward: _dslaUserReward,
            dslaBurnedByVerification: _dslaBurnedByVerification
        });
        emit ValueLocked(_sla, _slaOwner, lockedValue);
    }

    function distributeVerificationRewards(
        address _sla,
        address _verificationRewardReceiver,
        uint256 _periodId
    ) external override onlySLARegistry nonReentrant {
        LockedValue storage _lockedValue = slaLockedValue[_sla];
        require(
            !_lockedValue.verifiedPeriods[_periodId],
            'Period rewards already distributed'
        );
        _lockedValue.verifiedPeriods[_periodId] = true;
        _lockedValue.lockedValue = _lockedValue.lockedValue.sub(
            _lockedValue.dslaDepositByPeriod
        );
        ERC20(_DSLATokenAddress).safeTransfer(
            _verificationRewardReceiver,
            _lockedValue.dslaUserReward
        );
        ERC20(_DSLATokenAddress).safeTransfer(
            owner(),
            _lockedValue.dslaPlatformReward
        );
        ERC20(_DSLATokenAddress).safeTransfer(
            IMessenger(SLA(_sla).messengerAddress()).owner(),
            _lockedValue.dslaMessengerReward
        );
        if (_burnDSLA) {
            (bool success, ) = _DSLATokenAddress.call(
                abi.encodeWithSelector(
                    bytes4(keccak256(bytes('burn(uint256)'))),
                    _lockedValue.dslaBurnedByVerification
                )
            );
            require(success, 'burn process failed');
        }
        emit VerificationRewardDistributed(
            _sla,
            _verificationRewardReceiver,
            _lockedValue.dslaUserReward,
            _lockedValue.dslaPlatformReward,
            _lockedValue.dslaMessengerReward,
            _lockedValue.dslaBurnedByVerification
        );
    }

    function returnLockedValue(address _sla)
        external
        override
        onlySLARegistry
        nonReentrant
    {
        LockedValue storage _lockedValue = slaLockedValue[_sla];
        uint256 remainingBalance = _lockedValue.lockedValue;
        require(remainingBalance > 0, 'locked value is empty');
        _lockedValue.lockedValue = 0;
        ERC20(_DSLATokenAddress).safeTransfer(
            SLA(_sla).owner(),
            remainingBalance
        );
        emit LockedValueReturned(_sla, SLA(_sla).owner(), remainingBalance);
    }

    //_______ OnlyOwner functions _______
    function setStakingParameters(
        uint256 DSLAburnRate,
        uint256 dslaDepositByPeriod,
        uint256 dslaPlatformReward,
        uint256 dslaMessengerReward,
        uint256 dslaUserReward,
        uint256 dslaBurnedByVerification,
        uint256 maxTokenLength,
        uint64 maxLeverage,
        bool burnDSLA
    ) external onlyOwner {
        _DSLAburnRate = DSLAburnRate;
        _dslaDepositByPeriod = dslaDepositByPeriod;
        _dslaPlatformReward = dslaPlatformReward;
        _dslaMessengerReward = dslaMessengerReward;
        _dslaUserReward = dslaUserReward;
        _dslaBurnedByVerification = dslaBurnedByVerification;
        _maxTokenLength = maxTokenLength;
        _maxLeverage = maxLeverage;
        _burnDSLA = burnDSLA;
        require(
            _dslaDepositByPeriod ==
                _dslaPlatformReward
                .add(_dslaMessengerReward)
                .add(_dslaUserReward)
                .add(_dslaBurnedByVerification),
            'Staking parameters should match on summation'
        );
        emit StakingParametersModified(
            DSLAburnRate,
            dslaDepositByPeriod,
            dslaPlatformReward,
            dslaMessengerReward,
            dslaUserReward,
            dslaBurnedByVerification,
            maxTokenLength,
            maxLeverage,
            burnDSLA
        );
    }

    function getStakingParameters()
        external
        view
        override
        returns (
            uint256 DSLAburnRate,
            uint256 dslaDepositByPeriod,
            uint256 dslaPlatformReward,
            uint256 dslaMessengerReward,
            uint256 dslaUserReward,
            uint256 dslaBurnedByVerification,
            uint256 maxTokenLength,
            uint64 maxLeverage,
            bool burnDSLA
        )
    {
        DSLAburnRate = _DSLAburnRate;
        dslaDepositByPeriod = _dslaDepositByPeriod;
        dslaPlatformReward = _dslaPlatformReward;
        dslaMessengerReward = _dslaMessengerReward;
        dslaUserReward = _dslaUserReward;
        dslaBurnedByVerification = _dslaBurnedByVerification;
        maxTokenLength = _maxTokenLength;
        maxLeverage = _maxLeverage;
        burnDSLA = _burnDSLA;
    }

    function periodIsVerified(address _sla, uint256 _periodId)
        external
        view
        returns (bool)
    {
        return slaLockedValue[_sla].verifiedPeriods[_periodId];
    }

    function DSLATokenAddress() external view override returns (address) {
        return _DSLATokenAddress;
    }
}
