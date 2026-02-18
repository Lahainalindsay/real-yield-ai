import { expect } from "chai";
import { ethers } from "hardhat";

describe("StrategyManager", function () {
  it("stores APY trend as rising/falling/flat", async function () {
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    const strategyManager = await StrategyManager.deploy();

    await strategyManager.setStrategy(1, "A", 400, 9000, 3000, true);
    expect(await strategyManager.getAPYTrend(1)).to.equal(0);
    expect(await strategyManager.getAPYTrendLabel(1)).to.equal("flat");

    await strategyManager.setStrategy(1, "A", 450, 9000, 3000, true);
    expect(await strategyManager.getAPYTrend(1)).to.equal(1);
    expect(await strategyManager.getAPYTrendLabel(1)).to.equal("rising");

    await strategyManager.setStrategy(1, "A", 420, 9000, 3000, true);
    expect(await strategyManager.getAPYTrend(1)).to.equal(-1);
    expect(await strategyManager.getAPYTrendLabel(1)).to.equal("falling");
  });
});
