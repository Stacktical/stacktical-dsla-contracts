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

    function addressToString(address address_)
        external
        pure
        returns (string memory)
    {
        return StringUtils.addressToString(address_);
    }

    function bytes32ToStr(bytes32 bytes32_)
        external
        pure
        returns (string memory)
    {
        return StringUtils.bytes32ToStr(bytes32_);
    }

    function bytesToUint(bytes memory b) external pure returns (uint256) {
        return StringUtils.bytesToUint(b);
    }

    function uintToStr(uint256 value) external pure returns (string memory) {
        return StringUtils.uintToStr(value);
    }
}
