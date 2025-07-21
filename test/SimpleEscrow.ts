import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumberish, Signer } from "ethers";
import { SimpleEscrow } from "../typechain-types/SimpleEscrow";

describe("SimpleEscrow", function () {
  let escrow: SimpleEscrow;
  let payer: Signer;
  let payee: Signer;
  let other: Signer;
  let escrowAmount: BigNumberish;

  beforeEach(async () => {
    [payer, payee, other] = await ethers.getSigners();
    escrowAmount = ethers.parseEther("1");

    const SimpleEscrowFactory = await ethers.getContractFactory("SimpleEscrow", payer);
    escrow = (await SimpleEscrowFactory.deploy(await payee.getAddress(), {
      value: escrowAmount,
    })) as unknown as SimpleEscrow;

    await escrow.waitForDeployment();
  });

  it("should initialize correctly", async () => {
    expect(await escrow.payer()).to.equal(await payer.getAddress());
    expect(await escrow.payee()).to.equal(await payee.getAddress());
    expect(await escrow.amount()).to.equal(escrowAmount);
    expect(await escrow.isFunded()).to.equal(true);
    expect(await escrow.isReleased()).to.equal(false);
  });

  it("should allow payer to release funds", async () => {
    const payeeAddr = await payee.getAddress();
    const payeeBalanceBefore = await ethers.provider.getBalance(payeeAddr);

    const tx = await escrow.connect(payer).release();
    await tx.wait();

    const payeeBalanceAfter = await ethers.provider.getBalance(payeeAddr);
    expect(await escrow.isReleased()).to.equal(true);
    expect(payeeBalanceAfter - payeeBalanceBefore).to.equal(escrowAmount);
  });

  it("should not allow release by non-payer", async () => {
    await expect(escrow.connect(other).release()).to.be.revertedWith("Only payer can release funds");
  });

  it("should not allow release twice", async () => {
    await escrow.connect(payer).release();
    await expect(escrow.connect(payer).release()).to.be.revertedWith("Already released");
  });

  it("should allow cancel before release", async () => {
    const payerAddr = await payer.getAddress();
    const payerBalanceBefore = await ethers.provider.getBalance(payerAddr);

    const tx = await escrow.connect(payer).cancel();
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * (tx.gasPrice ?? 0n);

    const payerBalanceAfter = await ethers.provider.getBalance(payerAddr);
    const diff = payerBalanceBefore - payerBalanceAfter + gasUsed;
    expect(diff < ethers.parseEther("0.01")).to.be.true;
  });

  it("should not allow cancel after release", async () => {
    await escrow.connect(payer).release();
    await expect(escrow.connect(payer).cancel()).to.be.revertedWith("Already released");
  });

  it("should not allow cancel by non-payer", async () => {
    await expect(escrow.connect(other).cancel()).to.be.revertedWith("Only payer can cancel");
  });
});
