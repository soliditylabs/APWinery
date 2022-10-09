import { ethers } from "hardhat";

async function main() {
  const ApWinery = await ethers.getContractFactory("ApWinery");
  const apWinery = await ApWinery.deploy();
  await apWinery.deployed();

  console.log(`Deployed to ${apWinery.address}`);

  await apWinery.functions.deposit({ value: ethers.utils.parseEther("1") });

  const ptBalanceAfterDeposit = await apWinery.functions.getPTBalance();
  console.log(
    `PT Balance After Deposit ${ethers.utils.formatEther(
      ptBalanceAfterDeposit.toString()
    )}`
  );

  const fytBalanceAfterDeposit =
    await apWinery.functions.getCurrentPeriodTotalFYTBalance();
  console.log(
    `FYT Balance After Deposit ${ethers.utils.formatEther(
      fytBalanceAfterDeposit.toString()
    )}`
  );

  const unrealizedYield = await apWinery.functions.getUnrealizedYield();
  console.log(
    `Unrealized Yield ${ethers.utils.formatEther(unrealizedYield.toString())}`
  );

  await apWinery.functions.withdraw();

  const ptBalanceAfterWithdraw = await apWinery.functions.getPTBalance();
  console.log(
    `PT Balance After Withdraw ${ethers.utils.formatEther(
      ptBalanceAfterWithdraw.toString()
    )}`
  );

  const fytBalanceAfterWithdraw =
    await apWinery.functions.getCurrentPeriodTotalFYTBalance();
  console.log(
    `FYT Balance After Withdraw ${ethers.utils.formatEther(
      fytBalanceAfterWithdraw.toString()
    )}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
