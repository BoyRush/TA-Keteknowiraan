"""
services/gemini_model.py
========================
Wrapper untuk Google Gemini API menggunakan SDK resmi terbaru: google-genai.

Package : google-genai  (bukan google-generativeai yang sudah deprecated)
Model   : gemini-2.0-flash-lite (paling hemat quota, cocok free tier)
Limit   : 30 RPM, 1.500 RPD (Free Tier)
Docs    : https://ai.google.dev/gemini-api/docs/quickstart?lang=python
"""

import os
import time

# ─── PENTING: Override env sistem dengan .env kita ────────────────────────────
# Windows System Environment mungkin punya GOOGLE_API_KEY atau GEMINI_API_KEY
# lama yang menimpa nilai dari .env. Hapus keduanya, lalu load .env dengan
# override=True agar nilai di file .env selalu digunakan.
os.environ.pop("GOOGLE_API_KEY", None)
os.environ.pop("GEMINI_API_KEY", None)

from google import genai
from google.genai import types
from dotenv import load_dotenv

# override=True → nilai .env SELALU menang vs system environment
load_dotenv(override=True)

# ─── Konfigurasi Gemini ───────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
# Model pilihan: gemini-2.0-flash-lite (hemat quota, cocok free tier)
GEMINI_MODEL   = "gemini-2.5-flash"   # Tested & working dengan free tier key ini

if not GEMINI_API_KEY:
    raise EnvironmentError(
        "[GeminiModel] GEMINI_API_KEY tidak ditemukan di .env! "
        "Dapatkan kunci gratis di https://aistudio.google.com/app/apikey"
    )

# Inisialisasi client (SDK baru: google.genai)
_client = genai.Client(api_key=GEMINI_API_KEY)

# Konfigurasi generasi — deterministik untuk keputusan medis
_generation_config = types.GenerateContentConfig(
    temperature=0.2,          # Rendah = deterministik, penting untuk konteks medis
    top_p=0.9,
    max_output_tokens=1024,
    safety_settings=[
        types.SafetySetting(
            category="HARM_CATEGORY_HARASSMENT",
            threshold="BLOCK_NONE"
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_HATE_SPEECH",
            threshold="BLOCK_NONE"
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold="BLOCK_NONE"
        ),
        types.SafetySetting(
            category="HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold="BLOCK_NONE"
        ),
    ]
)


def generate_gemini(system_prompt: str, user_prompt: str, retries: int = 3) -> str:
    """
    Memanggil Gemini API dengan system + user prompt.

    Args:
        system_prompt : Instruksi peran / konteks sistem AI
        user_prompt   : Input spesifik dari user / data herbal
        retries       : Jumlah percobaan ulang jika rate-limit (default 3)

    Returns:
        str: Teks jawaban Gemini, sudah di-strip whitespace
    """
    # Gabungkan system + user prompt dalam satu teks
    full_prompt = f"[INSTRUKSI SISTEM]\n{system_prompt.strip()}\n\n[INPUT]\n{user_prompt.strip()}"

    for attempt in range(1, retries + 1):
        try:
            print(f"\n{'='*40}")
            print(f"[GEMINI] Berpikir... (attempt {attempt}/{retries})")

            response = _client.models.generate_content(
                model=GEMINI_MODEL,
                contents=full_prompt,
                config=_generation_config
            )

            result = response.text.strip()

            print(f"[GEMINI] OK: '{result[:80]}{'...' if len(result) > 80 else ''}'")          
            print("="*40)

            return result

        except Exception as e:
            err_msg = str(e)
            print(f"[GEMINI] Error attempt {attempt}/{retries}: {err_msg}")

            # Rate limit -> tunggu sebelum retry
            if "429" in err_msg or "quota" in err_msg.lower() or "rate" in err_msg.lower():
                wait = 5 * attempt   # 5s, 10s, 15s
                print(f"[GEMINI] Rate limit, menunggu {wait}s...")
                time.sleep(wait)
            elif attempt == retries:
                print(f"[GEMINI] Semua {retries} percobaan gagal.")
                return "TIDAK"   # fallback aman untuk keputusan medis
            else:
                time.sleep(2)

    return "TIDAK"
