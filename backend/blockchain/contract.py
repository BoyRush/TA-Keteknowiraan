from web3 import Web3
import json
import os


web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))

if not web3.is_connected():
    raise Exception("Web3 not connected")


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ABI_PATH = os.path.join(BASE_DIR, "abi", "StorageHealthRecords.json")

with open(ABI_PATH, "r") as f:
    contract_abi = json.load(f)["abi"]


CONTRACT_ADDRESS = web3.to_checksum_address(
    "0x2f15e7A491EF4842c93fC17530080A33a1CD2137"
)

contract = web3.eth.contract(
    address=CONTRACT_ADDRESS,
    abi=contract_abi
)
