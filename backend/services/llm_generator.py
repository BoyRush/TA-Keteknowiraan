"""
services/llm_generator.py
==========================
Mesin rekomendasi herbal berbasis AI.

MIGRASI: HPC Remote (Qwen 7B via Ngrok)  →  Gemini API (lokal, gratis)
Model  : gemini-1.5-flash via google-generativeai
Pola   : RAG + Rule-based Safety Filter + LLM Evaluation

Pipeline per request:
  1. extract_medical_keywords()  — ekstrak 4-6 keyword medis dari keluhan
  2. evaluate_herb()             — evaluasi setiap herbal: YA/TIDAK
  3. generate_explanation()      — buat penjelasan manfaat 3 kalimat
"""

import re
from services.gemini_model import generate_gemini
from prompts.herbal_prompt import SAFETY_PROMPT, RELEVANCE_PROMPT, EVALUATE_HERB_PROMPT, NON_RAG_PROMPT


# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Ekstraksi Keyword Medis
# ─────────────────────────────────────────────────────────────────────────────

def extract_medical_keywords(keluhan: str) -> list:
    """
    Menggunakan Gemini untuk mengekstrak 4-6 kata kunci medis paling relevan
    dari keluhan pasien.

    Returns:
        list[str]: Daftar keyword, maks 6 item
    """
    prompt = f"""Ekstrak 4-6 kata kunci medis paling penting dari keluhan berikut.
Prioritaskan gejala utama dan sinonim medis jika memungkinkan.

Keluhan: {keluhan}

Jawab HANYA daftar kata kunci dipisah koma, tanpa kalimat tambahan.
Contoh output: pusing, mual, tekanan darah tinggi, hipertensi"""

    system = "Kamu adalah ekstractor kata kunci medis. Jawab hanya kata kunci, dipisah koma."

    text = generate_gemini(system, prompt)

    # Bersihkan: hanya huruf/angka/spasi/koma/tanda hubung
    text = re.sub(r"[^a-zA-Z0-9, \-]", "", text.lower())
    keywords = [k.strip() for k in text.split(",") if k.strip() and len(k.strip()) > 2]

    print(f"[KEYWORDS] {keywords[:6]}")
    return keywords[:6]


# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Evaluasi Per Herbal
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_herb(patient_context: dict, herb: dict, keywords: list = None) -> tuple:
    """
    Mengevaluasi apakah satu herbal boleh direkomendasikan ke pasien.

    Returns:
        tuple: (keputusan: "YA"|"TIDAK", analisis: str)
    """
    nama        = herb.get("nama", "Herbal")
    indikasi    = herb.get("indikasi", "")
    kontra      = herb.get("kontraindikasi", "")
    keluhan     = patient_context.get("keluhan", "")
    riwayat     = patient_context.get("kondisi_medis", [])
    riwayat_str = ", ".join(riwayat) if riwayat else "Tidak ada"
    keyword_str = ", ".join(keywords) if keywords else "Tidak ada"

    user_prompt = f"""DATA PASIEN:
- Keluhan Utama : {keluhan}
- Keyword Medis : {keyword_str}
- Riwayat Medis : {riwayat_str}

DATA HERBAL:
- Nama           : {nama}
- Indikasi       : {indikasi}
- Kontraindikasi : {kontra}"""

    response = generate_gemini(EVALUATE_HERB_PROMPT, user_prompt)

    keputusan = "TIDAK"
    analisis  = ""

    for line in response.split("\n"):
        line = line.strip()
        if "Keputusan:" in line:
            raw = line.split("Keputusan:")[-1].strip().upper()
            keputusan = "YA" if "YA" in raw else "TIDAK"
        if "Analisis:" in line:
            analisis = line.split("Analisis:")[-1].strip()

    # Fallback: jika tidak ada format yang tepat, cek apakah ada YA di seluruh response
    if keputusan == "TIDAK" and "YA" in response.upper().split():
        keputusan = "YA"

    return keputusan, analisis


# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Penjelasan Manfaat
# ─────────────────────────────────────────────────────────────────────────────

def generate_explanation(nama: str, keluhan: str, indikasi: str) -> str:
    """
    Menghasilkan penjelasan manfaat herbal yang sudah dievaluasi sebagai YA.
    Output: paragraf singkat 3 kalimat dalam Bahasa Indonesia.
    """
    system = "Kamu adalah pakar herbal Indonesia yang menjelaskan manfaat tanaman obat secara medis dan praktis."

    user_prompt = f"""Jelaskan manfaat herbal berikut untuk keluhan pasien secara singkat dan padat.

Nama Herbal : {nama}
Keluhan     : {keluhan}
Indikasi    : {indikasi}

ATURAN:
- Fokus hanya ke keluhan pasien
- Maksimal 3 kalimat yang padat dan jelas
- Sertakan cara olah/konsumsi singkat di kalimat terakhir
- Gunakan bahasa Indonesia yang mudah dipahami pasien awam
- Jangan tambahkan disclaimer "konsultasikan ke dokter" — cukup fakta manfaat

Output: paragraf langsung tanpa bullet point"""

    return generate_gemini(system, user_prompt)


# ─────────────────────────────────────────────────────────────────────────────
# ORCHESTRATOR UTAMA
# ─────────────────────────────────────────────────────────────────────────────

def generate_herbal_recommendation(llm_input: dict) -> dict:
    """
    Fungsi utama yang dipanggil oleh app.py di endpoint /herbal/search.

    Signature tidak berubah dari versi HPC — app.py tidak perlu dimodifikasi.

    Args:
        llm_input: {
            "mode"           : "RAG (Terverifikasi Database)" | "Non-RAG (Pengetahuan Umum AI)",
            "patient_context": {"keluhan": str, "kondisi_medis": list[str]},
            "safe_herbs"     : [{"nama": str, "indikasi": str, "kontraindikasi": str, ...}]
        }

    Returns:
        dict: {
            "status"      : "success" | "warning",
            "rekomendasi" : [{"nama": str, "status": "success"|"danger"|"warning", "alasan": str}]
        }
    """
    try:
        mode_ui         = llm_input.get("mode", "RAG")
        patient_context = llm_input.get("patient_context", {})
        keluhan         = patient_context.get("keluhan", "Umum")
        riwayat_medis   = patient_context.get("kondisi_medis", [])

        # ── JALUR NON-RAG ──────────────────────────────────────────────────
        if "NON" in mode_ui.upper() or "NON-RAG" in mode_ui.upper():
            print("[MODE NON-RAG] Gemini berpikir tanpa database...")
            return _jalankan_non_rag(keluhan, riwayat_medis, patient_context)

        # ── JALUR RAG ──────────────────────────────────────────────────────
        print("[MODE RAG] Memulai evaluasi database herbal via Gemini...")

        safe_herbs = llm_input.get("safe_herbs", [])

        if not safe_herbs:
            print("[RAG] Tidak ada herbal yang lolos filter keamanan.")
            return {
                "status": "warning",
                "rekomendasi": [{
                    "nama"  : "Data Tidak Ditemukan",
                    "status": "warning",
                    "alasan": (
                        f"Maaf, tidak ada data herbal di database pakar yang relevan "
                        f"dengan keluhan '{keluhan}'. Coba gunakan kata kunci lain."
                    )
                }]
            }

        # Ekstrak keyword medis dari keluhan (satu kali untuk semua herbal)
        keywords = extract_medical_keywords(keluhan)

        final_rekomendasi = []

        for herb in safe_herbs:
            nama = herb.get("nama", "Herbal")
            print(f"[Evaluasi RAG] {nama}")

            keputusan, analisis = evaluate_herb(patient_context, herb, keywords)

            if keputusan == "YA":
                penjelasan = generate_explanation(
                    nama, keluhan, herb.get("indikasi", "")
                )
                final_rekomendasi.append({
                    "id"    : herb.get("id"),
                    "nama"  : nama,
                    "status": "success",
                    "alasan": penjelasan
                })
            else:
                final_rekomendasi.append({
                    "id"    : herb.get("id"),
                    "nama"  : nama,
                    "status": "danger",
                    "alasan": analisis or f"{nama} tidak direkomendasikan berdasarkan evaluasi medis AI."
                })

        return {"status": "success", "rekomendasi": final_rekomendasi}

    except Exception as e:
        import traceback
        print(f"[ERROR CRITICAL llm_generator]: {str(e)}")
        print(traceback.format_exc())
        return {
            "status": "error",
            "rekomendasi": [{
                "nama"  : "Error Sistem",
                "status": "danger",
                "alasan": f"Terjadi kesalahan pada AI: {str(e)}"
            }]
        }


# ─────────────────────────────────────────────────────────────────────────────
# FUNGSI PEMBANTU: Jalur Non-RAG
# ─────────────────────────────────────────────────────────────────────────────

def _jalankan_non_rag(keluhan: str, riwayat_medis: list, patient_context: dict) -> dict:
    """
    Jalur Non-RAG: Gemini menjawab berdasarkan pengetahuan umumnya
    tanpa merujuk database herbal lokal.
    """
    riwayat_str = ", ".join(riwayat_medis) if riwayat_medis else "Tidak ada riwayat medis"
    umur        = patient_context.get("umur", "tidak diketahui")

    user_prompt = f"""INFORMASI PASIEN:
- Keluhan       : {keluhan}
- Riwayat Medis : {riwayat_str}
- Umur          : {umur}"""

    alasan = generate_gemini(NON_RAG_PROMPT, user_prompt)

    return {
        "status": "warning",
        "rekomendasi": [{
            "nama"  : "Saran AI (Pengetahuan Umum)",
            "alasan": alasan,
            "status": "warning"
        }]
    }
