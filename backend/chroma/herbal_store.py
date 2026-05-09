import os
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from datetime import datetime


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "chroma_db"))

embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="intfloat/multilingual-e5-large"
)

chroma_client = chromadb.PersistentClient(
    path=CHROMA_DIR
)

collection = chroma_client.get_or_create_collection(
    name="herbal_collection",
    embedding_function=embedding_function
)


# ========================================================
# HERBAL CRUD (Web2 - MySQL ID-based, No IPFS/Blockchain)
# ========================================================

def add_herbal(record_id: int, name: str, indikasi: str, kontraindikasi: str, content: str, doctor_id: int) -> str:
    """
    Menyimpan data herbal sebagai embedding vector ke ChromaDB.
    Menggunakan MySQL record_id sebagai anchor key (bukan IPFS CID atau wallet address).
    
    Returns: chroma_doc_id yang disimpan kembali ke MySQL (herbal_catalogs.chroma_doc_id)
    """
    doc_id = f"herb_{record_id}"

    full_text_for_embedding = (
        f"Herbal: {name}. "
        f"Kegunaan dan Indikasi: {indikasi}. "
        f"Peringatan/Kontraindikasi: {kontraindikasi}. "
        f"Penjelasan: {content or ''}"
    )

    print("\n" + "="*50)
    print(f"📤 MENAMBAH KE CHROMADB: {doc_id}")
    print(full_text_for_embedding[:200])
    print("="*50 + "\n")

    # Jika doc_id sudah ada (update scenario), hapus dulu
    try:
        existing = collection.get(ids=[doc_id])
        if existing and existing.get("ids"):
            collection.delete(ids=[doc_id])
    except Exception:
        pass

    collection.add(
        ids=[doc_id],
        documents=[full_text_for_embedding],
        metadatas=[{
            "record_id": record_id,
            "nama": name,
            "indikasi": indikasi,
            "kontraindikasi": kontraindikasi,
            "deskripsi": content or "",
            "doctor_id": doctor_id,
            "is_active": True,
            "timestamp": datetime.now().isoformat()
        }]
    )

    print(f"✅ [ChromaDB] Herbal '{name}' (ID: {doc_id}) berhasil disimpan.")
    return doc_id


def update_herbal(record_id: int, name: str, indikasi: str, kontraindikasi: str, content: str, doctor_id: int) -> str:
    """
    Memperbarui embedding herbal di ChromaDB.
    Menghapus vektor lama dan menambahkan yang baru dengan data terbaru.
    
    Returns: chroma_doc_id yang sama (herb_{record_id})
    """
    doc_id = f"herb_{record_id}"

    full_text_for_embedding = (
        f"Herbal: {name}. "
        f"Kegunaan dan Indikasi: {indikasi}. "
        f"Peringatan/Kontraindikasi: {kontraindikasi}. "
        f"Penjelasan: {content or ''}"
    )

    print("\n" + "="*50)
    print(f"♻️ MEMPERBARUI CHROMADB: {doc_id}")
    print(full_text_for_embedding[:200])
    print("="*50 + "\n")

    # Hapus dokumen lama
    try:
        collection.delete(ids=[doc_id])
    except Exception as e:
        print(f"⚠️ Tidak ditemukan dokumen lama untuk dihapus: {e}")

    # Tambahkan versi baru
    collection.add(
        ids=[doc_id],
        documents=[full_text_for_embedding],
        metadatas=[{
            "record_id": record_id,
            "nama": name,
            "indikasi": indikasi,
            "kontraindikasi": kontraindikasi,
            "deskripsi": content or "",
            "doctor_id": doctor_id,
            "is_active": True,
            "timestamp": datetime.now().isoformat()
        }]
    )

    print(f"✅ [ChromaDB] Herbal '{name}' (ID: {doc_id}) berhasil diperbarui.")
    return doc_id


def delete_herbal(record_id: int):
    """
    Menghapus embedding herbal dari ChromaDB.
    Dipanggil saat Dokter Herbal melakukan soft-delete (is_active=FALSE di MySQL).
    Ini memastikan AI tidak lagi merekomendasikan herbal yang sudah dinonaktifkan.
    """
    doc_id = f"herb_{record_id}"
    try:
        collection.delete(ids=[doc_id])
        print(f"🗑️ [ChromaDB] Herbal (ID: {doc_id}) berhasil dihapus dari vektor.")
    except Exception as e:
        print(f"⚠️ [ChromaDB] Gagal menghapus {doc_id}: {e}")


def search_herbal(query: str, n_results: int = 3) -> dict:
    """
    Mencari herbal yang relevan dengan keluhan pasien menggunakan Semantic Search.
    Otomatis menangani kasus koleksi kosong.
    """
    count = collection.count()
    if count == 0:
        return {
            "documents": [[]],
            "metadatas": [[]],
            "ids": [[]],
            "distances": [[]]
        }

    actual_n = min(n_results, count)

    print("\n" + "="*50)
    print(f"🔍 SEMANTIC SEARCH: '{query}'")
    print(f"Koleksi ChromaDB memiliki {count} dokumen herbal.")
    print("="*50 + "\n")

    return collection.query(
        query_texts=[query],
        n_results=actual_n,
    )


def count_herbal() -> int:
    """Mengembalikan jumlah herbal aktif di ChromaDB."""
    return collection.count()
