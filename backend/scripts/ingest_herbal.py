from chroma.herbal_store import add_herbal

herbal_data = [
    {
        "id": "herbal-1",
        "text": "Jahe merah digunakan untuk meningkatkan imunitas dan mengatasi masuk angin",
        "metadata": {
            "name": "Jahe Merah",
            "indikasi": "masuk angin, imunitas",
            "kontraindikasi": "hipertensi",
            "interaksi": "obat pengencer darah"
        }
    },
    {
        "id": "herbal-2",
        "text": "Kunyit memiliki efek anti inflamasi dan baik untuk pencernaan",
        "metadata": {
            "name": "Kunyit",
            "indikasi": "pencernaan, anti inflamasi",
            "kontraindikasi": "maag",
            "interaksi": ""
        }
    }
]

for item in herbal_data:
    add_herbal(
        doc_id=item["id"],
        text=item["text"],
        metadata=item["metadata"]
    )

print("✅ Data herbal berhasil di-ingest ke Chroma")
