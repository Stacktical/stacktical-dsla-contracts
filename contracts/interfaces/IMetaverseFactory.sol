// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

interface IMetaverseFactory {
    /// @dev this nft type presents token id
    enum SkillType {
        Champion,
        Pen,
        Sword,
        Shield,
        HoveringPool,
        LookingGlass
    }

    function mintSkillNFT(address account, SkillType tokenId) external;
}
