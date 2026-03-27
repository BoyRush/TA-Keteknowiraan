"""
security_service.py
Modul keamanan AES-256-GCM untuk enkripsi/dekripsi data yang disimpan ke IPFS.

Alur:
- Kunci Unik Per-Pengguna: HKDF(MASTER_SECRET + wallet_address) → 32-byte key
- Enkripsi: AES-256-GCM → {ciphertext (hex), nonce (hex), tag (hex)}
- Dekripsi: AES-256-GCM → JSON asli
"""

import os
import json
import hashlib

from Crypto.Cipher import AES
from Crypto.Protocol.KDF import HKDF
from Crypto.Hash import SHA256
from Crypto.Random import get_random_bytes

# ============================================================
# 1. MASTER SECRET (Dibaca dari .env)
# ============================================================

def _get_master_secret() -> bytes:
    """Ambil MASTER_SECRET dari environment variable."""
    secret = os.environ.get("AES_MASTER_SECRET", "default-smartherbal-secret-change-me")
    return secret.encode("utf-8")


# ============================================================
# 2. KEY DERIVATION (Per-Pengguna, HKDF SHA-256)
# ============================================================

def get_user_key(wallet_address: str) -> bytes:
    """
    Derive kunci AES 32-byte UNIK untuk setiap wallet address.
    Menggunakan HKDF dengan MASTER_SECRET sebagai bahan utama.
    Wallet address adalah salt untuk memastikan kunci unik per-pengguna.
    """
    master = _get_master_secret()
    salt = wallet_address.lower().strip().encode("utf-8")

    # Gunakan HKDF dari pycryptodome
    key = HKDF(
        master=master,
        key_len=32,                   # AES-256 = 32 bytes
        salt=salt,
        hashmod=SHA256,
        context=b"smartherbal-aes256-gcm"
    )
    return key


# ============================================================
# 3. ENKRIPSI — Untuk digunakan saat STORE ke IPFS
# ============================================================

def encrypt_data(data: dict, wallet_address: str) -> dict:
    """
    Enkripsi data dictionary menggunakan AES-256-GCM.
    
    Returns:
        dict berformat JSON yang aman untuk diunggah ke IPFS:
        {
          "encrypted": true,
          "ciphertext": "<hex>",
          "nonce": "<hex>",
          "tag": "<hex>"
        }
    """
    key = get_user_key(wallet_address)
    
    # Ubah data dict ke bytes JSON
    plaintext = json.dumps(data, ensure_ascii=False).encode("utf-8")
    
    # Buat cipher GCM dengan nonce acak 16 bytes
    nonce = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext)
    
    return {
        "encrypted": True,
        "ciphertext": ciphertext.hex(),
        "nonce": nonce.hex(),
        "tag": tag.hex()
    }


# ============================================================
# 4. DEKRIPSI — Untuk digunakan saat GET dari IPFS
# ============================================================

def decrypt_data(encrypted_json: dict, wallet_address: str) -> dict:
    """
    Dekripsi data yang sudah dienkripsi oleh encrypt_data().
    
    Args:
        encrypted_json: dict dari IPFS berisi ciphertext, nonce, tag
        wallet_address: alamat wallet pemilik data (untuk derive key)
    
    Returns:
        dict data asli (plaintext)
    
    Raises:
        ValueError: jika data bukan format enkripsi yang valid (data legacy)
    """
    # Cek apakah ini data terenkripsi atau data lama (legacy plaintext)
    if not encrypted_json.get("encrypted"):
        # DATA LEGACY (belum dienkripsi) — kembalikan apa adanya
        return encrypted_json
    
    key = get_user_key(wallet_address)
    
    try:
        ciphertext = bytes.fromhex(encrypted_json["ciphertext"])
        nonce = bytes.fromhex(encrypted_json["nonce"])
        tag = bytes.fromhex(encrypted_json["tag"])
        
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        
        return json.loads(plaintext.decode("utf-8"))
    
    except (ValueError, KeyError) as e:
        raise ValueError(f"Dekripsi gagal — data korup atau kunci salah: {e}")


# ============================================================
# 5. HELPER — Untuk data Herbal (tanpa wallet / global key)
# ============================================================

def _get_global_key() -> bytes:
    """
    Derive kunci global untuk data Herbal (bukan per-pasien).
    Data herbal milik sistem/dokter, sehingga tidak bersifat per-pasien.
    """
    master = _get_master_secret()
    salt = b"smartherbal-global-herbal-catalog"
    return HKDF(
        master=master,
        key_len=32,
        salt=salt,
        hashmod=SHA256,
        context=b"herbal-data-encryption"
    )


def encrypt_herbal(data: dict) -> dict:
    """Enkripsi data herbal menggunakan kunci global sistem."""
    key = _get_global_key()
    plaintext = json.dumps(data, ensure_ascii=False).encode("utf-8")
    nonce = get_random_bytes(16)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext)
    return {
        "encrypted": True,
        "ciphertext": ciphertext.hex(),
        "nonce": nonce.hex(),
        "tag": tag.hex()
    }


def decrypt_herbal(encrypted_json: dict) -> dict:
    """Dekripsi data herbal. Jika legacy plaintext, kembalikan apa adanya."""
    if not encrypted_json.get("encrypted"):
        return encrypted_json  # Legacy data — tidak dienkripsi, loloskan
    
    key = _get_global_key()
    try:
        ciphertext = bytes.fromhex(encrypted_json["ciphertext"])
        nonce = bytes.fromhex(encrypted_json["nonce"])
        tag = bytes.fromhex(encrypted_json["tag"])
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        plaintext = cipher.decrypt_and_verify(ciphertext, tag)
        return json.loads(plaintext.decode("utf-8"))
    except (ValueError, KeyError) as e:
        raise ValueError(f"Dekripsi herbal gagal: {e}")
