// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IYieldOracle {
    function currentAPYBps() external view returns (uint256);
}

contract Vault is Ownable, ReentrancyGuard, AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    IERC20 public immutable asset;
    IYieldOracle public immutable yieldOracle;
    uint256 public activeStrategyId;
    uint256 public lastStrategySwitchBlock;
    uint256 public minStrategySwitchBlocks;
    mapping(uint256 => int256) public netFlowByBlock;

    mapping(address => uint256) private userBalances;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event StrategyChanged(uint256 indexed oldStrategyId, uint256 indexed newStrategyId, address indexed actor);
    event Decision(
        string action,
        uint256 opportunityScoreBps,
        uint256 riskScoreBps,
        uint256 reasonFlags,
        bytes32 decisionId,
        address indexed actor
    );
    event NetFlowUpdated(uint256 indexed blockNumber, int256 netFlowDelta, int256 netFlowAtBlock);
    event StrategySwitchPolicyUpdated(uint256 minBlocksBetweenSwitches);

    modifier onlyOwnerOrAgent() {
        require(owner() == msg.sender || hasRole(AGENT_ROLE, msg.sender), "not-authorized");
        _;
    }

    constructor(IERC20 _asset, address _yieldOracle) Ownable(msg.sender) {
        require(address(_asset) != address(0), "asset=0");
        require(_yieldOracle != address(0), "oracle=0");
        asset = _asset;
        yieldOracle = IYieldOracle(_yieldOracle);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
        minStrategySwitchBlocks = 0;
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        bool ok = asset.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");
        userBalances[msg.sender] += amount;
        _recordNetFlow(int256(amount));
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        uint256 bal = userBalances[msg.sender];
        require(bal >= amount, "insufficient");
        userBalances[msg.sender] = bal - amount;
        bool ok = asset.transfer(msg.sender, amount);
        require(ok, "transfer failed");
        _recordNetFlow(-int256(amount));
        emit Withdraw(msg.sender, amount);
    }

    function balanceOf(address user) external view returns (uint256) {
        return userBalances[user];
    }

    function totalAssets() external view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function currentAPYBps() external view returns (uint256) {
        return yieldOracle.currentAPYBps();
    }

    function setActiveStrategy(uint256 strategyId) external onlyOwnerOrAgent {
        _switchStrategy(strategyId);
    }

    function setActiveStrategyWithDecision(
        uint256 strategyId,
        string calldata action,
        uint256 opportunityScoreBps,
        uint256 riskScoreBps,
        uint256 reasonFlags,
        bytes32 decisionId
    ) external onlyOwnerOrAgent {
        _switchStrategy(strategyId);
        emit Decision(action, opportunityScoreBps, riskScoreBps, reasonFlags, decisionId, msg.sender);
    }

    function recordDecision(
        string calldata action,
        uint256 opportunityScoreBps,
        uint256 riskScoreBps,
        uint256 reasonFlags,
        bytes32 decisionId
    ) external onlyOwnerOrAgent {
        emit Decision(action, opportunityScoreBps, riskScoreBps, reasonFlags, decisionId, msg.sender);
    }

    function netFlowLastNBlocks(uint256 n) external view returns (int256 totalNetFlow) {
        require(n > 0 && n <= 2000, "invalid-window");
        uint256 current = block.number;
        uint256 start = current > (n - 1) ? current - (n - 1) : 0;
        for (uint256 b = start; b <= current; b++) {
            totalNetFlow += netFlowByBlock[b];
        }
    }

    function _recordNetFlow(int256 delta) internal {
        netFlowByBlock[block.number] += delta;
        emit NetFlowUpdated(block.number, delta, netFlowByBlock[block.number]);
    }

    function setMinStrategySwitchBlocks(uint256 minBlocks) external onlyOwner {
        minStrategySwitchBlocks = minBlocks;
        emit StrategySwitchPolicyUpdated(minBlocks);
    }

    function _switchStrategy(uint256 strategyId) internal {
        uint256 old = activeStrategyId;
        if (old != 0 && strategyId != old && minStrategySwitchBlocks > 0) {
            require(
                block.number >= lastStrategySwitchBlock + minStrategySwitchBlocks,
                "switch-cooldown-active"
            );
        }
        activeStrategyId = strategyId;
        if (strategyId != old) {
            lastStrategySwitchBlock = block.number;
        }
        emit StrategyChanged(old, strategyId, msg.sender);
    }
}
