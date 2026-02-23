module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545, 
      network_id: "*",
    },
  },
  compilers: {
    solc: {
      version: "0.8.20", 
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
  },
  // Lokasi penyimpanan hasil masak (ABI) agar tidak bentrok dengan Hardhat
  contracts_build_directory: "./build/contracts",
};