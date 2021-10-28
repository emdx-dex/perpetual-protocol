// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import { Decimal } from "../utils/Decimal.sol";

interface IMinter {
    function withdrawForLoss(Decimal.decimal memory _amount, address _quoteToken) external;
}
