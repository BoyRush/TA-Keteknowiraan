import json
from langchain.prompts import PromptTemplate
from services.qwen_model import generate_qwen
import time
from prompts.herbal_prompt import SAFETY_PROMPT, RELEVANCE_PROMPT, REASONER_PROMPT

def extract_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()
    return text

def normalize_llm_output(parsed):
    if isinstance(parsed, list):
        return {"rekomendasi": parsed}
    if isinstance(parsed, dict) and "rekomendasi" in parsed:
        return parsed
    return {"rekomendasi": []}

def validate_recommendation(parsed, safe_herbs):
    allowed = {h["id"]: h["nama"] for h in safe_herbs}
    valid = []

    for r in parsed.get("rekomendasi", []):
        rid = r.get("id")
        if rid in allowed and isinstance(r.get("alasan"), str):
            valid.append({
                "id": rid,
                "nama": allowed[rid],
                "alasan": r["alasan"]
            })
    return valid

def expand_query_internal(keluhan: str) -> str:
    """Menggunakan LLM untuk mencari istilah medis/sinonim secara dinamis"""
    expansion_prompt = f"Ubah keluhan '{keluhan}' menjadi 3-4 kata kunci medis/sinonim dipisahkan koma. Hanya kata kunci."
    
    # Kita panggil generate_qwen dengan prompt singkat
    expanded = generate_qwen(
        system_prompt="Anda adalah kamus medis cerdas.",
        user_prompt=expansion_prompt
    )
    # Bersihkan jika ada teks tambahan dari AI
    return f"{keluhan}, {expanded.strip()}"

def is_medical_clash(kondisi_pasien, kontraindikasi):

    if not kontraindikasi or str(kontraindikasi).lower() in ["tidak ada", "-", "none"]:
        return False

    k1 = kondisi_pasien.lower().strip()
    k2 = kontraindikasi.lower().strip()

    # 1️⃣ Exact match
    if k1 == k2:
        return True

    # 2️⃣ Embedding similarity
    sim = get_similarity(k1, k2)

    if sim > 0.80:   # threshold bentrok
        return True
    if sim < 0.40:   # jelas tidak mirip
        return False

    # 3️⃣ Ambiguous → tanya AI
    prompt = f"Istilah 1: {kondisi_pasien}\nIstilah 2: {kontraindikasi}"
    jawaban = generate_qwen(SAFETY_PROMPT, prompt).upper()

    return "YA" in jawaban

def is_medical_relevant(keluhan, indikasi):
    if not indikasi or str(indikasi).lower() in ["tidak ada", "-", "none"]:
        return False

    prompt = f"Istilah 1: {keluhan}\nIstilah 2: {indikasi}"

    jawaban = generate_qwen(RELEVANCE_PROMPT, prompt).upper()
    return "YA" in jawaban  # YA = cocok

import json
from langchain.prompts import PromptTemplate
from services.qwen_model import generate_qwen
from prompts.herbal_prompt import REASONER_PROMPT

def generate_herbal_recommendation(llm_input):
    try:
        patient_context = llm_input.get("patient_context", {})
        safe_herbs = llm_input.get("safe_herbs", []) # Hasil pencarian ChromaDB

        keluhan = patient_context.get("keluhan", "Umum")
        # Pastikan riwayat medis jadi string untuk prompt
        riwayat_medis = patient_context.get("kondisi_medis", [])
        if isinstance(riwayat_medis, list):
            riwayat_medis_str = ", ".join(riwayat_medis)
        else:
            riwayat_medis_str = str(riwayat_medis)

        print("\n === ANALISIS HYBRID DIMULAI ===")

        final_rekomendasi = []

        for herb in safe_herbs:
            nama_herb = herb.get("nama") or herb.get("name") or "Herbal Tanpa Nama"
            indikasi = herb.get("indikasi", "").lower()
            kontra = herb.get("kontraindikasi", "").lower()
            deskripsi = herb.get("deskripsi") or ""

            print(f"\n🔍 Mengecek Herbal: {nama_herb}")

            # ==========================================================
            # 1️⃣ RULE-BASED SAFETY CHECK (Anti-Halu Keamanan)
            # ==========================================================
            
            # A. Cek Kontraindikasi vs Riwayat Medis (Blockchain)
            is_bahaya = False
            for kondisi in riwayat_medis:
                if kondisi.lower().strip() in kontra:
                    print(f"BLOKIR: Bentrok dengan riwayat {kondisi}")
                    is_bahaya = True
                    break
            if is_bahaya: continue

            # B. Cek Kontraindikasi vs Keluhan Saat Ini
            if keluhan.lower().strip() in kontra:
                print(f"BLOKIR: Kontraindikasi dengan keluhan {keluhan}")
                continue

            # ==========================================================
            # 2️⃣ RELEVANCE CHECK (Anti-Nggak Nyambung)
            # ==========================================================
    
            
            if keluhan.lower().strip() not in indikasi:
                print(f"SKIP: Tidak relevan. Keluhan '{keluhan}' tidak ditemukan di indikasi herbal.")
                continue

            # ==========================================================
            # 3️⃣ REASONING BY FINETUNED AI (Hanya jika lolos semua)
            # ==========================================================
            print("LOLOS SEMUA FILTER: Meminta AI merangkai penjelasan...")

            prompt_template = PromptTemplate.from_template(REASONER_PROMPT)
            user_prompt = prompt_template.format(
                nama_herbal=nama_herb,
                keluhan_pasien=keluhan,
                riwayat_medis=riwayat_medis_str,
                deskripsi_herbal=deskripsi
            )

            alasan_ai = generate_qwen(
                system_prompt="Anda adalah pakar herbal cerdas.",
                user_prompt=user_prompt
            )

            final_rekomendasi.append({
                "id": herb.get("id"),
                "nama": nama_herb,
                "alasan": alasan_ai.strip(),
                "cara_penggunaan": herb.get("cara_penggunaan") or "Gunakan sesuai petunjuk umum."
            })

        return {
            "status": "success",
            "rekomendasi": final_rekomendasi,
            "catatan": "Rekomendasi ini telah diverifikasi secara otomatis terhadap riwayat medis Anda."
        }

    except Exception as e:
        print(f"ERROR GENERATOR: {str(e)}")
        return {"error": str(e)}, 500