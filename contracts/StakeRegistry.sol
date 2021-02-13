// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";


/**
 * @title StakeRegistry
 * @dev StakeRegistry is a contract to register the staking activity of the platform, along
 with controlling certain admin privileged parameters
 */
contract StakeRegistry is Ownable {
    using SafeMath for uint256;

    /// @dev struct to return on getActivePool function.
    struct ActivePool {
        address SLAAddress;
        uint256 stake;
        string assetName;
        address assetAddress;
    }

    address public DSLATokenAddress;

    //______ onlyOwner modifiable parameters ______

    /// @dev corresponds to the burn rate of DSLA tokens, but divided by 1000 i.e burn percentage = DSLAburnRate/1000 %
    uint256 private _DSLAburnRate = 3;
    /// @dev minimum deposit for Tier 1 staking
    uint256 private _minimumDSLAStakedTier1 = 3000 ether;
    /// @dev minimum deposit for Tier 2 staking
    uint256 private _minimumDSLAStakedTier2 = 6000 ether;
    /// @dev minimum deposit for Tier 3 staking
    uint256 private _minimumDSLAStakedTier3 = 9000 ether;
    /// @dev array with the allowed tokens addresses of the StakeRegistry
    address[] public allowedTokens;

    /**
     * @dev event to log modifications on the staking parameters
     *@param DSLAburnRate 1. (DSLAburnRate/1000)% of DSLA to be burned after a reward/compensation is paid
     *@param minimumDSLAStakedTier1 2. minimum stake of DSLA to enable tier 1 privileges
     *@param minimumDSLAStakedTier2 3. minimum stake of DSLA to enable tier 2 privileges
     *@param minimumDSLAStakedTier3 4. minimum stake of DSLA to enable tier 3 privileges
     */
    event StakingParametersModified(
        uint256 DSLAburnRate,
        uint256 minimumDSLAStakedTier1,
        uint256 minimumDSLAStakedTier2,
        uint256 minimumDSLAStakedTier3
    );

    /**
     * @param _dslaTokenAddress 1. DSLA Token
     */
    constructor(address _dslaTokenAddress) public {
        DSLATokenAddress = _dslaTokenAddress;
        allowedTokens.push(_dslaTokenAddress);
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

    function getStakingParameters()
        public
        view
        returns (
            uint256 DSLAburnRate,
            uint256 minimumDSLAStakedTier1,
            uint256 minimumDSLAStakedTier2,
            uint256 minimumDSLAStakedTier3
        )
    {
        DSLAburnRate = _DSLAburnRate;
        minimumDSLAStakedTier1 = _minimumDSLAStakedTier1;
        minimumDSLAStakedTier2 = _minimumDSLAStakedTier2;
        minimumDSLAStakedTier3 = _minimumDSLAStakedTier3;
    }

//    /**
//     * @dev returns the active pools owned by a user.
//     * @param _slaOwner 1. owner of the active pool
//     * @return ActivePool[], array of structs: {SLAAddress,stake,assetName}
//     */
//    function getActivePool(address _slaOwner)
//        public
//        view
//        returns (ActivePool[] memory)
//    {
//        bytes4 NAME_SELECTOR = bytes4(keccak256(bytes("name()")));
//        uint256 stakeCounter = 0;
//        // Count the stakes of the user, checking every SLA staked
//        for (
//            uint256 index = 0;
//            index < userStakedSlas[_slaOwner].length;
//            index++
//        ) {
//            SLA currentSLA = SLA(userStakedSlas[_slaOwner][index]);
//            stakeCounter = stakeCounter.add(
//                currentSLA.getAllowedTokensLength()
//            );
//        }
//
//        ActivePool[] memory activePools = new ActivePool[](stakeCounter);
//        // to insert on activePools array
//        uint256 stakePosition = 0;
//        for (
//            uint256 index = 0;
//            index < userStakedSlas[_slaOwner].length;
//            index++
//        ) {
//            SLA currentSLA = userStakedSlas[_slaOwner][index];
//            for (
//                uint256 tokenIndex = 0;
//                tokenIndex < currentSLA.getAllowedTokensLength();
//                tokenIndex++
//            ) {
//                (address tokenAddress, uint256 stake) =
//                    currentSLA.getTokenStake(_slaOwner, tokenIndex);
//                (, bytes memory tokenNameBytes) =
//                    tokenAddress.staticcall(
//                        abi.encodeWithSelector(NAME_SELECTOR)
//                    );
//                ActivePool memory currentActivePool =
//                    ActivePool({
//                        SLAAddress: address(currentSLA),
//                        stake: stake,
//                        assetName: string(tokenNameBytes),
//                        assetAddress: tokenAddress
//                    });
//                activePools[stakePosition] = currentActivePool;
//                stakePosition = stakePosition.add(1);
//            }
//        }
//        return activePools;
//    }

    //_______ OnlyOwner functions _______
    function setStakingParameters(
        uint256 DSLAburnRate,
        uint256 minimumDSLAStakedTier1,
        uint256 minimumDSLAStakedTier2,
        uint256 minimumDSLAStakedTier3
    ) public onlyOwner {
        _DSLAburnRate = DSLAburnRate;
        _minimumDSLAStakedTier1 = minimumDSLAStakedTier1;
        _minimumDSLAStakedTier2 = minimumDSLAStakedTier2;
        _minimumDSLAStakedTier3 = minimumDSLAStakedTier3;
        emit StakingParametersModified(
            DSLAburnRate,
            minimumDSLAStakedTier1,
            minimumDSLAStakedTier2,
            minimumDSLAStakedTier3
        );
    }
}
