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
    mapping(uint256 => uint256) public lastAPYBps;
    mapping(uint256 => uint256) public lastUpdatedAt;
    mapping(uint256 => int8) private apyTrend;

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
        uint256 previousAPY = strategies[id].apyBps;
        if (previousAPY == 0) {
            apyTrend[id] = 0;
        } else if (apyBps > previousAPY) {
            apyTrend[id] = 1;
        } else if (apyBps < previousAPY) {
            apyTrend[id] = -1;
        } else {
            apyTrend[id] = 0;
        }
        lastAPYBps[id] = previousAPY;
        lastUpdatedAt[id] = block.timestamp;

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

    function getAPYTrend(uint256 id) external view returns (int8) {
        return apyTrend[id];
    }

    function getAPYTrendLabel(uint256 id) external view returns (string memory) {
        int8 trend = apyTrend[id];
        if (trend > 0) return "rising";
        if (trend < 0) return "falling";
        return "flat";
    }
}
