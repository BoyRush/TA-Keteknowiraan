import os
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "chroma_db"))

embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)


chroma_client = chromadb.PersistentClient(
    path=CHROMA_DIR
)

collection = chroma_client.get_or_create_collection(
    name="herbal_collection",
    embedding_function=embedding_function
)

# def add_herbal(doc_id, text, metadata=None):
#     collection.add(
#         ids=[doc_id],
#         documents=[text],
#         metadatas=[metadata or {}]
#     )

# Di file herbal_store.py
def add_herbal(name, indikasi, kontraindikasi, cid, content):
    # Buat ID unik otomatis
    doc_id = f"herb_{name.lower().replace(' ', '_')}"
    
    # Gabungkan semua info untuk pencarian AI
    full_text = f"Herbal: {name}. Kegunaan: {indikasi}. Deskripsi: {content}"
    
    collection.add(
        ids=[doc_id],
        documents=[full_text],
        metadatas=[{
            "name": name,
            "indikasi": indikasi,
            "kontraindikasi": kontraindikasi,
            "ipfs_cid": cid  # CID IPFS tersimpan di sini
        }]
    )

def search_herbal(query, n_results=3):
    # 1. Kita ambil dulu angka embedding-nya secara manual untuk di-print
    query_embeddings = embedding_function([query])
    
    print("\n" + "="*50)
    print(f"🔍 KELUHAN PASIEN: '{query}'")
    print(f"🧬 ANGKA EMBEDDING (Hanya 10 angka pertama dari 384):")
    # Kita hanya print 10 angka pertama agar terminal tidak penuh
    print(query_embeddings[0][:10]) 
    print(f"... (total ada {len(query_embeddings[0])} angka dalam vektor ini)")
    print("="*50 + "\n")

    # 2. Proses pencarian seperti biasa
    return collection.query(
        query_texts=[query],
        n_results=n_results
    )
def count_herbal():
    return collection.count()

