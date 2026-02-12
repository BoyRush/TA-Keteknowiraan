def filter_herbs_by_medical_condition(herbs, medical_conditions):
    if not medical_conditions:
        return herbs

    medical_conditions = [c.lower().strip() for c in medical_conditions]
    filtered = []

    for herb in herbs:
        # Ambil kontraindikasi dan pastikan dalam lowercase
        kontra_raw = herb.get("kontraindikasi", "").lower()
        
        is_safe = True
        for cond in medical_conditions:
            # Cek apakah kondisi medis ada di dalam string kontraindikasi
            if cond in kontra_raw: 
                is_safe = False
                print(f"❌ FILTERED: {herb.get('nama')} karena kontraindikasi: {cond}")
                break
        
        if is_safe:
            filtered.append(herb)

    return filtered