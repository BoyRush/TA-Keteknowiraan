"""
services/llm_generator.py
=========================================================
Orchestrator utama pipeline rekomendasi herbal SmartHerbal.
Menggunakan Gemini API dengan fallback string-matching untuk ketahanan.
"""
import json
import re
import traceback
import time
from services.gemini_model import generate_gemini
from prompts.herbal_prompt import (
    SAFETY_PROMPT, RELEVANCE_PROMPT,
    EVALUATE_HERB_PROMPT, EXPLANATION_PROMPT, NON_RAG_PROMPT
)

def _clean_ai_text(text: str) -> str:
    """Hapus format markdown dari output AI agar tampil bersih di frontend."""
    # Hapus bold/italic: **teks** atau *teks*
    text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)
    # Hapus heading: ## atau ###
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    # Rapikan spasi ganda
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# =============================================================
# KAMUS SINONIM: Untuk fallback string-matching ketika AI gagal
# =============================================================
SINONIM_MEDIS = {
    "hipertensi": ["hipertensi", "tekanan darah tinggi", "darah tinggi", "hypertension", "htn"],
    "diabetes": ["diabetes", "kencing manis", "gula darah tinggi", "dm", "diabetes mellitus", "hiperglikemia"],
    "gagal ginjal": ["gagal ginjal", "ginjal", "renal failure", "ckd", "penyakit ginjal"],
    "hepatitis": ["hepatitis", "liver", "hati", "hati meradang"],
    "ibu hamil": ["hamil", "kehamilan", "pregnant", "ibu hamil", "gestasi"],
    "anak-anak": ["anak", "bayi", "balita", "anak-anak", "pediatric"],
    "pendarahan": ["pendarahan", "bleeding", "antikoagulan", "pengencer darah"],
    "alergi": ["alergi", "hipersensitif", "reaksi alergi"],
    "maag": ["maag", "gastritis", "asam lambung", "gerd", "ulkus lambung"],
    "asma": ["asma", "asthma", "sesak napas", "bronkospasme"],
}

def _sinonim_match(term1: str, term2: str) -> bool:
    """
    Cek apakah dua istilah medis adalah sinonim menggunakan kamus lokal.
    Fallback ketika AI tidak tersedia.
    """
    t1 = term1.lower().strip()
    t2 = term2.lower().strip()

    if t1 == t2:
        return True
    if t1 in t2 or t2 in t1:
        return True

    # Cek kamus sinonim
    for key, variants in SINONIM_MEDIS.items():
        in_t1 = any(v in t1 for v in variants)
        in_t2 = any(v in t2 for v in variants)
        if in_t1 and in_t2:
            return True

    return False

def is_medical_clash(kondisi_pasien: str, kontraindikasi: str) -> bool:
    """
    Cek apakah kondisi pasien berbenturan dengan kontraindikasi herbal.
    Strategi: String matching dulu → AI konfirmasi jika ambigu.
    """
    if not kontraindikasi or str(kontraindikasi).lower().strip() in ["tidak ada", "-", "none", ""]:
        return False

    k1 = kondisi_pasien.lower().strip()
    k2 = kontraindikasi.lower().strip()

    # Langkah 1: String matching langsung
    if _sinonim_match(k1, k2):
        print(f"  [CLASH-MATCH] '{kondisi_pasien}' bentrok dengan '{kontraindikasi}'")
        return True

    # Langkah 2: AI untuk kasus ambigu
    try:
        prompt = f"Istilah 1: {kondisi_pasien}\nIstilah 2: {kontraindikasi}"
        jawaban = generate_gemini(SAFETY_PROMPT, prompt).upper().strip()
        if "YA" in jawaban and "TIDAK" not in jawaban:
            print(f"  [CLASH-AI] '{kondisi_pasien}' bentrok dengan '{kontraindikasi}'")
            return True
    except Exception as e:
        print(f"  [CLASH] AI gagal, pakai string match result: {e}")

    return False

def is_medical_relevant(keluhan: str, indikasi: str) -> bool:
    """
    Cek apakah keluhan pasien relevan dengan indikasi herbal.
    """
    if not indikasi or str(indikasi).lower().strip() in ["tidak ada", "-", "none", ""]:
        return False

    k1 = keluhan.lower().strip()
    k2 = indikasi.lower().strip()

    if _sinonim_match(k1, k2):
        return True

    try:
        prompt = f"Istilah 1: {keluhan}\nIstilah 2: {indikasi}"
        jawaban = generate_gemini(RELEVANCE_PROMPT, prompt).upper().strip()
        return "YA" in jawaban and "TIDAK" not in jawaban
    except Exception:
        return False

def extract_medical_keywords(keluhan: str) -> list:
    """
    Ekstrak 4-6 kata kunci medis dari keluhan pasien.
    Mengenali bahwa keluhan bisa berupa ciri-ciri penyakit.
    """
    prompt = f"""Ekstrak 4-6 kata kunci medis paling penting dari keluhan berikut.
Perhatikan bahwa keluhan bisa berupa ciri-ciri penyakit (bukan nama penyakitnya langsung).
Contoh: "sering haus, buang air kecil banyak, lemas" → keywords: diabetes, gula darah, hiperglikemia, polidipsia

Keluhan: {keluhan}

Jawab hanya daftar kata kunci, dipisah koma. Tanpa penjelasan."""

    try:
        result = generate_gemini(
            system_prompt="You are a medical keyword extractor. Identify the underlying medical condition from symptoms.",
            user_prompt=prompt
        )
        text = result.strip()
        # Bersihkan dari karakter non-alfanumerik
        text = re.sub(r"[^a-zA-Z0-9, \-]", "", text.lower())
        keywords = [k.strip() for k in text.split(",") if k.strip() and len(k.strip()) > 2]
        
        # Cegah string "tidak" masuk sebagai keyword jika API sedang rate limited
        if len(keywords) == 1 and keywords[0].lower() == "tidak":
            keywords = []
            
        print(f"[KEYWORDS] {keywords}")
        return keywords[:6]
    except Exception as e:
        print(f"[KEYWORDS] Gagal ekstrak keyword: {e}")
        return []

def evaluate_herb(patient_context: dict, herb: dict, keywords: list = None) -> tuple:
    """
    Evaluasi apakah herbal layak diberikan ke pasien.
    Menggunakan Gemini dengan fallback logika string-matching.
    """
    nama = herb.get("nama") or herb.get("name") or "Herbal"
    indikasi = str(herb.get("indikasi", "")).lower()
    kontra = str(herb.get("kontraindikasi", "")).lower()

    keluhan = patient_context.get("keluhan", "")
    riwayat = patient_context.get("kondisi_medis", [])

    riwayat_str = ", ".join(riwayat) if riwayat else "Tidak ada"
    keyword_str = ", ".join(keywords) if keywords else "Tidak ada"

    # ── FALLBACK AWAL: String matching untuk kontraindikasi ──
    # Ini memastikan keputusan tetap berjalan meski Gemini gagal
    for kondisi in riwayat:
        if _sinonim_match(kondisi, kontra):
            alasan = f"Herbal ini dikontraindikasikan untuk pasien dengan kondisi {kondisi}."
            print(f"  [FALLBACK] {nama} DITOLAK karena kontraindikasi '{kondisi}' match dengan '{kontra}'")
            return "TIDAK", alasan

    # ── CALL AI untuk evaluasi lengkap ──
    prompt = EVALUATE_HERB_PROMPT.format(
        keluhan=keluhan,
        keyword_str=keyword_str,
        riwayat_str=riwayat_str,
        nama=nama,
        indikasi=indikasi,
        kontra=kontra
    )

    try:
        response = generate_gemini(
            system_prompt="Medical Decision Engine",
            user_prompt=prompt
        ).strip()
        
        response = _clean_ai_text(response)

        keputusan = "TIDAK"
        analisis = "Tidak sesuai dengan kondisi medis atau keluhan pasien."

        for line in response.split("\n"):
            line = line.strip()
            if "Keputusan:" in line:
                val = line.split("Keputusan:")[-1].strip().upper()
                if "YA" in val:
                    keputusan = "YA"
                else:
                    keputusan = "TIDAK"
            if "Analisis:" in line:
                analisis = line.split("Analisis:")[-1].strip()

        print(f"  [AI] {nama}: {keputusan} — {analisis[:60]}...")
        return keputusan, analisis

    except Exception as e:
        print(f"  [EVAL] AI gagal untuk {nama}: {e}")
        # Fallback: cek relevansi manual
        for kw in (keywords or []):
            if _sinonim_match(kw, indikasi):
                return "YA", f"{nama} relevan berdasarkan kecocokan kata kunci dengan indikasi."
        return "TIDAK", "Tidak dapat mengevaluasi relevansi herbal saat ini."

def generate_explanation(nama: str, keluhan: str, indikasi: str) -> str:
    """Generate penjelasan manfaat herbal untuk pasien."""
    prompt = EXPLANATION_PROMPT.format(nama=nama, keluhan=keluhan, indikasi=indikasi)
    try:
        return _clean_ai_text(generate_gemini("Herbal Expert", prompt))
    except Exception:
        return f"{nama} memiliki indikasi untuk {indikasi} yang relevan dengan keluhan Anda. Konsultasikan dengan dokter untuk dosis yang tepat."

def generate_herbal_recommendation(llm_input: dict):
    """
    Orchestrator utama pipeline rekomendasi herbal.
    """
    try:
        mode_ui = llm_input.get("mode", "RAG")
        patient_context = llm_input.get("patient_context", {})
        keluhan = patient_context.get("keluhan", "Umum")
        riwayat_medis = patient_context.get("kondisi_medis", [])

        # ── JALUR A: NON-RAG ──
        if "NON-RAG" in mode_ui.upper():
            print(" [MODE NON-RAG] AI Berpikir Tanpa Database...")
            return _jalankan_non_rag(keluhan, riwayat_medis, patient_context)

        # ── JALUR B: RAG ──
        print(" [MODE RAG] Memulai Proses Database Pakar...")

        all_candidates = llm_input.get("safe_herbs", [])
        keywords = extract_medical_keywords(keluhan)

        if not all_candidates:
            print("[RAG ERROR] Tidak ada kandidat herbal dari database.")
            return {
                "status": "warning",
                "rekomendasi": [{
                    "nama": "Data Tidak Ditemukan",
                    "status": "warning",
                    "alasan": f"Tidak ada data herbal yang relevan dengan keluhan '{keluhan}'."
                }]
            }

        # ── EVALUASI TIAP HERBAL ──
        final_rekomendasi = []
        for herb in all_candidates:
            # Jeda 4 detik untuk mencegah Rate Limit Gemini Free Tier (15 RPM)
            time.sleep(4.0)
            nama = herb.get("nama") or herb.get("name") or "Herbal"
            print(f"\n--- Evaluasi: {nama} ---")
            keputusan, analisis = evaluate_herb(patient_context, herb, keywords)

            if keputusan == "YA":
                penjelasan = generate_explanation(nama, keluhan, herb.get("indikasi", ""))
                final_rekomendasi.append({
                    "id": herb.get("id"),
                    "nama": nama,
                    "status": "success",
                    "alasan": penjelasan
                })
            else:
                final_rekomendasi.append({
                    "id": herb.get("id"),
                    "nama": nama,
                    "status": "danger",
                    "alasan": analisis or "Tidak sesuai dengan kondisi medis atau keluhan pasien."
                })

        return {"status": "success", "rekomendasi": final_rekomendasi}

    except Exception as e:
        print(f"[ERROR LLM_GENERATOR]: {str(e)}")
        print(traceback.format_exc())
        return {"error": str(e)}, 500

def _jalankan_non_rag(keluhan: str, riwayat_medis: list, patient_context: dict) -> dict:
    """Logika generative tanpa database lokal."""
    riwayat_medis_str = ", ".join(riwayat_medis) if riwayat_medis else "Tidak ada riwayat medis"
    umur = patient_context.get("umur", "tidak diketahui")

    prompt = NON_RAG_PROMPT.format(
        keluhan=keluhan,
        riwayat_medis_str=riwayat_medis_str,
        umur=umur
    )

    try:
        alasan_umum = _clean_ai_text(generate_gemini("AI Kesehatan Umum", prompt))
    except Exception:
        alasan_umum = f"Untuk keluhan '{keluhan}', disarankan konsultasi dengan dokter atau apoteker untuk mendapatkan saran herbal yang tepat dan aman."

    return {
        "status": "warning",
        "rekomendasi": [{
            "nama": "Saran AI (Pengetahuan Umum)",
            "alasan": alasan_umum,
            "status": "warning"
        }]
    }
