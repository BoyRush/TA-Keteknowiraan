def filter_herbs_by_medical_condition(herbs, patient_conditions, user_query):
    """
    herbs: List herbal hasil RAG
    patient_conditions: List riwayat dari Blockchain (ICD-10 labels)
    user_query: Teks keluhan pasien saat ini (ICD-10 label dari dropdown)
    """
    safe_herbs = []
    
    for herb in herbs:
        is_safe = True
        # Ambil metadata kontraindikasi dari ChromaDB
        pantangan = herb.get('kontraindikasi', "").lower()
        nama_herbal = herb.get('nama')

        # --- RULE 1: CEK RIWAYAT MEDIS (BLOCKCHAIN) ---
        for condition in patient_conditions:
            if condition.lower().strip() in pantangan:
                print(f"❌ BLOKIR KRITIS: {nama_herbal} dilarang karena riwayat {condition}")
                is_safe = False
                break
        
        if not is_safe: continue

        # --- RULE 2: CEK KELUHAN SAAT INI (USER INPUT) ---
        if user_query.lower().strip() in pantangan:
            print(f"⚠️ BLOKIR KELUHAN: {nama_herbal} kontra dengan keluhan saat ini ({user_query})")
            is_safe = False
            continue

        # --- RULE 3: CEK RELEVANSI (EMBEDDING / EXACT MATCH) ---
        indikasi = herb.get('indikasi', "").lower()
        if user_query.lower().strip() not in indikasi:
            print(f"ℹ️ INFO: {nama_herbal} mungkin kurang relevan, tapi lanjut ke evaluasi AI.")

        if is_safe:
            safe_herbs.append(herb)
            
    return safe_herbs