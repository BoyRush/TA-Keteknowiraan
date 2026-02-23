from chroma.herbal_store import search_herbal

def retrieve_relevant_herbs(query, k=5):
    result = search_herbal(query, n_results=k)
    herbs = []

    if result["documents"] and result["documents"][0]:
        for i in range(len(result["documents"][0])):
            distance = result["distances"][0][i]
            nama = result["metadatas"][0][i].get("name")
            indikasi = result["metadatas"][0][i].get("indikasi", "").lower()
            
            # --- STRATEGI BARU ---
            # Kita tidak pakai keyword matching lagi supaya tidak kaku.
            # Kita loloskan semua yang jarak vektornya masuk akal (di bawah 0.65).
            # Angka 0.65 dipilih agar Jahe (0.59) bisa masuk, tapi yang ngawur terbuang.
            
            if distance < 0.65: 
                herbs.append({
                    "id": result["ids"][0][i],
                    "nama": nama,
                    "indikasi": indikasi,
                    "kontraindikasi": result["metadatas"][0][i].get("kontraindikasi"),
                    "deskripsi": result["documents"][0][i],
                    "distance": distance
                })
                print(f"✅ PASSED TO AI: {nama} ({distance})")
            else:
                print(f"❌ REJECTED BY RAG: {nama} ({distance})")

    return herbs