// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldOracleMock is Ownable {
    uint256 public currentAPYBps;

    event APYUpdated(uint256 newAPYBps);

    constructor() Ownable(msg.sender) {}

    function setAPYBps(uint256 newAPYBps) external onlyOwner {
        currentAPYBps = newAPYBps;
        emit APYUpdated(newAPYBps);
    }
}
