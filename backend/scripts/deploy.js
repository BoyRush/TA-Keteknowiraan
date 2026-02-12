const hre = require("hardhat");

async function main() {
  const StorageHealthRecords = await hre.ethers.getContractFactory("StorageHealthRecords");
  const contract = await StorageHealthRecords.deploy();

  await contract.waitForDeployment();

  console.log("Contract deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
