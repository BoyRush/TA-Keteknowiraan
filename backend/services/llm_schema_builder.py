def build_llm_input(query, medical_conditions, herbs):
    return {
        "patient_context": {
            "keluhan": query,
            "kondisi_medis": medical_conditions
        },
        "safe_herbs": [
            {
                "id": h["id"],
                "nama": h["nama"],
                "indikasi": h.get("indikasi"),
                "deskripsi": h.get("deskripsi")
            }
            for h in herbs
        ]
    }
