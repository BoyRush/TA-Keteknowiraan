import json
import os
from web3 import Web3
from dotenv import set_key

# --- KONFIGURASI PATH (Menggunakan Raw String 'r' untuk Windows) ---
GANACHE_URL = "http://127.0.0.1:8545"
JSON_ARTIFACT_PATH = r"backend\build\contracts\StorageHealthRecords.json"
BACKEND_ENV_PATH = r"backend\.env"
FRONTEND_ENV_PATH = r"frontend\.env.local"
FRONTEND_ABI_JS_PATH = r"frontend\src\api\contract_abi.js"

# 1. Koneksi ke Ganache
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
if not w3.is_connected():
    print("❌ Gagal terhubung ke Ganache! Pastikan Ganache UI/CLI sudah jalan.")
    exit()

deployer = w3.eth.accounts[0] # Menggunakan akun pertama Ganache

# 2. Baca ABI & Bytecode
try:
    with open(JSON_ARTIFACT_PATH, "r") as file:
        contract_data = json.load(file)
except FileNotFoundError:
    print(f"❌ File JSON tidak ditemukan di: {JSON_ARTIFACT_PATH}")
    exit()

# Menangani perbedaan format output (Remix/Truffle/Hardhat)
abi = contract_data.get("abi")
bytecode = contract_data.get("bytecode")
if isinstance(bytecode, dict): 
    bytecode = bytecode.get("object")

if not abi or not bytecode:
    print("❌ ABI atau Bytecode tidak ditemukan dalam file JSON!")
    exit()

# 3. Proses Deploy
print("🚀 Sedang men-deploy kontrak baru ke Blockchain...")
Contract = w3.eth.contract(abi=abi, bytecode=bytecode)

tx_hash = Contract.constructor().transact({'from': deployer})
tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
new_address = tx_receipt.contractAddress

print(f"✅ KONTRAK BERHASIL DI-DEPLOY!")
print(f"📍 Alamat Baru: {new_address}")

# 4. SINKRONISASI OTOMATIS KE .ENV
print("🔄 Menyinkronkan alamat ke file environment...")

if os.path.exists(BACKEND_ENV_PATH):
    set_key(BACKEND_ENV_PATH, "CONTRACT_ADDRESS", new_address)
    print("   - [OK] Backend .env updated.")

if os.path.exists(FRONTEND_ENV_PATH):
    set_key(FRONTEND_ENV_PATH, "NEXT_PUBLIC_CONTRACT_ADDRESS", new_address)
    print("   - [OK] Frontend .env.local updated.")

# 5. OVERWRITE FILE contract_abi.js (Next.js)
# Membuat isi file JS secara otomatis dengan ABI terbaru
abi_content = f"""// FILE INI DIHASILKAN OTOMATIS OLEH deploy_sync.py
export const CONTRACT_ADDRESS = "{new_address}"; 

export const HEALTH_RECORD_ABI = {json.dumps(abi, indent=2)};
"""

with open(FRONTEND_ABI_JS_PATH, "w") as js_file:
    js_file.write(abi_content)

print(f"✨ [OK] File {FRONTEND_ABI_JS_PATH} diperbarui.")
print("\n🔥 SEMUA SISTEM TELAH SINKRON.")
print("Silakan restart server Next.js dan Flask jika diperlukan.")