import os
from datetime import datetime
from flask import Flask, request, jsonify
import chromadb
from flask_cors import CORS 
from blockchain.health_record_service import (
    store_medical_record,
    grant_access,
    revoke_access,
    reject_access,
    get_medical_records_as_doctor,
    get_patient_medical_conditions,
    request_access_from_doctor
)
from ipfs.ipfs_service import upload_json_to_ipfs
from chroma.herbal_store import add_herbal, search_herbal
from rules.medical_rules import filter_herbs_by_medical_condition
from services.herbal_builder import build_herbs
from services.llm_schema_builder import build_llm_input
from services.llm_generator import generate_herbal_recommendation
from services.herbal_retriever import retrieve_relevant_herbs
from blockchain.contract import web3, contract
from flask_cors import CORS
from dotenv import load_dotenv 
from datetime import datetime


load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

@app.route("/auth/login", methods=["POST"])
def login_api():
    data = request.json
    try:
        # 1. Validasi & Konversi ke Checksum Address
        address = web3.to_checksum_address(data.get("address"))
    except Exception:
        return jsonify({"error": "Format alamat wallet tidak valid"}), 400
    
    print(f"DEBUG: Upaya Login -> {address}")

    # A. CEK ADMIN (Pemilik Kontrak)
    # Admin selalu bisa login tanpa perlu registrasi tambahan
    contract_admin = contract.functions.admin().call()
    if address == contract_admin:
        return jsonify({
            "role": "admin", 
            "status": "active", 
            "name": "Admin Sistem"
        }), 200

    # B. CEK DOKTER (Medis & Herbal)
    # Struct: [name, specialty, isApproved, isRegistered]
    doctor_info = contract.functions.doctors(address).call()
    
    if doctor_info[3]:  # Jika isRegistered == True
        # CEK APPROVAL: Syarat mutlak login untuk semua dokter
        if doctor_info[2]:  # Jika isApproved == True
            role = "doctor" 
            # Pembedaan role berdasarkan spesialisasi yang dipilih saat daftar
            if "herbal" in doctor_info[1].lower():
                role = "herbal_doctor"
                
            return jsonify({
                "role": role, 
                "name": doctor_info[0], 
                "specialty": doctor_info[1],
                "status": "approved"
            }), 200
        else:
            # DOKTER TERDAFTAR TAPI BELUM DI-APPROVE ADMIN
            return jsonify({
                "role": "doctor", 
                "status": "pending_approval", 
                "message": "Akun Dokter Anda sedang menunggu verifikasi Admin. Silakan hubungi admin untuk aktivasi."
            }), 403

    # C. CEK PASIEN
    patient_name = contract.functions.patientNames(address).call()
    if patient_name != "" and patient_name is not None:
        return jsonify({
            "role": "patient", 
            "name": patient_name, 
            "status": "active"
        }), 200

    # D. JIKA ALAMAT TIDAK TERDAPAT DI BLOCKCHAIN
    return jsonify({
        "role": "none",
        "error": "Alamat wallet belum terdaftar di Blockchain.",
        "message": "Silakan masuk ke halaman Registrasi terlebih dahulu."
    }), 404 
# =========================
# HERBAL (SEMANTIC SEARCH)
# =========================
@app.route("/herbal/search", methods=["GET"])
def search_herbal_api():
    query = request.args.get("q")
    medical_raw = request.args.get("medical", "")

    if not query:
        return jsonify({"error": "query kosong"}), 400

    medical_conditions = [
        m.strip().lower()
        for m in medical_raw.split(",")
        if m
    ]

    result = search_herbal(query)

    herbs = []
    if result["documents"] and result["documents"][0]:
        for i in range(len(result["documents"][0])):
            herbs.append({
                "id": result["ids"][0][i],
                "name": result["metadatas"][0][i].get("name"),
                "indikasi": result["metadatas"][0][i].get("indikasi"),
                "kontraindikasi": result["metadatas"][0][i].get("kontraindikasi"),
                "deskripsi": result["documents"][0][i],
                "score": result["distances"][0][i]
            })

    if medical_conditions:
        herbs = filter_herbs_by_medical_condition(herbs, medical_conditions)

    return jsonify({
        "query": query,
        "medical_conditions": medical_conditions,
        "results": herbs
    })

# --- ENDPOINT TAMBAHAN UNTUK DASHBOARD DOKTER ---
@app.route("/herbal/all", methods=["GET"])
def get_all_herbs():
    try:
        import chromadb
        import os
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, "chroma_db")
        client = chromadb.PersistentClient(path=db_path)

        existing_collections = client.list_collections()
        print(f"🔍 KOLEKSI YANG DITEMUKAN DI DB: {[c.name for c in existing_collections]}")

        target_name = "herbal_db"
        if existing_collections:
            target_name = existing_collections[0].name
            print(f"🎯 Dashboard otomatis beralih ke koleksi: {target_name}")

        collection = client.get_or_create_collection(name=target_name)
        results = collection.get() 
        
        herbs = []
        if results and "ids" in results:
            for i in range(len(results["ids"])):
                meta = results["metadatas"][i] or {}
                doc = results["documents"][i] or ""
                herbs.append({
                    "id": results["ids"][i],
                    "nama": meta.get("name") or meta.get("nama") or doc[:15],
                    "indikasi": meta.get("indikasi") or meta.get("kegunaan") or "-",
                    "kontraindikasi": meta.get("kontraindikasi") or "-",
                    "deskripsi": doc
                })
        
        print(f"✅ Dashboard Berhasil Menarik: {len(herbs)} data dari {target_name}")
        return jsonify(herbs), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/herbal/delete/<id>", methods=["DELETE"])
def delete_herb(id):
    try:
        import chromadb
        import os
        
        # 1. Inisialisasi ulang client dan collection (Wajib agar tidak Error "not defined")
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, "chroma_db")
        client = chromadb.PersistentClient(path=db_path)
        
        collection = client.get_or_create_collection(name="herbal_collection")

        # 2. Hapus data berdasarkan ID di ChromaDB
        collection.delete(ids=[id])
        
        print("\n" + "!"*40)
        print(f"🗑️  DATA DIHAPUS: ID {id}")
        print(f"Status: Berhasil dihapus dari ChromaDB (herbal_collection)")
        print("!"*40 + "\n")
        
        return jsonify({"message": f"Herbal {id} berhasil dihapus"}), 200
    except Exception as e:
        print(f"❌ GAGAL HAPUS: {e}")
        return jsonify({"error": str(e)}), 500
        

@app.route("/herbal/update/<id>", methods=["PUT", "OPTIONS"])
def update_herbal(id):
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200

    try:
        import chromadb
        import os
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, "chroma_db")
        client = chromadb.PersistentClient(path=db_path)
        collection = client.get_or_create_collection(name="herbal_collection")

        data = request.json
        nama = data.get("name")
        indikasi = data.get("indikasi")
        kontraindikasi = data.get("kontraindikasi")
        deskripsi = data.get("deskripsi")

        # --- 1. UPLOAD ULANG KE IPFS (Data Versi Baru) ---
        herbal_metadata = {
            "name": nama,
            "indikasi": indikasi,
            "kontraindikasi": kontraindikasi,
            "deskripsi": deskripsi,
            "status": "Updated Version"
        }
        new_ipfs_cid = upload_json_to_ipfs(herbal_metadata)
        print(f"✅ [UPDATE] IPFS Success: {new_ipfs_cid}")

        # --- 2. UPDATE DI CHROMADB ---
        collection.upsert(
            ids=[id],
            metadatas=[{
                "name": nama,
                "nama": nama,
                "indikasi": indikasi,
                "kontraindikasi": kontraindikasi,
                "ipfs_cid": new_ipfs_cid # Simpan CID baru di metadata
            }],
            documents=[deskripsi]
        )
        print("✅ [UPDATE] ChromaDB Indexed")

        # --- 3. KIRIM KE BLOCKCHAIN ---
        pk = os.getenv("SYSTEM_PRIVATE_KEY")
        account = web3.eth.account.from_key(pk)
        nonce = web3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.storeHerbalData(new_ipfs_cid).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': web3.to_wei('50', 'gwei')
        })
        
        signed = web3.eth.account.sign_transaction(tx, pk)
        raw_data = signed.raw_transaction if hasattr(signed, 'raw_transaction') else signed.rawTransaction
        tx_hash = web3.eth.send_raw_transaction(raw_data)
        new_tx_hash = web3.to_hex(tx_hash)
        
        print(f"✅ [UPDATE] Blockchain Success: {new_tx_hash}")
        # -----------------------------------------------

        print(f"\n✨ UPDATE SELESAI UNTUK: {nama}\n")
        
        return jsonify({
            "status": "Success",
            "ipfs_cid": new_ipfs_cid,
            "tx_hash": new_tx_hash
        }), 200

    except Exception as e:
        print(f"❌ Gagal Update Total: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/herbal/recommendation-input", methods=["GET"])
def recommendation_input():
    query = request.args.get("q", "").lower() # Ambil query dan jadikan lowercase
    medical = request.args.get("medical", "")

    medical_conditions = [m.strip().lower() for m in medical.split(",") if m]

    # 🧠 1. RAG: ambil herbal relevan dari Chroma
    herbs_from_rag = retrieve_relevant_herbs(query)

    # 🩺 2. RULE-BASED FILTER (Kondisi Medis/Kontraindikasi)
    safe_herbs = filter_herbs_by_medical_condition(
        herbs_from_rag,
        medical_conditions
    )

    # ✨ 2.5 VALIDATION LAYER: Filter cerdas agar tidak salah alamat
    strictly_relevant_herbs = []
    
    stop_words = ["sakit", "nyeri", "obat", "gejala", "herbal", "alami", "manjur"]
    
    # Hanya ambil kata kunci yang unik (misal: "kaki", "tenggorokan", "lambung")
    query_words = [w for w in query.split() if w not in stop_words and len(w) > 2]

    if not query_words:
        query_words = query.split()

    for herb in safe_herbs:
        indikasi = herb.get("indikasi", "").lower()
        deskripsi = herb.get("deskripsi", "").lower()
        
      
        is_relevant = any(word in indikasi or word in deskripsi for word in query_words)

        if is_relevant:
            strictly_relevant_herbs.append(herb)
  
    # 📦 3. BANGUN INPUT LLM
    llm_input = build_llm_input(
        query,
        medical_conditions,
        strictly_relevant_herbs 
    )

    # 🤖 4. LLM (HANYA reasoning & formatting)
    llm_output = generate_herbal_recommendation(llm_input)

    return jsonify(llm_output)

# =========================
# IPFS  
# =========================
@app.route("/ipfs/upload", methods=["POST"])
def upload_ipfs():
    data = request.json
    cid = upload_json_to_ipfs(data)
    return jsonify({
        "cid": cid
    })

@app.route('/medical/get-content', methods=['GET'])
def get_medical_content():
    cid = request.args.get('cid')
    import requests
    try:
        # Flask memanggil IPFS lokal (Port 5001 API)
        # Jalur ini tidak akan kena blokir CORS oleh browser
        response = requests.post(f'http://127.0.0.1:5001/api/v0/cat?arg={cid}', timeout=5)

        return response.text, 200, {'Content-Type': 'application/json'}
    except Exception as e:
        return jsonify({"diagnosis": "Gagal mengambil data"}), 500

@app.route("/medical/ipfs-only", methods=["POST"])
def upload_to_ipfs_only():
    try:
        data = request.json
        # Kita bungkus data medisnya
        medical_metadata = {
            "diagnosis": data.get("diagnosis"),
            "patient": data.get("patient_address"),
            "timestamp": datetime.now().isoformat()
        }
        
        # Upload ke IPFS
        ipfs_cid = upload_json_to_ipfs(medical_metadata)
        
        # Kirim balik CID-nya ke Frontend
        return jsonify({"ipfs_cid": ipfs_cid}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/medical/store", methods=["POST"])
def store_medical_api():
    data = request.json
    
    # 1. PERBAIKAN CHECKSUM: Ubah alamat pasien ke format yang aman bagi Web3
    try:
        raw_address = data.get("patient_address")
        pasien_address = web3.to_checksum_address(raw_address)
    except Exception as e:
        return jsonify({"error": f"Format alamat wallet salah: {str(e)}"}), 400

    diagnosa = data.get("diagnosis")
    pk = os.getenv("ETH_STORAGE_KEY") 
    
    try:
        print(f"--- Memulai Proses Medis untuk Pasien: {pasien_address} ---")
        
        # 2. PERBAIKAN DATETIME: Pastikan 'from datetime import datetime' sudah ada di atas
        medical_metadata = {
            "diagnosis": diagnosa,
            "patient": pasien_address,
            "timestamp": datetime.now().isoformat()
        }
        
        # Upload ke IPFS
        ipfs_cid = upload_json_to_ipfs(medical_metadata)
        print(f"✅ IPFS Medical Success: {ipfs_cid}")

        # 3. TRANSAKSI KE BLOCKCHAIN
        account = web3.eth.account.from_key(pk)
        nonce = web3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.storeMedicalRecord(pasien_address, ipfs_cid).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': web3.to_wei('50', 'gwei')
        })
        
        signed = web3.eth.account.sign_transaction(tx, pk)
        # Handle perbedaan versi web3 (raw_transaction vs rawTransaction)
        raw_data = signed.raw_transaction if hasattr(signed, 'raw_transaction') else signed.rawTransaction
        tx_hash = web3.eth.send_raw_transaction(raw_data)
        
        print(f"✅ Blockchain Medical Success: {web3.to_hex(tx_hash)}")

        return jsonify({
            "status": "Success", 
            "ipfs_cid": ipfs_cid, 
            "tx_hash": web3.to_hex(tx_hash)
        }), 201
        
    except Exception as e:
        print(f"❌ ERROR MEDIS: {str(e)}")
        return jsonify({"error": str(e)}), 500
# =========================
# PASIEN
# =========================
@app.route("/auth/doctors", methods=["GET"])
def get_all_doctors():
    try:
        all_accounts = web3.eth.accounts
        doctor_addresses = []
        
        for acc in all_accounts:
            checksum_acc = web3.to_checksum_address(acc)
            # Sesuaikan: Pakai 'verifiedDoctor' (sesuai ABI yang kamu tunjukkan tadi)
            is_verified = contract.functions.verifiedDoctor(checksum_acc).call()
            
            if is_verified:
                # Kita hanya kirim ALAMATNYA saja (string) agar Frontend bisa melakukan loop
                doctor_addresses.append(checksum_acc)
        
        return jsonify({"doctors": doctor_addresses}), 200
    except Exception as e:
        print(f"❌ Error Detail: {str(e)}")
        return jsonify({"doctors": [], "error": str(e)}), 500
    
@app.route("/patient/grant-access", methods=["POST"])
def grant_access_api():
    data = request.json
    tx_hash = grant_access(
        data["patient_private_key"],
        data["doctor_address"]
    )
    return jsonify({"tx_hash": tx_hash})


@app.route("/patient/revoke-access", methods=["POST"])
def revoke_access_api():
    data = request.json
    tx_hash = revoke_access(
        data["patient_private_key"],
        data["doctor_address"]
    )
    return jsonify({"tx_hash": tx_hash})

@app.route("/patient/reject-access", methods=["POST"])
def reject_access_api():
    data = request.json
    try:
        tx_hash = reject_access(
            data["patient_private_key"],
            data["doctor_address"]
        )
        return jsonify({
            "status": "Success",
            "message": "Access request rejected",
            "tx_hash": tx_hash
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/patient/request-recommendation", methods=["POST"])
def patient_request_recommendation():
    data = request.json

    patient_address = data["patient_address"]
    # SEBELUMNYA: data["doctor_private_key"]
    # SEKARANG: Pakai key pasien sendiri
    patient_private_key = data["patient_private_key"] 
    keluhan = data["keluhan"]

    # 1️⃣ AMBIL DARI BC (Pasien mengakses datanya sendiri)
    medical_conditions = get_patient_medical_conditions(
        patient_address,
        patient_private_key 
    )

    print("MEDICAL FROM BC:", medical_conditions)

    # 2️⃣ RAG, 3️⃣ RULE-BASED, 4️⃣ LLM (Tetap sama)
    herbs_from_rag = retrieve_relevant_herbs(keluhan)
    safe_herbs = filter_herbs_by_medical_condition(herbs_from_rag, medical_conditions)
    llm_input = build_llm_input(keluhan, medical_conditions, safe_herbs)
    llm_output = generate_herbal_recommendation(llm_input)

    return jsonify({
        "patient_context": {
            "keluhan": keluhan,
            "kondisi_medis": medical_conditions
        },
        "rekomendasi": llm_output
    })


@app.route("/medical/grant", methods=["POST"])
def grant():
    data = request.json
    tx_hash = grant_access(
        data["patient_private_key"],
        data["doctor_address"]
    )
    return jsonify({"tx_hash": tx_hash})


@app.route("/medical/revoke", methods=["POST"])
def revoke():
    data = request.json
    tx_hash = revoke_access(
        data["patient_private_key"],
        data["doctor_address"]
    )
    return jsonify({"tx_hash": tx_hash})


# =========================
# DOKTER Herbal
# ========================
@app.route("/herbal/store", methods=["POST"])
def store_herbal_api():
    data = request.json
    nama = data.get("name")
    # Ambil data baru dari form
    indikasi = data.get("indikasi")
    kontraindikasi = data.get("kontraindikasi") # Tambahkan ini
    
    
    pk = os.getenv("SYSTEM_PRIVATE_KEY")
    
    try:
        # 1. IPFS Upload
        herbal_metadata = {
            "name": nama,
            "indikasi": indikasi,
            "kontraindikasi": kontraindikasi,
        }
        ipfs_cid = upload_json_to_ipfs(herbal_metadata)
        print(f"✅ IPFS Success: {ipfs_cid}")

        # 2. ChromaDB (PERBAIKAN DI SINI)
        add_herbal(
            name=nama, 
            indikasi=indikasi, 
            kontraindikasi=kontraindikasi, # Pastikan ini ada!
            cid=ipfs_cid,

        )
        print("✅ ChromaDB Indexed")

        # 3. Blockchain
        account = web3.eth.account.from_key(pk)
        nonce = web3.eth.get_transaction_count(account.address)
        
        tx = contract.functions.storeHerbalData(ipfs_cid).build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': 500000,
            'gasPrice': web3.to_wei('50', 'gwei')
        })
        
        signed = web3.eth.account.sign_transaction(tx, pk)

        raw_data = signed.raw_transaction if hasattr(signed, 'raw_transaction') else signed.rawTransaction
        
        tx_hash = web3.eth.send_raw_transaction(raw_data)
        # ------------------------------------

        print(f"✅ Blockchain Success: {web3.to_hex(tx_hash)}")
        
        return jsonify({
            "status": "Success", 
            "ipfs_cid": ipfs_cid, 
            "blockchain_tx": web3.to_hex(tx_hash)
        }), 201

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return jsonify({"error": str(e)}), 500
# =========================
# DOKTER
# =========================
@app.route("/doctor/request-access", methods=["POST"])
def doctor_request_access_api():
    data = request.json
    tx_hash = request_access_from_doctor(
        data["doctor_private_key"],
        data["patient_address"]
    )
    return jsonify({"tx_hash": tx_hash, "status": "Request sent to blockchain"})
@app.route("/doctor/medical-records", methods=["GET"])
def get_records():
    patient = request.args.get("patient")
    doctor = request.args.get("doctor")
    records = get_medical_records_as_doctor(patient, doctor)
    return jsonify(records)


if __name__ == "__main__":
    app.run(debug=True)



