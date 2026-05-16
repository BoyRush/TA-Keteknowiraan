"""
services/gemini_model.py
=========================================================
Wrapper untuk Gemini API menggunakan SDK terbaru google-genai

SETUP API KEY:
  1. Buat API Key di: https://aistudio.google.com/apikey
  2. Salin backend/.env.example menjadi backend/.env
  3. Isi GEMINI_API_KEY=<key_anda> di file .env
  4. Restart backend

CATATAN: File .env TIDAK di-push ke git (sudah di .gitignore).
  Setiap developer/anggota tim waj# pyrefly: ignore [missing-import]
ib membuat .env sendiri dari .env.example.
"""
from google import genai 
from google.genai import types
import os
import sys
import time
from dotenv import load_dotenv

# ── Load .env dengan override wajib ──────────────────────────────────────────
# override=True memastikan nilai dari .env menggantikan environment sistem
load_dotenv(override=True)

# ── Ambil API Key dari .env (BUKAN GOOGLE_API_KEY sistem) ────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# ── Validasi API Key ──────────────────────────────────────────────────────────
if not GEMINI_API_KEY or GEMINI_API_KEY.strip() in ["", "YOUR_GEMINI_API_KEY_HERE"]:
    print("=" * 60)
    print("[SETUP REQUIRED] GEMINI_API_KEY belum dikonfigurasi!")
    print("  1. Buka: https://aistudio.google.com/apikey")
    print("  2. Buat API Key baru")
    print("  3. Salin backend/.env.example -> backend/.env")
    print("  4. Isi GEMINI_API_KEY=<key_anda> di file .env")
    print("  5. Restart backend (python app.py)")
    print("=" * 60)
    GEMINI_API_KEY = None
else:
    print(f"[Gemini] API Key loaded: {GEMINI_API_KEY[:15]}...")

# ── Hapus GOOGLE_API_KEY sistem agar tidak konflik ───────────────────────────
# SDK google-genai otomatis membaca GOOGLE_API_KEY dari sistem env.
# Karena kita ingin pakai GEMINI_API_KEY dari .env, key sistem harus dihapus.
_old_google_key = os.environ.pop("GOOGLE_API_KEY", None)
if _old_google_key:
    print("[Gemini] GOOGLE_API_KEY sistem dinonaktifkan untuk mencegah konflik.")

# ── Inisialisasi Client ───────────────────────────────────────────────────────
_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Urutan model fallback (dari paling diutamakan ke backup)
GEMINI_MODELS = [
    "models/gemini-2.5-flash",      # Utama - terbukti berhasil
    "models/gemini-2.0-flash",      # Backup pertama
    "models/gemini-2.0-flash-lite", # Backup ringan
]

def generate_gemini(system_prompt: str, user_prompt: str) -> str:
    """
    Wrapper untuk memanggil Gemini API.
    - API Key selalu dibaca dari .env (GEMINI_API_KEY)
    - Fallback otomatis ke model berikutnya jika rate limited
    - Return "TIDAK" jika semua model gagal (agar pipeline tetap berjalan)

    Setup jika belum ada API Key:
      Lihat instruksi di bagian atas file ini atau di backend/.env.example
    """
    if not _client:
        print("[Gemini] Client tidak terinisialisasi. Cek GEMINI_API_KEY di .env")
        return "TIDAK"

    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    for model_name in GEMINI_MODELS:
        max_retries = 2
        for attempt in range(max_retries):
            try:
                response = _client.models.generate_content(
                    model=model_name,
                    contents=full_prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=2048,
                    )
                )

                if response and response.text:
                    return response.text.strip()

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    if attempt < max_retries - 1:
                        print(f"[Gemini] Model {model_name} rate limited, retry {attempt+1}/{max_retries-1} dalam 5 detik...")
                        time.sleep(5)
                        continue
                    else:
                        print(f"[Gemini] Model {model_name} rate limited, mencoba model berikutnya...")
                        break
                elif "404" in err_str or "not found" in err_str.lower():
                    print(f"[Gemini] Model {model_name} tidak tersedia, mencoba model berikutnya...")
                    break
                elif "400" in err_str and "expired" in err_str.lower():
                    print(f"[Gemini] API Key expired! Buat key baru di: https://aistudio.google.com/apikey")
                    return "TIDAK"
                elif "400" in err_str and "invalid" in err_str.lower():
                    print(f"[Gemini] API Key tidak valid! Periksa GEMINI_API_KEY di file .env")
                    return "TIDAK"
                else:
                    print(f"[Gemini] Error pada {model_name}: {err_str[:150]}")
                    break

    print("[Gemini] Semua model gagal. Pastikan GEMINI_API_KEY di .env sudah benar.")
    return "TIDAK"
