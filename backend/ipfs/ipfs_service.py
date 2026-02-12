import json
import requests

IPFS_API_URL = "http://127.0.0.1:5001/api/v0/add"

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
    # Coba gunakan port API 5001 dengan endpoint cat
    url = f"http://127.0.0.1:5001/api/v0/cat?arg={cid}"
    try:
        r = requests.post(url, timeout=5) 
        if r.status_code == 200:
            return r.json()
        return None
    except Exception as e:
        print(f"IPFS ERROR: {e}")
        return None