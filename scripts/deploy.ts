import { ethers } from "hardhat";

async function main() {
  const ApWinery = await ethers.getContractFactory("ApWinery");
  const apWinery = await ApWinery.deploy();
  await apWinery.deployed();

  console.log(`Deployed to ${apWinery.address}`);

  await apWinery.functions.deposit({ value: ethers.utils.parseEther("1") });

  const ptBalanceAfterDeposit = await apWinery.functions.getPTBalance();
  console.log(`PT Balance After Deposit ${ptBalanceAfterDeposit}`);

  const fytBalanceAfterDeposit =
    await apWinery.functions.getCurrentPeriodTotalFYTBalance();
  console.log(`FYT Balance After Deposit ${fytBalanceAfterDeposit}`);

  await apWinery.functions.withdraw();

  const ptBalanceAfterWithdraw = await apWinery.functions.getPTBalance();
  console.log(`PT Balance After Withdraw ${ptBalanceAfterWithdraw}`);

  const fytBalanceAfterWithdraw =
    await apWinery.functions.getCurrentPeriodTotalFYTBalance();
  console.log(`FYT Balance After Withdraw ${fytBalanceAfterWithdraw}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
