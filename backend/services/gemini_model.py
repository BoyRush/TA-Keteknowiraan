"""
services/gemini_model.py
=========================================================
Wrapper untuk Gemini API menggunakan SDK terbaru google-genai
Model: gemini-2.0-flash (gratis, dengan fallback)

CATATAN PENTING:
  SDK google-genai otomatis membaca GOOGLE_API_KEY dari sistem.
  Agar .env kita yang dipakai, kita hapus GOOGLE_API_KEY dari env
  sementara dan pass GEMINI_API_KEY secara eksplisit ke Client().
"""
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

# Override WAJIB: baca .env, paksa override system env
load_dotenv(override=True)

# Ambil GEMINI_API_KEY dari .env (bukan GOOGLE_API_KEY sistem)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY tidak ditemukan di .env!")
else:
    print(f"[Gemini] API Key loaded: {GEMINI_API_KEY[:15]}...")

# KRITIS: Hapus GOOGLE_API_KEY dari environment sementara
# agar SDK google-genai tidak menggunakannya secara otomatis
_old_google_key = os.environ.pop("GOOGLE_API_KEY", None)
if _old_google_key:
    print("[Gemini] GOOGLE_API_KEY sistem dinonaktifkan untuk mencegah konflik API key.")

# Inisialisasi client dengan API key eksplisit dari .env
_client = genai.Client(api_key=GEMINI_API_KEY)

# Urutan model fallback (dari paling diutamakan ke backup)
GEMINI_MODELS = [
    "gemini-2.5-flash",       # Free: 20 RPD
    "gemini-2.5-flash-lite",  # Free: free tier
    "gemini-flash-latest",    # Alias terbaru
    "gemini-2.0-flash",       # Free: tergantung project quota
    "gemini-2.0-flash-lite",  # Free: tergantung project quota
]

def generate_gemini(system_prompt: str, user_prompt: str) -> str:
    """
    Fungsi wrapper untuk memanggil Gemini API.
    Menggunakan google-genai SDK v2 dengan fallback antar model.
    API key selalu dari .env (GEMINI_API_KEY), bukan system GOOGLE_API_KEY.
    """
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    for model_name in GEMINI_MODELS:
        try:
            response = _client.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=512,
                )
            )

            if response and response.text:
                return response.text.strip()

        except Exception as e:
            err_str = str(e)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                print(f"[Gemini] Model {model_name} rate limited, mencoba model berikutnya...")
                continue
            elif "404" in err_str or "not found" in err_str.lower():
                print(f"[Gemini] Model {model_name} tidak tersedia, mencoba model berikutnya...")
                continue
            else:
                print(f"[Gemini] Error pada {model_name}: {err_str[:200]}")
                continue

    print("[Gemini] Semua model gagal dipanggil.")
    return "TIDAK"
