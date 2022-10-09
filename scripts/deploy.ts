import { ethers } from "hardhat";

async function main() {
  const ApWinery = await ethers.getContractFactory("ApWinery");
  const apWinery = await ApWinery.deploy();
  await apWinery.deployed();

  console.log(`Deployed to ${apWinery.address}`);

  await apWinery.functions.deposit({ value: ethers.utils.parseEther("1") });

  const ptBalance = await apWinery.functions.getPTBalance();
  console.log(`PT Balance ${ptBalance}`);

  const fytBalance = await apWinery.functions.getCurrentPeriodTotalFYTBalance();
  console.log(`FYT Balance ${fytBalance}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
