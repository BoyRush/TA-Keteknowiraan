"""
rules/medical_rules.py
=========================================================
Filter keamanan herbal berdasarkan riwayat medis pasien.
Menggunakan string-matching sebagai PRIMARY check (cepat & andal),
dan AI sebagai SECONDARY check (untuk kasus ambigu).
"""
from services.llm_generator import is_medical_clash

def filter_herbs_by_medical_condition(herbs: list, patient_conditions: list, user_query: str) -> list:
    """
    Saring herbal yang AMAN untuk pasien berdasarkan riwayat medis dan keluhan saat ini.

    Args:
        herbs: List herbal hasil ChromaDB retrieval
        patient_conditions: List riwayat medis pasien dari database
        user_query: Keluhan pasien saat ini (digunakan sebagai konteks, bukan filter ketat)

    Returns:
        List herbal yang lolos safety filter
    """
    if not patient_conditions:
        # Jika tidak ada riwayat medis, semua herbal dianggap aman
        print(f"  ℹ️ [SAFETY] Tidak ada riwayat medis → semua {len(herbs)} herbal lolos")
        return herbs

    safe_herbs = []

    for herb in herbs:
        nama_herbal = herb.get("nama") or herb.get("name") or "Unknown"
        pantangan = str(herb.get("kontraindikasi", "")).lower().strip()

        # Jika tidak ada kontraindikasi, langsung lolos
        if not pantangan or pantangan in ["tidak ada", "-", "none", ""]:
            safe_herbs.append(herb)
            continue

        is_safe = True

        # Cek setiap kondisi medis pasien terhadap kontraindikasi herbal
        for condition in patient_conditions:
            if not condition:
                continue

            if is_medical_clash(condition, pantangan):
                print(f"  ❌ [SAFETY BLOCK] {nama_herbal} DITOLAK: '{condition}' bentrok dengan kontraindikasi '{pantangan}'")
                is_safe = False
                break

        if is_safe:
            safe_herbs.append(herb)
            print(f"  ✅ [SAFETY PASS] {nama_herbal} lolos safety filter")

    print(f"\n  📊 Safety Filter: {len(safe_herbs)}/{len(herbs)} herbal lolos\n")
    return safe_herbs