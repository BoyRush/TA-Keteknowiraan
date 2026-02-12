import json
from langchain.prompts import PromptTemplate
from prompts.herbal_prompt import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from services.qwen_model import generate_qwen

# 🔧 BERSIHKAN ```json ... ```
def extract_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()
    return text

# 🔧 NORMALISASI OUTPUT LLM
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
        # Pastikan ID herbal yang disarankan AI ada dalam daftar "Safe Herbs" kita
        if rid in allowed and isinstance(r.get("alasan"), str):
            valid.append({
                "id": rid,
                "nama": allowed[rid],
                "alasan": r["alasan"]
            })
    return valid

# 🧠 GENERATOR UTAMA
def generate_herbal_recommendation(llm_input):
    prompt = PromptTemplate(
        input_variables=["patient_context", "safe_herbs"],
        template=USER_PROMPT_TEMPLATE
    )

    user_prompt = prompt.format(
        patient_context=llm_input["patient_context"],
        safe_herbs=llm_input["safe_herbs"]
    )

    # Memanggil model AI
    raw_response = generate_qwen(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt
    )

    # Membersihkan dan parsing JSON
    cleaned = extract_json(raw_response)
    try:
        parsed = json.loads(cleaned)
    except Exception as e:
        parsed = {}

    parsed = normalize_llm_output(parsed)
    validated = validate_recommendation(parsed, llm_input["safe_herbs"])

    # --- SATUKAN SEMUA LOG DALAM SATU BLOK BERSIH (Hanya muncul sekali) ---
    print("\n" + "="*50)
    print("🤖 AI GENERATION SUMMARY")
    print(f"Keluhan: {llm_input['patient_context'].get('keluhan')}")
    print(f"Herbal Masuk: {[h['nama'] for h in llm_input['safe_herbs']]}")
    print(f"Rekomendasi Terpilih: {[v['nama'] for v in validated]}")
    print("="*50 + "\n")

    return {
        "patient_context": llm_input["patient_context"],
        "rekomendasi": validated,
        "catatan": (
            "Tidak ditemukan herbal yang aman dan relevan berdasarkan kondisi medis pasien."
            if not validated else None
        )
    }