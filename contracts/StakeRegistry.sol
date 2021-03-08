// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";
import "./SLA.sol";
import "./SLARegistry.sol";
import "./StringUtils.sol";

/**
 * @title StakeRegistry
 * @dev StakeRegistry is a contract to register the staking activity of the platform, along
 with controlling certain admin privileged parameters
 */
contract StakeRegistry is Ownable, StringUtils {
    using SafeMath for uint256;

    /// @dev struct to return on getActivePool function.
    struct ActivePool {
        address SLAAddress;
        uint256 stake;
        string assetName;
        address assetAddress;
    }

    address public DSLATokenAddress;
    SLARegistry public slaRegistry;

    //______ onlyOwner modifiable parameters ______

    /// @dev corresponds to the burn rate of DSLA tokens, but divided by 1000 i.e burn percentage = DSLAburnRate/1000 %
    uint256 private _DSLAburnRate = 3;

    /// @dev DSLA deposit by period to create SLA
    uint256 private _dslaDepositByPeriod = 20000 ether;
    /// @dev DSLA rewarded to Stacktical team
    uint256 private _dslaPlatformReward = 10000 ether;
    /// @dev DSLA rewarded to user calling the period verification
    uint256 private _dslaUserReward = 9940 ether;
    /// @dev DSLA burned after every period verification
    uint256 private _dslaBurnedByVerification = 60 ether;

    /// @dev array with the allowed tokens addresses of the StakeRegistry
    address[] public allowedTokens;

    /// @dev (userAddress => SLA[]) with user staked SLAs to get tokenPool
    mapping(address => SLA[]) public userStakedSlas;

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
        uint256 dslaUserReward,
        uint256 dslaBurnedByVerification
    );

    /**
     * @param _dslaTokenAddress 1. DSLA Token
     */
    constructor(address _dslaTokenAddress) public {
        require(
            _dslaDepositByPeriod ==
                _dslaPlatformReward.add(_dslaUserReward).add(
                    _dslaBurnedByVerification
                ),
            "Staking parameters should match on summation"
        );
        DSLATokenAddress = _dslaTokenAddress;
        allowedTokens.push(_dslaTokenAddress);
    }

    /// @dev Throws if called by any address other than the SLARegistry contract or Chainlink Oracle.
    modifier onlySLARegistry() {
        require(
            msg.sender == address(slaRegistry),
            "Can only be called by SLARegistry"
        );
        _;
    }

    /**
     * @dev sets the SLARegistry contract address and can only be called
     * once
     */
    function setSLARegistry() public {
        // Only able to trigger this function once
        require(
            address(slaRegistry) == address(0),
            "SLARegistry address has already been set"
        );

        slaRegistry = SLARegistry(msg.sender);
    }

    /**
     *@dev add a token to ve allowed for staking
     *@param _tokenAddress 1. address of the new allowed token
     */
    function addAllowedTokens(address _tokenAddress) public onlyOwner {
        require(isAllowedToken(_tokenAddress) == false, "token already added");
        allowedTokens.push(_tokenAddress);
    }

    function isAllowedToken(address _tokenAddress) public view returns (bool) {
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
    function registerStakedSla(address _owner) public returns (bool) {
        require(
            slaRegistry.isRegisteredSLA(msg.sender) == true,
            "Only for registered SLAs"
        );
        if (slaWasStakedByUser(_owner, msg.sender) == false) {
            userStakedSlas[_owner].push(SLA(msg.sender));
        }
        return true;
    }

    /**
     *@dev to create dTokens for staking
     *@param _name 1. token name
     *@param _symbol 2. token symbol
     */
    function createDToken(string memory _name, string memory _symbol)
        public
        returns (address)
    {
        require(
            slaRegistry.isRegisteredSLA(msg.sender) == true,
            "Only for registered SLAs"
        );
        ERC20PresetMinterPauser dToken =
            new ERC20PresetMinterPauser(_name, _symbol);
        dToken.grantRole(dToken.MINTER_ROLE(), msg.sender);
        return address(dToken);
    }

    /**
     * @dev returns the active pools owned by a user.
     * @param _slaOwner 1. owner of the active pool
     * @return ActivePool[], array of structs: {SLAAddress,stake,assetName}
     */
    function getActivePool(address _slaOwner)
        public
        view
        returns (ActivePool[] memory)
    {
        bytes4 NAME_SELECTOR = bytes4(keccak256(bytes("name()")));
        uint256 stakeCounter = 0;
        // Count the stakes of the user, checking every SLA staked
        for (
            uint256 index = 0;
            index < userStakedSlas[_slaOwner].length;
            index++
        ) {
            SLA currentSLA = SLA(userStakedSlas[_slaOwner][index]);
            stakeCounter = stakeCounter.add(
                currentSLA.getAllowedTokensLength()
            );
        }

        ActivePool[] memory activePools = new ActivePool[](stakeCounter);
        // to insert on activePools array
        uint256 stakePosition = 0;
        for (
            uint256 index = 0;
            index < userStakedSlas[_slaOwner].length;
            index++
        ) {
            SLA currentSLA = userStakedSlas[_slaOwner][index];
            for (
                uint256 tokenIndex = 0;
                tokenIndex < currentSLA.getAllowedTokensLength();
                tokenIndex++
            ) {
                (address tokenAddress, uint256 stake) =
                    currentSLA.getTokenStake(_slaOwner, tokenIndex);
                (, bytes memory tokenNameBytes) =
                    tokenAddress.staticcall(
                        abi.encodeWithSelector(NAME_SELECTOR)
                    );
                ActivePool memory currentActivePool =
                    ActivePool({
                        SLAAddress: address(currentSLA),
                        stake: stake,
                        assetName: string(tokenNameBytes),
                        assetAddress: tokenAddress
                    });
                activePools[stakePosition] = currentActivePool;
                stakePosition = stakePosition.add(1);
            }
        }
        return activePools;
    }

    //_______ OnlyOwner functions _______
    function setStakingParameters(
        uint256 DSLAburnRate,
        uint256 dslaDepositByPeriod,
        uint256 dslaPlatformReward,
        uint256 dslaUserReward,
        uint256 dslaBurnedByVerification
    ) public onlyOwner {
        _DSLAburnRate = DSLAburnRate;
        require(
            dslaDepositByPeriod ==
                dslaPlatformReward.add(dslaUserReward).add(
                    dslaBurnedByVerification
                ),
            "Staking parameters should match on summation"
        );
        _dslaDepositByPeriod = dslaDepositByPeriod;
        _dslaPlatformReward = dslaPlatformReward;
        _dslaUserReward = dslaUserReward;
        _dslaBurnedByVerification = dslaBurnedByVerification;
        emit StakingParametersModified(
            DSLAburnRate,
            dslaDepositByPeriod,
            dslaPlatformReward,
            dslaUserReward,
            dslaBurnedByVerification
        );
    }

    function getStakingParameters()
        public
        view
        returns (
            uint256 DSLAburnRate,
            uint256 dslaDepositByPeriod,
            uint256 dslaPlatformReward,
            uint256 dslaUserReward,
            uint256 dslaBurnedByVerification
        )
    {
        DSLAburnRate = _DSLAburnRate;
        dslaDepositByPeriod = _dslaDepositByPeriod;
        dslaPlatformReward = _dslaPlatformReward;
        dslaUserReward = _dslaUserReward;
        dslaBurnedByVerification = _dslaBurnedByVerification;
    }
}
