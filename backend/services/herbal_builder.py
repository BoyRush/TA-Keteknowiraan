def build_herbs(result):
    herbs = []

    if result.get("documents") and result["documents"][0]:
        for i in range(len(result["documents"][0])):
            herbs.append({
                "id": result["ids"][0][i],
                "name": result["metadatas"][0][i].get("name"),
                "indikasi": result["metadatas"][0][i].get("indikasi"),
                "kontraindikasi": result["metadatas"][0][i].get("kontraindikasi", ""),
                "deskripsi": result["documents"][0][i]
            })

    return herbs
