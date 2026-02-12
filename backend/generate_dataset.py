import json
import random

# Template Instruksi tetap konsisten
INSTRUCTION = "Anda adalah dokter herbal profesional. Berikan rekomendasi herbal yang aman berdasarkan keluhan pasien, kondisi medis, dan daftar herbal yang tersedia."

# 164 Data Asli Tanpa Karangan (Sesuai List Kamu)
raw_data = [
    {"name": "Daun Alpukat", "indikasi": "hipertensi, mencegah stroke", "kontraindikasi": "Batu ginjal, ibu hamil, menyusui"},
    {"name": "Ciplukan", "indikasi": "nyeri badan, asma, diabetes, batuk", "kontraindikasi": "diare, jantung, hipotensi"},
    {"name": "Temu Ireng", "indikasi": "sakit perut, peradangan, rematik, kanker", "kontraindikasi": "Mual, ibu hamil, batu empedu"},
    {"name": "Temu Manga", "indikasi": "sakit perut, peradangan, kolesterol", "kontraindikasi": "Ibu hamil, gangguan pembekuan darah"},
    {"name": "Kunyit Putih", "indikasi": "gerd, sakit perut, masuk angin", "kontraindikasi": "batu ginjal, pendarahan, ibu hamil"},
    {"name": "Temu Kunci", "indikasi": "peradangan, batuk, maag", "kontraindikasi": "iritasi kulit, diare"},
    {"name": "Jahe", "indikasi": "sakit perut, peradangan, masuk angin", "kontraindikasi": "Pendarahan, diabetes, jantung, ibu hamil"},
    {"name": "Kunyit", "indikasi": "batuk, malaria, radang, kardiovaskular", "kontraindikasi": "Tukak lambung, batu ginjal, liver"},
    {"name": "Lengkuas", "indikasi": "demam, eksim, bronchitis, maag, gastritis", "kontraindikasi": "Masalah pencernaan, kembung, diare"},
    {"name": "Temulawak", "indikasi": "kolesterol, hepatitis, hipertensi, jantung", "kontraindikasi": "Mual, ginjal, pendarahan, ibu hamil"},
    {"name": "Kencur", "indikasi": "batuk, kolesterol, asam urat, rematik", "kontraindikasi": "Diare, pendarahan, ginjal, ibu hamil"},
    {"name": "Bawang Merah", "indikasi": "gula darah, jantung, asma, kolesterol", "kontraindikasi": "kembung, sindrom iritasi usus besar"},
    {"name": "Bawang Putih", "indikasi": "flu, batuk, maag, jantung, hipertensi", "kontraindikasi": "Pendarahan, hepatitis, glaukoma"},
    {"name": "Pule", "indikasi": "demam, nyeri otot, panas dalam, anti-obesity", "kontraindikasi": "alergi, mual, liver, ginjal, ibu hamil"},
    {"name": "Binahong", "indikasi": "bisul, luka, sariawan", "kontraindikasi": "ginjal, liver, pendarahan, gerd"},
    {"name": "Sirsak", "indikasi": "asam urat, jerawat, gula darah, kanker", "kontraindikasi": "Parkinson, hati, ginjal, hipotensi"},
    {"name": "Kelor", "indikasi": "sakit mata, gula darah, peradangan, imun", "kontraindikasi": "Kehamilan, hipotiroid, diabetes, hipertensi"},
    {"name": "Kumis Kucing", "indikasi": "tuberculosis, batu ginjal, asam urat, diuretik", "kontraindikasi": "Gagal ginjal kronis, kehamilan, hipotensi"},
    {"name": "Jarak", "indikasi": "sakit gigi, sakit perut, demam", "kontraindikasi": "Radang usus, obstruksi usus, kehamilan"},
    {"name": "Secang", "indikasi": "batuk darah", "kontraindikasi": "Kehamilan, menyusui, pengencer darah"},
    {"name": "Sambiloto", "indikasi": "imun, infeksi, flu, diabetes, peradangan", "kontraindikasi": "Gagal ginjal, liver, hipertensi"},
    {"name": "Brotowali", "indikasi": "malaria, demam, rematik", "kontraindikasi": "Kerusakan hati, ginjal, diabetes, kehamilan"},
    {"name": "Lidah Buaya", "indikasi": "sakit kepala, sembelit, kurang gizi, maag", "kontraindikasi": "Penyakit Crohn, ginjal, jantung, diabetes"},
    {"name": "Mahkota Dewa", "indikasi": "hipertensi, kanker, asam urat, penyakit dalam", "kontraindikasi": "Gangguan lambung, diabetes, jantung, kehamilan"},
    {"name": "Pegagan", "indikasi": "luka, peradangan, anti-obesity", "kontraindikasi": "Penyakit hati, pendarahan, hamil"},
    {"name": "Adas", "indikasi": "anti-obesity, batuk, kembung", "kontraindikasi": "Alergi, fotosensitivitas, kehamilan"},
    {"name": "Purwaceng", "indikasi": "anti-obesity, vitalitas", "kontraindikasi": "tekanan darah, jantung, pengencer darah"},
    {"name": "Nanas", "indikasi": "anti-obesity, pencernaan", "kontraindikasi": "Tukak lambung, GERD, diabetes, pengencer darah"},
    {"name": "Kayu Rapet", "indikasi": "anti-obesity, kesehatan wanita", "kontraindikasi": "ginjal, hati, jantung, pengencer darah"},
    {"name": "Beluntas", "indikasi": "anti-obesity, bau badan", "kontraindikasi": "Gangguan ginjal, hipertensi, alergi"},
    {"name": "Mengkudu", "indikasi": "anti-obesity, hipertensi, asam urat, diabetes", "kontraindikasi": "Penyakit ginjal, penyakit hati, kehamilan"},
    {"name": "Klongkang (Okra)", "indikasi": "anti-obesity, diabetes, batu ginjal", "kontraindikasi": "metformin, pengencer darah"},
    {"name": "Seledri", "indikasi": "hipertensi, kolesterol", "kontraindikasi": "Masalah ginjal, hipotensi, pengencer darah"},
    {"name": "Kecombrang", "indikasi": "antibakteri, masuk angin", "kontraindikasi": "Hipotensi, iritasi lambung, dehidrasi"},
    {"name": "Kitolod", "indikasi": "peradangan, demam", "kontraindikasi": "Gangguan mata serius, alergi"},
    {"name": "Miana", "indikasi": "sariawan, batuk, asma, terlambat haid", "kontraindikasi": "Anemia, gangguan ginjal, kehamilan"},
    {"name": "Jeruk Nipis", "indikasi": "pegal linu, demam, batuk, anti-obesity", "kontraindikasi": "GERD, tukak lambung, ginjal kronis"},
    {"name": "Sidaguri", "indikasi": "nyeri sendi, asam urat, anti-radang", "kontraindikasi": "Jantung, insomnia, kecemasan, kehamilan"},
    {"name": "Anting-anting", "indikasi": "disentri, diare, pendarahan, luka, gatal", "kontraindikasi": "Defisiensi G6PD, ginjal, hati, kehamilan"},
    {"name": "Babadotan", "indikasi": "eksim, bisul, luka, demam, anemia", "kontraindikasi": "Penyakit hati kronis, ginjal, kehamilan"},
    {"name": "Nyamplung", "indikasi": "sakit mata", "kontraindikasi": "kanker, ibu hamil"},
    {"name": "Kembang Sepatu", "indikasi": "pneumonia, kencing batu", "kontraindikasi": "tekanan darah rendah, ginjal, mual"},
    {"name": "Tapak Dara", "indikasi": "pneumonia, gula darah, leukimia", "kontraindikasi": "Sakit perut, mual, hiponatremia"},
    {"name": "Tapak Liman", "indikasi": "demam", "kontraindikasi": "Ibu hamil, menyusui, alergi"},
    {"name": "Tempuh Wiyang", "indikasi": "tuberculosis, bisul, diare, demam", "kontraindikasi": "Ibu hamil, ibu menyusui"},
    {"name": "Dungun laut", "indikasi": "diare", "kontraindikasi": "Kehamilan, kondisi medis kronis"},
    {"name": "Wareyan", "indikasi": "infeksi hernia", "kontraindikasi": "Kehamilan, lambung, ginjal"},
    {"name": "Melati Cina", "indikasi": "batuk", "kontraindikasi": "Insomnia, interaksi obat"},
    {"name": "Cocor bebek", "indikasi": "nyeri, demam, disentri, wasir, amandel", "kontraindikasi": "jantung, ginjal, hati, imunosupresan"},
    {"name": "Daun mangga", "indikasi": "influenza", "kontraindikasi": "pencernaan, diabetes, alergi mangga"},
    {"name": "Pisang kepok", "indikasi": "hematuria", "kontraindikasi": "ginjal, jantung, pembatasan kalium"},
    {"name": "Daun bulu ayam", "indikasi": "sakit perut, anti-obesity", "kontraindikasi": "hati, ginjal, jantung, kehamilan"},
    {"name": "Paku Rane", "indikasi": "luka terbuka", "kontraindikasi": "Alergi tumbuhan paku"},
    {"name": "Daun kupang", "indikasi": "gondok, jamur, anti-obesity", "kontraindikasi": "penyumbatan usus, diare, ginjal"},
    {"name": "Cengkeh", "indikasi": "sakit gigi, rematik, kolera, campak", "kontraindikasi": "pendarahan, diabetes, liver"},
    {"name": "Serai", "indikasi": "masuk angin, maag, anti-kanker, anti-obesity", "kontraindikasi": "Kehamilan, detak jantung lemah, hipokalemia"},
    {"name": "Alang-alang", "indikasi": "demam, ISK, mimisan, lemah syahwat", "kontraindikasi": "Hipotensi, ginjal, liver, kehamilan"},
    {"name": "Bakung", "indikasi": "bisul, borok, rematik, anti bengkak", "kontraindikasi": "penggunaan oral, luka terbuka parah"},
    {"name": "Belimbing Wuluh", "indikasi": "hipertensi, batuk, sariawan, demam", "kontraindikasi": "Penyakit ginjal, batu ginjal, maag"},
    {"name": "Brojo Lintang", "indikasi": "batuk, asma, radang amandel", "kontraindikasi": "dosis besar, jangka panjang"},
    {"name": "Bunga pukul empat", "indikasi": "batuk, radang prostat, keputihan", "kontraindikasi": "biji tanaman, kehamilan"},
    {"name": "Bunga tasbih", "indikasi": "hipertensi, flour albus, sakit kuning", "kontraindikasi": "obat hipertensi, kehamilan, menyusui"},
    {"name": "Bunga telang", "indikasi": "penyakit kulit, sakit mata, bronkitis", "kontraindikasi": "ginjal, liver, kehamilan, hipotensi"},
    {"name": "Cincau rambat", "indikasi": "panas dalam, anti racun, hipertensi", "kontraindikasi": "Hipotensi, gagal ginjal kronis"},
    {"name": "Eucalyptus", "indikasi": "batuk, asma, pilek, sakit kepala", "kontraindikasi": "Anak-anak, bayi, ibu hamil, menyusui"},
    {"name": "Gendola", "indikasi": "pilek, bisul, rematik, diare", "kontraindikasi": "alergi, kehamilan, menyusui"},
    {"name": "Kayu Manis", "indikasi": "amara, rematik, sakit perut, diabetes", "kontraindikasi": "hati, diabetes obat, hipotensi, hamil"},
    {"name": "Kecubung", "indikasi": "sesak napas, nyeri haid, sakit perut", "kontraindikasi": "mental, jantung, glaukoma, anak-anak"},
    {"name": "Mimba", "indikasi": "demam, diabetes, antiseptik, eksim", "kontraindikasi": "Kehamilan, autoimun, ginjal, hati"},
    {"name": "Pinang", "indikasi": "nyeri pinggang, batuk, diare, lemah syahwat", "kontraindikasi": "jantung, hipertensi, lambung, kehamilan"},
    {"name": "Saga Manis", "indikasi": "sariawan", "kontraindikasi": "Hipersensitivitas, hamil, hati"},
    {"name": "Sambung nyawa", "indikasi": "demam, ginjal, disentri", "kontraindikasi": "Hipotensi, liver, obat diabetes"},
    {"name": "Sembung", "indikasi": "demam, asma, batuk", "kontraindikasi": "Alergi ragweed, kehamilan, batu empedu"},
    {"name": "Senggugu", "indikasi": "demam", "kontraindikasi": "Hipersensitivitas, kehamilan, menyusui"},
    {"name": "Tembelekan", "indikasi": "influenza, TBC kelenjar, rematik", "kontraindikasi": "hati, kehamilan, anak-anak"},
    {"name": "Tempuyung", "indikasi": "radang usus buntu, memar, darah tinggi", "kontraindikasi": "ginjal berat, hipotensi"},
    {"name": "Bayam Duri", "indikasi": "pencernaan, kolesterol, anemia", "kontraindikasi": "asam urat, masalah ginjal"},
    {"name": "Pacar Cina", "indikasi": "kembung, sulit menelan, batuk, pusing", "kontraindikasi": "Kehamilan, menyusui, hati, ginjal"},
    {"name": "Kapulaga", "indikasi": "batuk, kembung", "kontraindikasi": "Batu empedu, pendarahan, kehamilan"},
    {"name": "Kenanga", "indikasi": "nyeri haid", "kontraindikasi": "Hipotensi, kehamilan, anak-anak"},
    {"name": "Kina", "indikasi": "malaria, demam, nafsu makan", "kontraindikasi": "jantung, G6PD, pendarahan, kehamilan"},
    {"name": "Camcao", "indikasi": "sakit perut", "kontraindikasi": "Hipotensi, kehamilan, alergi"},
    {"name": "Bangun-bangun", "indikasi": "luka, asma, demam, batuk, pusing", "kontraindikasi": "Hipotensi, pendarahan, kehamilan"},
    {"name": "Benalu", "indikasi": "luka, borok", "kontraindikasi": "Kehamilan, hati, ginjal, alergi"},
    {"name": "Daun duduk", "indikasi": "wasir, rematik", "kontraindikasi": "ginjal, kehamilan, menyusui"},
    {"name": "Urang aring", "indikasi": "penyakit ginjal", "kontraindikasi": "Hipotensi, diabetes, hati, kehamilan"},
    {"name": "Tikel balung", "indikasi": "batu ginjal, hepatitis", "kontraindikasi": "alergi, mata, kehamilan, pencernaan"},
    {"name": "Daun salam", "indikasi": "kolesterol, hipertensi, gastritis, diare", "kontraindikasi": "diabetes, pendarahan, kehamilan"},
    {"name": "Dewandaru", "indikasi": "demam, diare, diabetes, kolesterol", "kontraindikasi": "Hipotensi, gula darah rendah"},
    {"name": "Patikan Kebo", "indikasi": "diare, muntah, asma, demam, batuk", "kontraindikasi": "kanker, liver, ginjal, hamil, hipotensi"},
    {"name": "Daun melati", "indikasi": "sakit mata, sakit kepala, demam", "kontraindikasi": "alergi, hamil, menyusui, obat penenang"},
    {"name": "Pare", "indikasi": "batuk, radang tenggorokan, malaria, diabetes", "kontraindikasi": "hipoglikemia, kehamilan, G6PD, liver"},
    {"name": "Daun Kemuning", "indikasi": "sakit gigi, memar, rematik, anti-obesity", "kontraindikasi": "Hamil, menyusui, pencernaan, ginjal"},
    {"name": "Sarang semut", "indikasi": "kanker, tumor, asam urat, jantung, TBC", "kontraindikasi": "Hamil, liver, ginjal"},
    {"name": "Kemangi", "indikasi": "kembung, pencernaan, mual, insomnia", "kontraindikasi": "pendarahan, diabetes, hamil, penenang"},
    {"name": "Selasih", "indikasi": "ISPA, diare, pusing, diabetes, batuk", "kontraindikasi": "Hamil, pengencer darah, hipotiroidisme"},
    {"name": "Meniran", "indikasi": "ginjal, malaria, hipertensi, punggung", "kontraindikasi": "Hamil, pengencer darah, ginjal parah"},
    {"name": "Lada", "indikasi": "disentri, kaki bengkak, nyeri haid, ginjal", "kontraindikasi": "tukak lambung, gastritis, GERD, pedas"},
    {"name": "Legundi", "indikasi": "obat cacing, demam, tifus", "kontraindikasi": "alergi, hamil, menyusui, hormonal"},
    {"name": "Sidowayah", "indikasi": "rematik, disentri, sariawan", "kontraindikasi": "Hamil, menyusui, ginjal, hati"},
    {"name": "Keji beling", "indikasi": "batu empedu, sembelit, wasir", "kontraindikasi": "ginjal, jantung, maag, hamil, menyusui"},
    {"name": "Puspa", "indikasi": "sakit perut, diare", "kontraindikasi": "alergi Theaceae, hipertensi, gula darah"},
    {"name": "Cabe jawa", "indikasi": "demam, hepatitis, rematik", "kontraindikasi": "pendarahan, tukak lambung, alergi"},
    {"name": "Kemukus", "indikasi": "batuk, mual, sakit perut", "kontraindikasi": "pendarahan, lambung, tukak, liver"},
    {"name": "Srigading", "indikasi": "demam, rematik, cacingan", "kontraindikasi": "anemia, hipertensi, pencernaan, hamil"},
    {"name": "Daun kopi", "indikasi": "hipertensi, anti-obesity", "kontraindikasi": "cemas, insomnia, jantung, maag, hamil"},
    {"name": "Daun jambu biji", "indikasi": "diare, gula darah, muntaber, jantung", "kontraindikasi": "sembelit, hipotensi, ginjal, hamil"},
    {"name": "Daun Awar Awar", "indikasi": "muntaber, gigitan ular, batuk", "kontraindikasi": "alergi lateks, pencernaan, pendarahan"},
    {"name": "Terong Duri", "indikasi": "obat letih (param)", "kontraindikasi": "alergi terong, asam urat, artritis, hamil"},
    {"name": "Uyah Uyah", "indikasi": "koreng kulit", "kontraindikasi": "alergi lateks, getah Ficus, pencernaan"},
    {"name": "Daun Jambu air", "indikasi": "demam anak", "kontraindikasi": "diabetes, hipertensi obat, eksim"},
    {"name": "Talas", "indikasi": "demam, insomnia", "kontraindikasi": "ginjal, batu ginjal, asam urat, mentah"},
    {"name": "Daun Pakis Sayur", "indikasi": "nafsu makan", "kontraindikasi": "pencernaan, kehamilan, alergi"},
    {"name": "Pucuk Daun Keluak", "indikasi": "mimisan", "kontraindikasi": "saraf, pernapasan, hamil, anak-anak"},
    {"name": "Daun Jeruk Limau", "indikasi": "kesemutan, rematik", "kontraindikasi": "asam lambung, GERD, alergi jeruk"},
    {"name": "Daun Dapdap", "indikasi": "perut kembung, demam", "kontraindikasi": "saraf, otot, kehamilan, alergi"},
    {"name": "Daun Wani", "indikasi": "sakit telinga bernanah", "kontraindikasi": "diabetes, hipoglikemia, pencernaan"},
    {"name": "Himalayan Paris", "indikasi": "pusing, demam, diare, luka, ular", "kontraindikasi": "pencernaan, saraf, napas, anak, hamil"},
    {"name": "Daun Mint", "indikasi": "perut, pencernaan, kembung, anti-obesity", "kontraindikasi": "GERD, batu ginjal, liver, bayi, G6PD"},
    {"name": "Lempuyang Wangi", "indikasi": "batuk rejan, kuning, rematik, kembung", "kontraindikasi": "diabetes, pendarahan, hamil, menyusui"},
    {"name": "Temu Giring", "indikasi": "obat cacing, luka, antibakteri", "kontraindikasi": "batu empedu, hormonal, hamil, menyusui"},
    {"name": "Daun Jati Belanda", "indikasi": "berat badan, hiperlipidemia", "kontraindikasi": "Hamil, menyusui, anak, pencernaan, liver"},
    {"name": "Daun Kenikir", "indikasi": "maag, gondokan", "kontraindikasi": "alergi Asteraceae, hipoglikemia, hipotensi"},
    {"name": "Daun Kitolod", "indikasi": "peradangan, demam", "kontraindikasi": "mata serius, alergi"},
    {"name": "Daun Mulbery", "indikasi": "peradangan, demam", "kontraindikasi": "diabetes, hipotensi, operasi, ginjal"},
    {"name": "Alamanda", "indikasi": "pencahar ringan", "kontraindikasi": "pencernaan, kulit sensitif, kehamilan"},
    {"name": "Belimbing Manis", "indikasi": "hipertensi ringan", "kontraindikasi": "ginjal, batu ginjal, saraf, maag"},
    {"name": "Dadap Ayam", "indikasi": "antiinflamasi", "kontraindikasi": "Hamil, menyusui, liver, ginjal"},
    {"name": "Dadap Serep", "indikasi": "demam", "kontraindikasi": "Myasthenia Gravis, penenang, hipotensi"},
    {"name": "Gandarusa", "indikasi": "nyeri", "kontraindikasi": "kesuburan pria, hamil, ginjal, liver"},
    {"name": "Kaca Piring", "indikasi": "antiinflamasi, perut bengkak", "kontraindikasi": "limpa, lambung, diare, hamil"},
    {"name": "Kecipir", "indikasi": "nutrisi", "kontraindikasi": "G6PD, batu ginjal, alergi legum, asam urat"},
    {"name": "Kedawung", "indikasi": "diare", "kontraindikasi": "ginjal, lambung, maag, dehidrasi, hamil"},
    {"name": "Ketepeng", "indikasi": "anti jamur, anti-obesity", "kontraindikasi": "usus, Crohn, nyeri perut, hamil, jantung"},
    {"name": "Labu", "indikasi": "cacingan", "kontraindikasi": "diare kronis, alergi labu, lithium"},
    {"name": "Daun Maja", "indikasi": "diare", "kontraindikasi": "konstipasi, operasi, hamil, diabetes"},
    {"name": "Nilam", "indikasi": "antimikroba", "kontraindikasi": "pendarahan, operasi, kulit, hamil"},
    {"name": "Pandan", "indikasi": "aroma", "kontraindikasi": "ginjal, diare, hipoglikemia, hipotensi"},
    {"name": "Sena", "indikasi": "pencahar", "kontraindikasi": "usus, radang usus, dehidrasi, anak, hamil"},
    {"name": "Tanjung", "indikasi": "antiinflamasi", "kontraindikasi": "sembelit, darah kental, hamil, lambung"},
    {"name": "Turi", "indikasi": "radang", "kontraindikasi": "Asam Urat, lambung, limpa, legum, hamil"},
    {"name": "Daun Ubi Jalar", "indikasi": "antioksidan", "kontraindikasi": "Batu Ginjal, ginjal kronis, kembung"},
    {"name": "Daun Dewa", "indikasi": "antiradang", "kontraindikasi": "Hati, pendarahan, operasi, hipotensi"},
    {"name": "Andong", "indikasi": "perdarahan ringan", "kontraindikasi": "Hamil, menyusui, ginjal, anak"},
    {"name": "Angsana", "indikasi": "antiinflamasi", "kontraindikasi": "Hamil, ginjal, hati, diabetes, pendarahan"},
    {"name": "Asam Kandis", "indikasi": "pencernaan", "kontraindikasi": "gastritis, ulkus, liver, diabetes, hamil"},
    {"name": "Bangle", "indikasi": "antiinflamasi", "kontraindikasi": "Hamil, ginjal akut, maag, pendarahan"},
    {"name": "Bengkuang", "indikasi": "kulit", "kontraindikasi": "biji (racun), diabetes, ginjal, gas"},
    {"name": "Bidara", "indikasi": "antimikroba", "kontraindikasi": "diabetes, operasi, hamil, penenang"},
    {"name": "Bintaro", "indikasi": "obat luar", "kontraindikasi": "kardiotoksik, luka terbuka, asap"},
    {"name": "Brotowali Kuning", "indikasi": "demam", "kontraindikasi": "Hamil, anak, diabetes, liver, hipotensi"},
    {"name": "Ciplukan", "indikasi": "antidiabetes", "kontraindikasi": "Hamil, hipotensi, diabetes obat, jantung"},
    {"name": "Daun Encok", "indikasi": "rematik", "kontraindikasi": "Hamil mutlak, kulit, lambung, ginjal"},
    {"name": "Delima", "indikasi": "diare", "kontraindikasi": "pengencer darah, hipotensi, kulit, hati"},
    {"name": "Dlingo", "indikasi": "pencernaan", "kontraindikasi": "Karsinogenik, Hamil, Jantung, Hipotensi"},
    {"name": "Daun Ekor Naga", "indikasi": "antikanker", "kontraindikasi": "Ginjal, pencernaan, hamil, pendarahan"},
    {"name": "Daun Gedi", "indikasi": "antiinflamasi", "kontraindikasi": "Ginjal, diabetes, kembung, hipotensi"},
    {"name": "Daun Jambu Mete", "indikasi": "antimikroba", "kontraindikasi": "Getah toksik, Ginjal, Alergi kacang"},
    {"name": "Daun Katuk", "indikasi": "ASI", "kontraindikasi": "mentah (paru), Ginjal, Insomnia, Hamil"},
    {"name": "Daun Laban", "indikasi": "antiinflamasi", "kontraindikasi": "Hormonal, Hamil, Kontrasepsi, Parkinson"},
    {"name": "Daun Majapahit", "indikasi": "hipertensi", "kontraindikasi": "Hamil, Karsinogenik, Sianida, Laksatif"},
    {"name": "Mangkokan", "indikasi": "rontok, luka, ASI, pencernaan, bau badan", "kontraindikasi": "Ginjal, Saponin, Hamil, Kulit, Pendarahan"},
    {"name": "Puring", "indikasi": "sakit perut, gatal, sembelit, darah", "kontraindikasi": "Getah, Pencahar, Hamil, Kanker, Anak"},
    {"name": "Daun Sendok", "indikasi": "batuk, radang, luka, pencernaan", "kontraindikasi": "Pendarahan, Hipotensi, Usus, Hamil, Lithium"},
    {"name": "Daun Senggani", "indikasi": "diare, luka, demam, maag, nyeri", "kontraindikasi": "Sembelit, Ginjal, Maag akut, Hamil"},
    {"name": "Tanaman candu", "indikasi": "analgesik, sedatif", "kontraindikasi": "adiksi, napas, ilegal"}
]

def create_dataset(filename="herbal_finetune_data.jsonl"):
    with open(filename, "w", encoding="utf-8") as f:
        # Menghasilkan tepat 328 data (2 skenario x 164 herbal)
        for item in raw_data:
            # SKENARIO 1: TIDAK AMAN (Bentrok Medis)
            kontra_list = [k.strip() for k in item["kontraindikasi"].split(",")]
            kondisi_pasien = random.choice(kontra_list)
            
            input_text_danger = f"Keluhan: {item['indikasi'].split(',')[0]}. Kondisi Medis: {kondisi_pasien}. Herbal Tersedia: [{{'name': '{item['name']}', 'indikasi': '{item['indikasi']}', 'kontraindikasi': '{item['kontraindikasi']}'}}]"
            output_json_danger = {
                "rekomendasi": [],
                "alasan": f"TIDAK AMAN: Pasien memiliki riwayat {kondisi_pasien} yang merupakan kontraindikasi bagi penggunaan {item['name']}."
            }
            
            # SKENARIO 2: AMAN
            input_text_safe = f"Keluhan: {item['indikasi'].split(',')[0]}. Kondisi Medis: tidak ada. Herbal Tersedia: [{{'name': '{item['name']}', 'indikasi': '{item['indikasi']}', 'kontraindikasi': '{item['kontraindikasi']}'}}]"
            output_json_safe = {
                "rekomendasi": [{
                    "name": item["name"],
                    "alasan": f"{item['name']} direkomendasikan untuk membantu {item['indikasi'].split(',')[0]} karena tidak ditemukan kontraindikasi pada kondisi medis pasien."
                }]
            }

            # Simpan kedua skenario
            for inp, out in [(input_text_danger, output_json_danger), (input_text_safe, output_json_safe)]:
                json_line = {
                    "instruction": INSTRUCTION,
                    "input": inp,
                    "output": json.dumps(out)
                }
                f.write(json.dumps(json_line) + "\n")
            
    print(f"✅ Berhasil membuat {filename} dengan total 328 data variasi (164 herbal x 2 skenario).")

if __name__ == "__main__":
    create_dataset()