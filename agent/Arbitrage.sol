// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Arbitrage {
    address public owner;

    event Executed(address tokenBuy, address tokenSell, uint amountIn, uint amountOut);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function execute(address tokenBuy, address tokenSell, uint amountIn, uint minAmountOut) external onlyOwner {
        // Imagine flash loan + swap logic here
        emit Executed(tokenBuy, tokenSell, amountIn, minAmountOut);
    }

    function withdraw(address token) external onlyOwner {
        // Dummy withdraw for demo
    }
}
