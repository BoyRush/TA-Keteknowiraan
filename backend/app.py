import os
from datetime import datetime
from flask import Flask, request, jsonify
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

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# DEFINISIKAN DI LUAR FUNGSI AGAR KONSISTEN
USER_ROLES = {
    "0xa5e8eee8aec0cb7658eb5e26859d51cf12b26bae": "patient", 
    "0xbef4a50d20216f69482f0545ac35ce3be2ad89a2": "doctor",   
    "0x0e10108765d262de1e2646bdf8b444872f89f149": "herbal_doctor"
}

@app.route('/auth/doctors', methods=['GET'])
def get_all_doctors():
    # Contoh manual, sesuaikan dengan cara Anda menyimpan daftar dokter
    doctor_list = ["0x70997970C51812dc3A010C7d01B50E0d17dc79C8"] 
    return jsonify({"doctors": doctor_list}), 200

@app.route("/auth/login", methods=["POST"])
def login_api():
    data = request.json
    address = data.get("address").lower()
    
    print(f"DEBUG: Alamat masuk -> {address}")
    
    role = USER_ROLES.get(address)
    
    if role:
        print(f"Login Sukses: {role}")
        return jsonify({"role": role}), 200
    
    print(f"Login gagal untuk alamat: {address}") 
    return jsonify({"error": "Unauthorized"}), 403
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


@app.route("/herbal/recommendation-input", methods=["GET"])
def recommendation_input():
    query = request.args.get("q")
    medical = request.args.get("medical", "")

    medical_conditions = [m.strip().lower() for m in medical.split(",") if m]

    # 🧠 1. RAG: ambil herbal relevan dari Chroma
    herbs_from_rag = retrieve_relevant_herbs(query)

    # 🩺 2. RULE-BASED FILTER (kondisi medis)
    safe_herbs = filter_herbs_by_medical_condition(
        herbs_from_rag,
        medical_conditions
    )

    # 📦 3. BANGUN INPUT LLM
    llm_input = build_llm_input(
        query,
        medical_conditions,
        safe_herbs
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
    deskripsi = data.get("deskripsi")
    
    pk = os.getenv("SYSTEM_PRIVATE_KEY")
    
    try:
        # 1. IPFS Upload
        herbal_metadata = {
            "name": nama,
            "indikasi": indikasi,
            "kontraindikasi": kontraindikasi,
            "deskripsi": deskripsi
        }
        ipfs_cid = upload_json_to_ipfs(herbal_metadata)
        print(f"✅ IPFS Success: {ipfs_cid}")

        # 2. ChromaDB (PERBAIKAN DI SINI)
        # Tambahkan parameter kontraindikasi agar tidak error lagi
        add_herbal(
            name=nama, 
            indikasi=indikasi, 
            kontraindikasi=kontraindikasi, # Pastikan ini ada!
            cid=ipfs_cid,
            content=deskripsi 
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

        # --- SOLUSI ERROR rawTransaction ---
        # Kita cek apakah objek 'signed' punya rawTransaction atau raw_transaction
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



