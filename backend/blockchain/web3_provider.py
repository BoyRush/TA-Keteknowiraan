from web3 import Web3
import os
from dotenv import load_dotenv

load_dotenv()

RPC_URL = os.getenv("RPC_URL", "http://127.0.0.1:8545")

web3 = Web3(Web3.HTTPProvider(RPC_URL))

if not web3.is_connected():
    raise Exception("Gagal konek ke blockchain")
