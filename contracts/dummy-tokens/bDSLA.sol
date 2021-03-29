// bDSLA.sol
// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

/**
 * @dev {bDSLA} Dummy test token, for development purposes only
 */

contract bDSLA is ERC20PresetMinterPauser {
    /**
     * @dev Sets the values for {name} and {symbol}, {decimals} have
     * a default value of 18.
     * @notice token name: bDSLA , token symbol: bDSLA
     */
    constructor() public ERC20PresetMinterPauser("bDSLA", "bDSLA") {}

    /**
     * @dev Creates `amount` new tokens for `to`.
     * @param to 1. address of receiver
     * @param amount 2. minted amount
     */
    function mint(address to, uint256 amount) public override {
        _mint(to, amount);
    }
}
