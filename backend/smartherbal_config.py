import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv(override=True)

# --- KONSTANTA SMARTHERBAL ---
FREE_QUOTA_LIMIT = 3
PREMIUM_PRICE = 5000
PREMIUM_DURATION_DAYS = 30

# --- KONEKSI DATABASE SMARTHERBAL (Terpisah dari TA) ---
def get_sh_db_connection():
    return mysql.connector.connect(
        host=os.getenv("SH_DB_HOST", "localhost"),
        user=os.getenv("SH_DB_USER", "root"),
        password=os.getenv("SH_DB_PASSWORD", "root"), 
        database=os.getenv("SH_DB_NAME", "smartherbal_db"),
        port=int(os.getenv("SH_DB_PORT", 3306)),
        collation="utf8mb4_general_ci"
    )


