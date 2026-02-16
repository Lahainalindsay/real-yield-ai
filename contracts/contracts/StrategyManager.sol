// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract StrategyManager is Ownable {
    struct Strategy {
        string name;
        uint256 apyBps;
        uint256 liquidityBps;
        uint256 utilizationBps;
        bool enabled;
    }

    mapping(uint256 => Strategy) private strategies;

    event StrategySet(
        uint256 indexed id,
        string name,
        uint256 apyBps,
        uint256 liquidityBps,
        uint256 utilizationBps,
        bool enabled
    );

    constructor() Ownable(msg.sender) {}

    function setStrategy(
        uint256 id,
        string calldata name,
        uint256 apyBps,
        uint256 liquidityBps,
        uint256 utilizationBps,
        bool enabled
    ) external onlyOwner {
        strategies[id] = Strategy({
            name: name,
            apyBps: apyBps,
            liquidityBps: liquidityBps,
            utilizationBps: utilizationBps,
            enabled: enabled
        });
        emit StrategySet(id, name, apyBps, liquidityBps, utilizationBps, enabled);
    }

    function getStrategy(uint256 id) external view returns (Strategy memory) {
        return strategies[id];
    }
}
