from chroma.herbal_store import search_herbal

def retrieve_relevant_herbs(query, k=5):
    result = search_herbal(query, n_results=k)
    herbs = []

    print("\n--- 🔍 DEBUG RETRIEVER: MEMBEDAH DATA CHROMADB ---")
    
    if result["documents"] and result["documents"][0]:
        for i in range(len(result["documents"][0])):
            distance = result["distances"][0][i]
            metadata = result["metadatas"][0][i]
            doc_id = result["ids"][0][i]
            content = result["documents"][0][i]

            print(f"ID: {doc_id}")
            print(f"Keys yang tersedia di Metadata: {list(metadata.keys())}")
            print(f"Isi Metadata Lengkap: {metadata}")

            nama_final = metadata.get("nama") or metadata.get("name") or metadata.get("nama_tanaman") or "Tanaman Tanpa Nama"

            herbs.append({
                "id": doc_id,
                "nama": nama_final, # Kita simpan dengan key 'nama' yang seragam
                "indikasi": metadata.get("indikasi", ""),
                "kontraindikasi": metadata.get("kontraindikasi", ""),
                "deskripsi": content,
                "distance": distance
            })
            
            print(f"HASIL EKSTRAKSI: Nama={nama_final}, Indikasi={metadata.get('indikasi')}")
            print("-" * 30)

    else:
        print("ChromaDB tidak menemukan dokumen apapun.")

    print("--- 🔍 DEBUG SELESAI ---\n")
    return herbs