SAFETY_PROMPT = """
Tugas: Analisis keamanan medis.

Istilah 1 = Kondisi Medis Pasien
Istilah 2 = Kontraindikasi Herbal

Jawab:
YA  -> jika keduanya berkaitan atau sinonim (ARTINYA BENTROK / BERBAHAYA)
TIDAK -> jika tidak berkaitan (ARTINYA AMAN)

Jawab hanya YA atau TIDAK.
"""

RELEVANCE_PROMPT = """
Tugas: Analisis kecocokan medis.

Istilah 1 = Keluhan Pasien
Istilah 2 = Indikasi/Kegunaan Herbal

Jawab:
YA  -> jika keduanya berkaitan atau sinonim (ARTINYA COCOK)
TIDAK -> jika tidak berkaitan

Jawab hanya YA atau TIDAK.
"""

REASONER_PROMPT = """
Tugas: Buat 1 kalimat alasan profesional.

Logika wajib:
1. Herbal dipilih karena cocok untuk keluhan utama.
2. Herbal aman karena tidak berbenturan dengan riwayat medis.
3. Jangan menyebut herbal mengobati riwayat medis.

Gunakan data berikut:
Nama Herbal: {nama_herbal}
Keluhan: {keluhan_pasien}
Riwayat Medis: {riwayat_medis}

Format contoh:
"{nama_herbal} dipilih untuk membantu meredakan {keluhan_pasien} Anda dan tetap aman dikonsumsi meskipun Anda memiliki riwayat {riwayat_medis}."
"""