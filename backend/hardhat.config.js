require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    ganache: {
      url: "http://localhost:8545", 
      accounts: [
        "0x0f141f1c3d413acee5555cd01c63d9d09142d12cb3a6dc8eb925ad3259bd1afd" // Ganti dengan Private Key (0) dari terminal Ganache tadi
      ]
    }
  }
};