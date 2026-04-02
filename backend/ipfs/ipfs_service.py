import json
import subprocess
import requests

def _detect_ipfs_api_port():
    """Auto-detect IPFS API port (Daemon/Desktop)."""
    # 1. Prioritaskan HTTP check untuk IPFS Desktop/Daemon (tanpa butuh CLI ipfs terinstall)
    for port in [5001, 5002]:
        try:
            r = requests.post(f"http://127.0.0.1:{port}/api/v0/id", timeout=1)
            if r.status_code == 200:
                print(f"✅ [IPFS] Auto-detected active port via HTTP: {port} (Desktop/Daemon)")
                return port
        except Exception:
            continue
            
    # 2. Fallback: Coba periksa config melalui CLI (berfungsi jika API belum aktif atau port beda)
    try:
        result = subprocess.run(
            ["ipfs", "config", "Addresses.API"],
            capture_output=True, text=True, timeout=3
        )
        if result.returncode == 0:
            # Format: /ip4/127.0.0.1/tcp/5002
            parts = result.stdout.strip().split("/")
            port = parts[-1]  # Last element is the port
            print(f"✅ [IPFS] Auto-detected API port via Config: {port}")
            return int(port)
    except Exception as e:
        print(f"⚠️ [IPFS] CLI fallback gagal: {e}")
    
    print("⚠️ [IPFS] Tidak ada port aktif, menggunakan default 5001")
    return 5001

IPFS_PORT = _detect_ipfs_api_port()
IPFS_API_URL = f"http://127.0.0.1:{IPFS_PORT}/api/v0/add"

def upload_json_to_ipfs(data: dict) -> str:
    files = {
        "file": (
            "herbal.json",
            json.dumps(data),
            "application/json"
        )
    }

    r = requests.post(IPFS_API_URL, files=files)
    if r.status_code != 200:
        raise Exception("IPFS upload failed")

    return r.json()["Hash"]


def get_json_from_ipfs(cid):
    url = f"http://127.0.0.1:{IPFS_PORT}/api/v0/cat?arg={cid}"
    try:
        r = requests.post(url, timeout=5) 
        if r.status_code == 200:
            return r.json()
        return None
    except Exception as e:
        print(f"IPFS ERROR: {e}")
        return None