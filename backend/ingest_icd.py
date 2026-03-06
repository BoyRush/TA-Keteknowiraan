import pandas as pd
from chromadb.utils import embedding_functions
import chromadb
import os

def proses_ke_chroma(file_excel):
    client = chromadb.PersistentClient(path="./db_icd10")
    model_ai = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2",
    )
    
    collection = client.get_or_create_collection(
        name="master_icd10_v2", 
        embedding_function=model_ai
    )

    print(f"Sedang membaca file: {file_excel}... mohon tunggu.")
    
    # Membaca excel
    df = pd.read_excel(file_excel)
    
    df.columns = df.columns.astype(str).str.strip()
    
    print("Kolom yang ditemukan di Excel:", df.columns.tolist())

    # Cek apakah kolom yang dibutuhkan ada
    if 'MENAMPILKAN' not in df.columns or 'KODE' not in df.columns:
        print("WAJIB: Pastikan di Excel ada judul kolom 'KODE' dan 'MENAMPILKAN' di baris paling atas!")
        return

    documents = df['MENAMPILKAN'].astype(str).tolist()
    ids = [str(i) for i in range(len(documents))]    
    kode_list = df['KODE'].astype(str).tolist()
    versi_list = df['VERSI'].astype(str).tolist() if 'VERSI' in df.columns else ["1"] * len(ids)

    metadatas = []
    for i in range(len(documents)):
          metadatas.append({
              "kode": kode_list[i], 
              "versi": versi_list[i]
          })

    batch_size = 100 
    total_data = len(documents)
    
    print(f"Memulai input {total_data} data ke ChromaDB...")
    
    for i in range(0, total_data, batch_size):
        end = i + batch_size
        collection.upsert(
            documents=documents[i:end],
            metadatas=metadatas[i:end],
            ids=ids[i:end]
        )
        print(f"Berhasil memproses: {min(end, total_data)} / {total_data}")

    print("--- SELESAI! Data ICD-10 sudah masuk ---")

if __name__ == "__main__":
    nama_file = "data_icd10.xlsx" 
    if os.path.exists(nama_file):
        proses_ke_chroma(nama_file)
    else:
        print(f"File {nama_file} tidak ditemukan!")