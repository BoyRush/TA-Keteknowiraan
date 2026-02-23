def build_llm_input(query, medical_conditions, herbs):
    # Instruksi tambahan agar AI berani bilang "Tidak Ada"
    instruction = (
        f"Anda adalah sistem pakar herbal. Pasien mengeluh: '{query}'.\n"
        "TUGAS ANDA:\n"
        "1. Bandingkan indikasi herbal dengan keluhan pasien secara anatomi dan medis.\n"
        "2. Jika indikasi herbal (contoh: sakit kepala) TIDAK BERHUBUNGAN dengan keluhan (contoh: sakit kaki), "
        "maka herbal tersebut DILARANG dimasukkan ke dalam 'rekomendasi_terpilih'.\n"
        "3. JANGAN MEMAKSA memberikan rekomendasi jika tidak ada yang benar-benar cocok.\n"
        "4. Jika semua herbal tidak cocok, kembalikan JSON dengan 'rekomendasi_terpilih': []."
    )

    return {
        "instruction": instruction,
        "patient_context": {
            "keluhan": query,
            "kondisi_medis": list(set(medical_conditions)) # Gunakan set agar tidak duplikat (jantung, jantung, dll)
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