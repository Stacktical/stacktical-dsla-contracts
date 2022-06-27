// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';

import '../interfaces/IMetaverseFactory.sol';

contract SkillNFT is ERC1155, Ownable {
    constructor(string memory uri_) public ERC1155(uri_) {}

    function mint(address account, IMetaverseFactory.SkillType nftType)
        external
        onlyOwner
    {
        _mint(account, uint256(nftType), 1, bytes(''));
    }
}
