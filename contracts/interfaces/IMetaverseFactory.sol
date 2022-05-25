// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

interface IMetaverseFactory {
    /// @dev this nft type presents token id
    enum SkillType {
        Champion,
        UserScroll,
        Shield,
        Sword,
        HoveringPool,
        LookingGlass
    }

    function mintSkillNFT(address account, SkillType tokenId) external;
}
