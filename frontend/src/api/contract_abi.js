// src/api/contract_abi.js

export const CONTRACT_ADDRESS = "0x2f15e7A491EF4842c93fC17530080A33a1CD2137"; 

export const HEALTH_RECORD_ABI = [
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  {
    "inputs": [
      { "internalType": "address", "name": "_patient", "type": "address" },
      { "internalType": "address", "name": "_doctor", "type": "address" }
    ],
    "name": "checkAccess",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  { "inputs": [], "name": "admin", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_doctor", "type": "address" }], "name": "getHerbalRecords", "outputs": [{ "components": [{ "internalType": "string", "name": "cid", "type": "string" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "internalType": "struct StorageHealthRecords.HerbalRecord[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_patient", "type": "address" }], "name": "getMedicalRecords", "outputs": [{ "components": [{ "internalType": "string", "name": "cid", "type": "string" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" }], "internalType": "struct StorageHealthRecords.MedicalRecord[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_doctor", "type": "address" }], "name": "grantAccess", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }], "name": "pendingRequests", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_doctor", "type": "address" }], "name": "rejectAccess", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_patient", "type": "address" }], "name": "requestAccess", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_doctor", "type": "address" }], "name": "revokeAccess", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "string", "name": "_cid", "type": "string" }], "name": "storeHerbalData", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_patient", "type": "address" }, { "internalType": "string", "name": "_cid", "type": "string" }], "name": "storeMedicalRecord", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "verifiedDoctor", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "_doctor", "type": "address" }], "name": "verifyDoctor", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];