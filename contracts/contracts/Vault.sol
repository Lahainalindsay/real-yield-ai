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

    mapping(address => uint256) private userBalances;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event StrategyChanged(uint256 indexed oldStrategyId, uint256 indexed newStrategyId, address indexed actor);

    constructor(IERC20 _asset, address _yieldOracle) Ownable(msg.sender) {
        require(address(_asset) != address(0), "asset=0");
        require(_yieldOracle != address(0), "oracle=0");
        asset = _asset;
        yieldOracle = IYieldOracle(_yieldOracle);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_ROLE, msg.sender);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        bool ok = asset.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");
        userBalances[msg.sender] += amount;
        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        uint256 bal = userBalances[msg.sender];
        require(bal >= amount, "insufficient");
        userBalances[msg.sender] = bal - amount;
        bool ok = asset.transfer(msg.sender, amount);
        require(ok, "transfer failed");
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

    function setActiveStrategy(uint256 strategyId) external {
        require(owner() == msg.sender || hasRole(AGENT_ROLE, msg.sender), "not-authorized");
        uint256 old = activeStrategyId;
        activeStrategyId = strategyId;
        emit StrategyChanged(old, strategyId, msg.sender);
    }
}
