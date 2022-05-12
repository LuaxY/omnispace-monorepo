//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library Utils {
    // TODO: document
    function splitNumber(uint256 number_)
        internal
        pure
        returns (uint8[7] memory)
    {
        uint8[7] memory numbers;

        for (uint256 i = 0; i < numbers.length; i++) {
            numbers[i] = uint8(number_ % 10);
            number_ /= 10;
        }

        return numbers;
    }

    // TODO: doc
    function bytes12ToString(bytes12 bytes12_)
        internal
        pure
        returns (string memory)
    {
        uint8 i = 0;
        while (i < 12 && bytes12_[i] != 0) {
            i++;
        }

        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 12 && bytes12_[i] != 0; i++) {
            bytesArray[i] = bytes12_[i];
        }

        return string(bytesArray);
    }
}
