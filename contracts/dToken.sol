// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol';

contract dToken is ERC20PresetMinterPauser {
    constructor(string memory name, string memory symbol, uint8 decimals) public ERC20PresetMinterPauser(name, symbol) {
        _setupDecimals(decimals);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(PAUSER_ROLE, _msgSender());
    }
}