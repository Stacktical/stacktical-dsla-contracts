// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import '../libraries/StringUtils.sol';

contract MockStringUtils {
    function stringFloatToUnit(bytes memory value)
        external
        pure
        returns (uint256)
    {
        return StringUtils.stringFloatToUnit(value);
    }
}
