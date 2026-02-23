const StorageHealthRecords = artifacts.require("StorageHealthRecords");

module.exports = function (deployer) {
  deployer.deploy(StorageHealthRecords);
};