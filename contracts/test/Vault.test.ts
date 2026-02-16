import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vault", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const token = await ERC20Mock.deploy();

    const YieldOracleMock = await ethers.getContractFactory("YieldOracleMock");
    const oracle = await YieldOracleMock.deploy();
    await oracle.setAPYBps(450);

    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(await token.getAddress(), await oracle.getAddress());

    await token.mint(user.address, ethers.parseEther("100"));

    return { owner, user, token, oracle, vault };
  }

  it("deposits and tracks user balance + total assets", async function () {
    const { user, token, vault } = await deployFixture();
    const amount = ethers.parseEther("10");

    await token.connect(user).approve(await vault.getAddress(), amount);
    await expect(vault.connect(user).deposit(amount)).to.emit(vault, "Deposit");

    expect(await vault.balanceOf(user.address)).to.equal(amount);
    expect(await vault.totalAssets()).to.equal(amount);
  });

  it("withdraws within user balance", async function () {
    const { user, token, vault } = await deployFixture();
    const amount = ethers.parseEther("8");

    await token.connect(user).approve(await vault.getAddress(), amount);
    await vault.connect(user).deposit(amount);

    await expect(vault.connect(user).withdraw(ethers.parseEther("3"))).to.emit(vault, "Withdraw");

    expect(await vault.balanceOf(user.address)).to.equal(ethers.parseEther("5"));
    expect(await vault.totalAssets()).to.equal(ethers.parseEther("5"));
  });

  it("reverts withdraw over balance", async function () {
    const { user, vault } = await deployFixture();
    await expect(vault.connect(user).withdraw(1)).to.be.revertedWith("insufficient");
  });

  it("returns APY from oracle", async function () {
    const { vault } = await deployFixture();
    expect(await vault.currentAPYBps()).to.equal(450);
  });

  it("allows owner to set active strategy", async function () {
    const { vault } = await deployFixture();
    await vault.setActiveStrategy(2);
    expect(await vault.activeStrategyId()).to.equal(2);
  });

  it("blocks non-agent non-owner strategy updates", async function () {
    const { user, vault } = await deployFixture();
    await expect(vault.connect(user).setActiveStrategy(2)).to.be.revertedWith("not-authorized");
  });
});
