// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

interface IMetaverseActivityRegistry {
    /**
     * @dev this nft type presents token id
     * @param Pen       User Premium Deposited NFT (Maybe minted if User has deposited a premium to a SLA)
     * @param Shield    User Claimed NFT (maybe minted once a User has made a Compensation Claim)
     * @param Knife         Owner SLA Created NFT (maybe minted once an SLA Owner creates a new SLA contract)
     * @param LookingGlass  Owner SLA Used/Verified NFT
     * @param LiquidityPool Liquidity Provider Provided Liquidity NFT
     * @param Bunker        Liquidity Provider Liquidity Used NFT
     */
    enum SkillType {
        // User
        Pen,
        Shield,
        // Owner
        Knife,
        LookingGlass,
        // Liquidity Pool
        LiquidityPool,
        Bunker
    }

    function registerActivity(address user, SkillType activityType) external;
}
