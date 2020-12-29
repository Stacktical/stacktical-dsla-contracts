// bDSLAToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/presets/ERC20PresetMinterPauser.sol";

/**
 * @dev {bDSLA} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a minter role that allows for token minting (creation)
 *  - a pauser role that allows to stop all token transfers
 *  - a claim procces for DSLA owners
 *
 * This contract uses {AccessControl} to lock permissioned functions using the
 * different roles.
 *
 * The account that deploys the contract will be granted the minter and pauser
 * roles, as well as the default admin role, which will let it grant both minter
 * and pauser roles to other accounts.
 */

contract DAI is ERC20PresetMinterPauser {
    mapping (address => uint256) private _allowedBalances;
    mapping (address => bool) private _claimed;
    event Allowed(uint indexed _amount, address indexed _claimer);


    /**
     * @dev Sets the values for {name} and {symbol}, {decimals} have
     * a default value of 18.
     * @notice token name: bDSLA , token symbol: bDSLA
     */
    constructor() public ERC20PresetMinterPauser("DAI", "DAI") {
    }

    /**
     * @notice the setAllowedAmount function allows the admin to set an amount
     * of claimable bDSLA based on the balanceOf DSLA token of the claimer on the
     * mainnet.
     * @dev allows the claim of `_amount` for `_claimer`.
     *
     * @param _amount 1. uint the equivalent amount of DSLA tokens on the mainnet
     * @param _claimer 2. address of the claimer
     *
     *
     * Requirements:
     *
     * - the caller must have the `(DEFAULT_ADMIN_ROLE)`.
     */
    function setAllowedAmount(uint _amount, address _claimer) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have admin role");
        require(!_claimed[_claimer], "bDSLAToken: tokens already claimed");
        _allowedBalances[_claimer] = _amount;
        emit Allowed(_amount, _claimer);
    }

    /**
     * @notice the setAllowedAmounts function allows the admin to set
     * a claimable amounts of bDSLA for claimers.
     *
     * @dev allows the claim of `_amounts` for `_claimers`.
     *
     * @param _amounts 1. an array of amounts to be claimed
     * @param _claimers 2. an array of addresses of the claimers
     *
     *
     * Requirements:
     *
     * - the caller must have the `(DEFAULT_ADMIN_ROLE)`.
     */
    function setAllowedAmounts(uint[] memory _amounts, address[] memory _claimers) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have admin role");
        require(_amounts.length == _claimers.length, "bDSLAToken: must have the same number of items");
        for(uint i=0; i < _amounts.length; i++){
            if(!_claimed[_claimers[i]]){
                _allowedBalances[_claimers[i]] = _amounts[i];
                emit Allowed(_amounts[i], _claimers[i]);
            }
        }
    }

    /**
     * @notice the setAllowedAmounts function allows the admin to set
     * a claimable amounts of bDSLA for claimers.
     *
     * @dev creates new 'bDSLA' tokens for the `_claimer`.
     *
     * @param _claimer 1. address of the claimer
     *
     *
     * Requirements:
     *
     * - the caller must have the `(MINTER_ROLE)`.
     * - the claimer should have an allowed balance
     * - the claim can be done just once
     */
    function claim(address _claimer) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "ERC20PresetMinterPauser: must have minter role");
        require(_allowedBalances[_claimer] > 0, "bDSLAToken: must have an allowed amoun to claim");
        require(!_claimed[_claimer], "bDSLAToken: tokens already claimed");
        _claimed[_claimer] = true;
        mint(_claimer, _allowedBalances[_claimer]);
    }

    /**
    * @dev Creates `amount` new tokens for `to`.
    * @param to 1. address of receiver
    * @param amount 2. minted amount
    */
    function mint(address to, uint256 amount) public override {
        _mint(to, amount);
    }

}
