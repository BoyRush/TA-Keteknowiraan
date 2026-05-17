import os
import sys
import json
import string
import secrets
from datetime import datetime, timedelta
from functools import wraps

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
from dotenv import load_dotenv
load_dotenv()

# ==========================================
# KONFIGURASI GEMINI API KEY
# ==========================================
# API Key dibaca dari file .env — JANGAN pernah hardcode key di sini.
# Pastikan .env sudah ada di .gitignore agar key tidak ter-commit ke Git.
_gemini_key = os.environ.get("GEMINI_API_KEY", "")
if _gemini_key:
    print(f"[Gemini] API Key loaded dari .env: {_gemini_key[:15]}...")
else:
    print("[Gemini] PERINGATAN: GEMINI_API_KEY tidak ditemukan di .env!")

# Existing Chroma & AI logic (adapted to not use IPFS/Web3)
from chroma.herbal_store import add_herbal, update_herbal, delete_herbal, search_herbal, embedding_functions
from rules.medical_rules import filter_herbs_by_medical_condition
from services.llm_generator import generate_herbal_recommendation
from services.herbal_retriever import retrieve_relevant_herbs

# load_dotenv() sudah dipanggil di atas — tidak perlu duplikat

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Konfigurasi JWT
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "super-secure-jwt-secret-key-2026-smartherbal-ai-system-long")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)
app.config["JWT_TOKEN_LOCATION"] = ["headers", "query_string"]
app.config["JWT_QUERY_STRING_NAME"] = "token"
jwt = JWTManager(app)

FREE_QUOTA_LIMIT = 3

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root", 
        database="smartherbal_db",
        port=3306,
        collation="utf8mb4_general_ci"
    )

def add_notification_by_id(user_id, pesan):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = "INSERT INTO sh_notifications (user_id, pesan, is_read, tanggal) VALUES (%s, %s, FALSE, NOW())"
        cursor.execute(query, (user_id, pesan))
        conn.commit()
        cursor.close()
        conn.close()
        print(f"DEBUG: Notif dikirim ke User ID {user_id}")
    except Exception as e:
        print(f"ERROR Notif: {e}")

# ==========================================
# 1. AUTHENTICATION & REGISTRATION
# ==========================================

@app.route("/auth/register", methods=["POST", "OPTIONS"])
def register_api():
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200
    
    data = request.form if request.form else (request.get_json() or {})
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name") or data.get("name", "")
    role = data.get("role", "patient")

    if not username or not password:
        return jsonify({"error": "Username dan Password wajib diisi"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s OR (email = %s AND email IS NOT NULL)", (username, email))
        existing_user = cursor.fetchone()
        
        if existing_user:
            return jsonify({"error": "Username atau Email sudah terdaftar"}), 409

        hashed_pw = generate_password_hash(password)
        
        doc_url = None
        if role in ["doctor", "herbal_doctor"]:
            file = request.files.get("document")
            if file:
                os.makedirs("uploads", exist_ok=True)
                file_path = os.path.join("uploads", f"{username}_{file.filename}")
                file.save(file_path)
                doc_url = file_path
        
        new_status = 'pending' if role in ['doctor', 'herbal_doctor'] else 'approved'
        
        # Generate Referral Code
        referral_code = None
        if role == 'patient':
            import secrets
            import string
            referral_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

        # 1. Insert into users table
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, full_name, role, document_url, verification_status, referral_code) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", 
            (username, email, hashed_pw, full_name, role, doc_url, new_status, referral_code)
        )
        user_id = cursor.lastrowid

        # 2. Insert into role-specific tables
        if role == 'patient':
            cursor.execute("INSERT INTO patients (user_id) VALUES (%s)", (user_id,))
        elif role in ['doctor', 'herbal_doctor']:
            cursor.execute("INSERT INTO doctors (user_id) VALUES (%s)", (user_id,))

        conn.commit()
        cursor.close()
        conn.close()

        if role == 'patient':
            add_notification_by_id(user_id, "Selamat Datang! Akun Pasien Anda telah diverifikasi otomatis oleh sistem.")

        return jsonify({"status": "success", "message": "Registrasi berhasil", "user_id": user_id}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/login", methods=["POST", "OPTIONS"])
def login_api():
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200
    
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username dan Password wajib diisi"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password_hash'], password):
            return jsonify({"error": "Username atau Password salah"}), 401

        if user['verification_status'] == 'rejected':
            return jsonify({"error": "Akun ditolak", "reason": user.get('rejection_reason')}), 403
            
        if user['verification_status'] == 'revoked':
            return jsonify({"error": "Akun dinonaktifkan oleh Admin"}), 403

        # Update last login
        cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user['id'],))
        conn.commit()
        cursor.close()
        conn.close()

        # Buat JWT Token
        access_token = create_access_token(identity=json.dumps({
            "id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "full_name": user['full_name'],
            "status": user['verification_status'],
            "membership_tier": user['membership_tier']
        }))

        return jsonify({
            "status": "success",
            "token": access_token,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "full_name": user['full_name'],
                "role": user['role'],
                "status": user['verification_status'],
                "membership_tier": user['membership_tier']
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/me", methods=["GET"])
@jwt_required()
def get_me():
    current_identity = json.loads(get_jwt_identity())
    user_id = current_identity['id']
    role = current_identity['role']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Base query
        query = "SELECT id, username, email, full_name, role, verification_status, membership_tier, premium_until, recommendation_count FROM users WHERE id = %s"
        cursor.execute(query, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Join with child tables for extra data
        if role == 'patient':
            cursor.execute("SELECT gender, birth_date, address FROM patients WHERE user_id = %s", (user_id,))
            patient_data = cursor.fetchone()
            if patient_data:
                user.update(patient_data)
                if user['birth_date']: user['birth_date'] = user['birth_date'].isoformat()
        elif role in ['doctor', 'herbal_doctor']:
            cursor.execute("SELECT specialization, hospital_name FROM doctors WHERE user_id = %s", (user_id,))
            doctor_data = cursor.fetchone()
            if doctor_data:
                user.update(doctor_data)
        
        if user['premium_until']: user['premium_until'] = user['premium_until'].isoformat()
        
        cursor.close()
        conn.close()
        return jsonify({"user": user}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/status/<int:user_id>", methods=["GET"])
@jwt_required()
def get_auth_status(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT verification_status, rejection_reason FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/reupload-document", methods=["POST"])
@jwt_required()
def reupload_document():
    user_id = request.form.get("user_id")
    file = request.files.get("document")
    
    if not user_id or not file:
        return jsonify({"error": "ID user dan dokumen wajib diisi"}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT username FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User tidak ditemukan"}), 404
            
        os.makedirs("uploads", exist_ok=True)
        file_path = os.path.join("uploads", f"{user['username']}_{file.filename}")
        file.save(file_path)
        
        cursor.execute("UPDATE users SET document_url = %s, verification_status = 'pending', rejection_reason = NULL WHERE id = %s", (file_path, user_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"status": "success", "message": "Dokumen berhasil diperbarui"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 2. ADMIN ENDPOINTS
# ==========================================

@app.route("/admin/users", methods=["GET"])
@jwt_required()
def get_all_users():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, email, full_name AS name, role, verification_status, document_url, membership_tier FROM users WHERE role != 'admin'")
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "users": users}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/dashboard/stats", methods=["GET"])
@jwt_required()
def get_admin_stats():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, username, full_name AS name, role, verification_status, document_url, membership_tier FROM users WHERE role != 'admin'")
        users = cursor.fetchall()
        
        stats = {
            "total_pengguna": len(users),
            "pending_verif": sum(1 for u in users if u['verification_status'] == 'pending'),
            "pasien": sum(1 for u in users if u['role'] == 'patient'),
            "dokter_medis": sum(1 for u in users if u['role'] == 'doctor'),
            "dokter_herbal": sum(1 for u in users if u['role'] == 'herbal_doctor')
        }
        
        pending_registrations = [u for u in users if u['verification_status'] == 'pending']
        
        cursor.close()
        conn.close()
        return jsonify({
            "status": "success", 
            "stats": stats, 
            "pending_registrations": pending_registrations
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/verify/approve", methods=["POST"])
@jwt_required()
def admin_approve_doctor():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin': return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    user_id = data.get("user_id") or data.get("id")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET verification_status = 'approved', rejection_reason = NULL WHERE id = %s", (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
        add_notification_by_id(user_id, "Akun Anda telah berhasil diverifikasi oleh Admin. Selamat datang!")
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/verify/reject", methods=["POST"])
@jwt_required()
def admin_reject_doctor():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin': return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    user_id = data.get("user_id") or data.get("id")
    reason = data.get("reason", "Dokumen tidak valid")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET verification_status = 'rejected', rejection_reason = %s WHERE id = %s", (reason, user_id))
        conn.commit()
        cursor.close()
        conn.close()
        add_notification_by_id(user_id, f"Verifikasi ditolak: {reason}")
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/view-document/<int:user_id>", methods=["GET"])
@jwt_required()
def admin_view_document(user_id):
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT document_url FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user or not user['document_url']:
            return jsonify({"error": "Document not found"}), 404
            
        file_path = user['document_url']
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found on server"}), 404
            
        directory = os.path.dirname(file_path)
        filename = os.path.basename(file_path)
        return send_from_directory(directory, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_user(user_id):
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE id = %s AND role != 'admin'", (user_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": f"User ID {user_id} deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 3. MEDICAL RECORDS (CRUD MySQL)
# ==========================================

@app.route("/records/medical", methods=["POST"])
@jwt_required()
def add_medical_record():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] not in ['doctor', 'herbal_doctor']: 
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    patient_user_id = data.get("patient_user_id")
    diagnosis = data.get("diagnosis")
    symptoms = data.get("symptoms")
    treatment = data.get("treatment")
    notes = data.get("notes")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get doctor internal ID
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor: return jsonify({"error": "Doctor profile not found"}), 404
        
        # Get patient internal ID
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (patient_user_id,))
        patient = cursor.fetchone()
        if not patient: return jsonify({"error": "Patient profile not found"}), 404
        
        # Check permission
        cursor.execute("SELECT status FROM access_permissions WHERE patient_id = %s AND doctor_id = %s", (patient['id'], doctor['id']))
        perm = cursor.fetchone()
        if not perm or perm['status'] != 'approved':
            return jsonify({"error": "Access denied. Access must be 'approved'."}), 403
        
        cursor.execute(
            "INSERT INTO medical_records (patient_id, doctor_id, diagnosis, symptoms, treatment, notes) VALUES (%s, %s, %s, %s, %s, %s)",
            (patient['id'], doctor['id'], diagnosis, symptoms, treatment, notes)
        )
        conn.commit()
        cursor.close()
        conn.close()
        add_notification_by_id(patient_user_id, f"Dokter {current_user['full_name']} menambahkan rekam medis baru untuk Anda.")
        return jsonify({"status": "success", "message": "Record added"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/records/medical/patient/<int:patient_user_id>", methods=["GET"])
@jwt_required()
def get_medical_records(patient_user_id):
    current_user = json.loads(get_jwt_identity())
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get patient internal ID
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (patient_user_id,))
        patient = cursor.fetchone()
        if not patient: return jsonify({"error": "Patient profile not found"}), 404
        
        # Access check and query logic
        if current_user['role'] == 'patient':
            if current_user['id'] != patient_user_id:
                return jsonify({"error": "Access denied"}), 403
            
            cursor.execute("""
                SELECT m.id, m.diagnosis, m.symptoms, m.treatment, m.notes, m.created_at, u.full_name as doctor_name 
                FROM medical_records m
                JOIN doctors d ON m.doctor_id = d.id
                JOIN users u ON d.user_id = u.id
                WHERE m.patient_id = %s
                ORDER BY m.created_at DESC
            """, (patient['id'],))
        else:
            # Check if current_user is a doctor with permission
            cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
            doctor = cursor.fetchone()
            if not doctor: return jsonify({"error": "Access denied"}), 403
            
            cursor.execute("SELECT status FROM access_permissions WHERE patient_id = %s AND doctor_id = %s", (patient['id'], doctor['id']))
            perm = cursor.fetchone()
            if not perm or perm['status'] != 'approved':
                return jsonify({"error": "Access denied"}), 403
            
            # Doctor only sees their own inputs for this patient
            cursor.execute("""
                SELECT m.id, m.diagnosis, m.symptoms, m.treatment, m.notes, m.created_at, u.full_name as doctor_name 
                FROM medical_records m
                JOIN doctors d ON m.doctor_id = d.id
                JOIN users u ON d.user_id = u.id
                WHERE m.patient_id = %s AND m.doctor_id = %s
                ORDER BY m.created_at DESC
            """, (patient['id'], doctor['id']))
            
        records = cursor.fetchall()
        
        for r in records:
            r['created_at'] = r['created_at'].isoformat()
            
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "records": records}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/records/medical/<int:record_id>", methods=["PUT"])
@jwt_required()
def update_medical_record(record_id):
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] not in ['doctor', 'herbal_doctor']: 
        return jsonify({"error": "Unauthorized"}), 403
    
    data = request.get_json() or {}
    diagnosis = data.get("diagnosis")
    symptoms = data.get("symptoms")
    treatment = data.get("treatment")
    notes = data.get("notes")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get doctor internal ID
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor: return jsonify({"error": "Doctor profile not found"}), 404
        
        # Verify ownership
        cursor.execute("SELECT * FROM medical_records WHERE id = %s AND doctor_id = %s", (record_id, doctor['id']))
        record = cursor.fetchone()
        if not record:
            return jsonify({"error": "Record not found or access denied"}), 404
            
        cursor.execute(
            "UPDATE medical_records SET diagnosis = %s, symptoms = %s, treatment = %s, notes = %s WHERE id = %s",
            (diagnosis, symptoms, treatment, notes, record_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": "Record updated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/records/medical/<int:record_id>", methods=["DELETE"])
@jwt_required()
def delete_medical_record(record_id):
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] not in ['doctor', 'herbal_doctor']: 
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor: return jsonify({"error": "Doctor profile not found"}), 404
        
        # Verify ownership
        cursor.execute("SELECT * FROM medical_records WHERE id = %s AND doctor_id = %s", (record_id, doctor['id']))
        record = cursor.fetchone()
        if not record:
            return jsonify({"error": "Record not found or access denied"}), 404
            
        cursor.execute("DELETE FROM medical_records WHERE id = %s", (record_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "message": "Record deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/records/medical/doctor", methods=["GET"])
@jwt_required()
def get_doctor_medical_history():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] not in ['doctor', 'herbal_doctor']:
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor: return jsonify({"error": "Doctor not found"}), 404
        
        cursor.execute("""
            SELECT m.id, m.diagnosis, m.symptoms, m.treatment, m.notes, m.created_at, 
                   u.full_name as patient_name, u.id as patient_user_id
            FROM medical_records m
            JOIN patients p ON m.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE m.doctor_id = %s
            ORDER BY m.created_at DESC
        """, (doctor['id'],))
        records = cursor.fetchall()
        
        for r in records:
            r['created_at'] = r['created_at'].isoformat()
            
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "records": records}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 4. ACCESS PERMISSIONS
# ==========================================

# --- New Search Endpoint ---
@app.route("/access/search-patient", methods=["GET"])
@jwt_required()
def search_patient():
    name_query = request.args.get("q")
    if not name_query: return jsonify([])
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.full_name, u.username 
            FROM users u
            JOIN patients p ON u.id = p.user_id
            WHERE u.full_name LIKE %s OR u.username LIKE %s
            LIMIT 10
        """, (f"%{name_query}%", f"%{name_query}%"))
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/access/request", methods=["POST"])
@jwt_required()
def request_access():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] not in ['doctor', 'herbal_doctor']:
        return jsonify({"error": "Unauthorized"}), 403
        
    data = request.get_json() or {}
    patient_user_id = data.get("patient_user_id")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get internal IDs
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (patient_user_id,))
        patient = cursor.fetchone()
        
        if not doctor or not patient: return jsonify({"error": "Profile not found"}), 404
        
        cursor.execute("""
            INSERT INTO access_permissions (patient_id, doctor_id, status, requested_at) 
            VALUES (%s, %s, 'pending', NOW())
            ON DUPLICATE KEY UPDATE status = 'pending', requested_at = NOW()
        """, (patient['id'], doctor['id']))
        conn.commit()
        cursor.close()
        conn.close()
        add_notification_by_id(patient_user_id, f"Dokter {current_user['full_name']} meminta akses ke rekam medis Anda.")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/access/respond", methods=["POST"])
@jwt_required()
def respond_access():
    current_user = json.loads(get_jwt_identity())
    data = request.get_json() or {}
    doctor_user_id = data.get("doctor_user_id")
    action = data.get("action") # 'approved' or 'rejected'
    
    if action not in ['approved', 'rejected']:
        return jsonify({"error": "Invalid action"}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (current_user['id'],))
        patient = cursor.fetchone()
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (doctor_user_id,))
        doctor = cursor.fetchone()
        
        status_col = 'approved_at' if action == 'approved' else 'rejected_at'
        
        cursor.execute(f"""
            UPDATE access_permissions SET status = %s, {status_col} = NOW()
            WHERE patient_id = %s AND doctor_id = %s
        """, (action, patient['id'], doctor['id']))
        conn.commit()
        cursor.close()
        conn.close()
        
        msg = "telah memberikan izin akses" if action == 'approved' else "telah menolak permintaan akses"
        add_notification_by_id(doctor_user_id, f"Pasien {current_user['full_name']} {msg}.")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/access/status", methods=["GET"])
@jwt_required()
def get_access_status():
    current_user = json.loads(get_jwt_identity())
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (current_user['id'],))
        patient = cursor.fetchone()
        if not patient: return jsonify({"status": "success", "permissions": []})

        cursor.execute("""
            SELECT u.id as doctor_user_id, u.full_name as doctor_name, a.status, a.requested_at 
            FROM access_permissions a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = %s AND a.status IN ('pending', 'approved')
        """, (patient['id'],))
        permissions = cursor.fetchall()
        for p in permissions:
            if p['requested_at']: p['requested_at'] = p['requested_at'].isoformat()
            
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "permissions": permissions}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/access/patients", methods=["GET"])
@jwt_required()
def get_doctor_patients():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] not in ['doctor', 'herbal_doctor']:
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor: return jsonify({"status": "success", "patients": []})

        cursor.execute("""
            SELECT u.id as patient_user_id, u.full_name as patient_name, a.status,
                   (SELECT diagnosis FROM medical_records m 
                    WHERE m.patient_id = p.id 
                    ORDER BY created_at DESC LIMIT 1) as active_diagnosis
            FROM access_permissions a
            JOIN patients p ON a.patient_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE a.doctor_id = %s AND a.status = 'approved'
        """, (doctor['id'],))
        patients = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "patients": patients}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/patient/dashboard/stats", methods=["GET"])
@jwt_required()
def get_patient_dashboard_stats():
    current_user = json.loads(get_jwt_identity())
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (current_user['id'],))
        patient = cursor.fetchone()
        if not patient: return jsonify({"error": "Patient profile not found"}), 404
        
        # Recs count
        cursor.execute("SELECT recommendation_count FROM users WHERE id = %s", (current_user['id'],))
        user_row = cursor.fetchone()
        
        # Medical records count
        cursor.execute("SELECT COUNT(*) as count FROM medical_records WHERE patient_id = %s", (patient['id'],))
        records_count = cursor.fetchone()['count']
        
        # Authorized doctors count
        cursor.execute("SELECT COUNT(*) as count FROM access_permissions WHERE patient_id = %s AND status = 'approved'", (patient['id'],))
        docs_count = cursor.fetchone()['count']
        
        # Pending requests count
        cursor.execute("SELECT COUNT(*) as count FROM access_permissions WHERE patient_id = %s AND status = 'pending'", (patient['id'],))
        pending_count = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "recommendations": user_row['recommendation_count'],
            "medical_records": records_count,
            "authorized_doctors": docs_count,
            "pending_requests": pending_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/auth/doctors", methods=["GET"])
def get_doctors():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, full_name, username FROM users WHERE role IN ('doctor', 'herbal_doctor') AND verification_status = 'approved'")
        doctors = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "doctors": doctors}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/herbal/history-count", methods=["GET"])
@jwt_required()
def get_history_count():
    current_user = json.loads(get_jwt_identity())
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (current_user['id'],))
        patient = cursor.fetchone()
        if not patient: return jsonify({"status": "success", "count": 0})

        cursor.execute("SELECT COUNT(*) FROM sh_riwayat_rekomendasi WHERE patient_id = %s", (patient[0],))
        count = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "count": count}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/sh/herbal/history", methods=["GET"])
@jwt_required()
def get_herbal_history():
    current_user = json.loads(get_jwt_identity())
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (current_user['id'],))
        patient = cursor.fetchone()
        if not patient: return jsonify({"status": "success", "history": []})

        cursor.execute("SELECT * FROM sh_riwayat_rekomendasi WHERE patient_id = %s ORDER BY tanggal DESC", (patient['id'],))
        history = cursor.fetchall()
        for h in history:
            if h['tanggal'] and isinstance(h['tanggal'], datetime):
                h['tanggal'] = h['tanggal'].isoformat()
            if h['hasil_ai'] and isinstance(h['hasil_ai'], str):
                h['hasil_ai'] = json.loads(h['hasil_ai'])
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "history": history}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 5. HERBAL KNOWLEDGE BASE CRUD (Dokter Herbal)
# ==========================================

@app.route("/herbal/store", methods=["POST"])
@jwt_required()
def herbal_store():
    """
    POST /herbal/store
    Dokter Herbal menambahkan data tanaman baru ke:
      1. MySQL (herbal_catalogs) — data terstruktur + audit trail
      2. ChromaDB (herbal_collection) — vector embedding untuk RAG
    """
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'herbal_doctor':
        return jsonify({"error": "Akses ditolak. Hanya Dokter Herbal yang dapat menambahkan data."}), 403

    data = request.get_json() or {}
    nama = data.get("nama", "").strip()
    indikasi = data.get("indikasi", "").strip()
    kontraindikasi = data.get("kontraindikasi", "").strip()
    deskripsi = data.get("deskripsi", "").strip()

    if not nama or not indikasi or not kontraindikasi:
        return jsonify({"error": "Nama, Indikasi, dan Kontraindikasi wajib diisi."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Ambil doctor_id dari JWT → tabel doctors
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor:
            return jsonify({"error": "Profil Dokter Herbal tidak ditemukan."}), 404

        doctor_id = doctor['id']

        # 1. Simpan ke MySQL terlebih dahulu untuk mendapatkan ID
        cursor.execute(
            "INSERT INTO herbal_catalogs (doctor_id, nama, indikasi, kontraindikasi, deskripsi) VALUES (%s, %s, %s, %s, %s)",
            (doctor_id, nama, indikasi, kontraindikasi, deskripsi)
        )
        record_id = cursor.lastrowid

        # 2. Simpan ke ChromaDB menggunakan MySQL record_id sebagai key
        chroma_doc_id = add_herbal(record_id, nama, indikasi, kontraindikasi, deskripsi, doctor_id)

        # 3. Update MySQL dengan chroma_doc_id untuk referensi di masa depan
        cursor.execute(
            "UPDATE herbal_catalogs SET chroma_doc_id = %s WHERE id = %s",
            (chroma_doc_id, record_id)
        )
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": f"Herbal '{nama}' berhasil disimpan ke database dan AI knowledge base.",
            "id": record_id,
            "chroma_doc_id": chroma_doc_id
        }), 201

    except Exception as e:
        print("Error herbal_store:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/herbal/all", methods=["GET"])
@jwt_required()
def herbal_get_all():
    """
    GET /herbal/all
    Mengambil daftar herbal dari MySQL herbal_catalogs.
    - Dokter Herbal: melihat semua herbалnya sendiri (aktif + nonaktif)
    - Role lain (admin, dll): melihat semua herbal aktif
    """
    current_user = json.loads(get_jwt_identity())
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        if current_user['role'] == 'herbal_doctor':
            # Dokter herbal hanya melihat data miliknya sendiri
            cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
            doctor = cursor.fetchone()
            if not doctor:
                return jsonify({"status": "success", "herbals": []}), 200

            cursor.execute(
                """SELECT hc.*, u.full_name as doctor_name 
                   FROM herbal_catalogs hc 
                   JOIN doctors d ON hc.doctor_id = d.id
                   JOIN users u ON d.user_id = u.id
                   WHERE hc.doctor_id = %s 
                   ORDER BY hc.created_at DESC""",
                (doctor['id'],)
            )
        else:
            # Publik/admin: semua yang aktif
            cursor.execute(
                """SELECT hc.*, u.full_name as doctor_name 
                   FROM herbal_catalogs hc 
                   JOIN doctors d ON hc.doctor_id = d.id
                   JOIN users u ON d.user_id = u.id
                   WHERE hc.is_active = TRUE 
                   ORDER BY hc.created_at DESC"""
            )

        herbals = cursor.fetchall()
        for h in herbals:
            if h.get('created_at') and isinstance(h['created_at'], datetime):
                h['created_at'] = h['created_at'].isoformat()
            if h.get('updated_at') and isinstance(h['updated_at'], datetime):
                h['updated_at'] = h['updated_at'].isoformat()

        cursor.close()
        conn.close()
        return jsonify({"status": "success", "herbals": herbals}), 200

    except Exception as e:
        print("Error herbal_get_all:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/herbal/update/<int:herbal_id>", methods=["PUT"])
@jwt_required()
def herbal_update(herbal_id):
    """
    PUT /herbal/update/<id>
    Memperbarui data herbal di MySQL dan me-replace embedding di ChromaDB.
    Hanya pemilik data (Dokter Herbal yang menambahkannya) yang dapat mengubah.
    """
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'herbal_doctor':
        return jsonify({"error": "Akses ditolak."}), 403

    data = request.get_json() or {}
    nama = data.get("nama", "").strip()
    indikasi = data.get("indikasi", "").strip()
    kontraindikasi = data.get("kontraindikasi", "").strip()
    deskripsi = data.get("deskripsi", "").strip()

    if not nama or not indikasi or not kontraindikasi:
        return jsonify({"error": "Nama, Indikasi, dan Kontraindikasi wajib diisi."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Cek kepemilikan
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor:
            return jsonify({"error": "Profil Dokter Herbal tidak ditemukan."}), 404

        cursor.execute(
            "SELECT * FROM herbal_catalogs WHERE id = %s AND doctor_id = %s",
            (herbal_id, doctor['id'])
        )
        herbal = cursor.fetchone()
        if not herbal:
            return jsonify({"error": "Data herbal tidak ditemukan atau bukan milik Anda."}), 404

        # 1. Update MySQL
        cursor.execute(
            "UPDATE herbal_catalogs SET nama=%s, indikasi=%s, kontraindikasi=%s, deskripsi=%s WHERE id=%s",
            (nama, indikasi, kontraindikasi, deskripsi, herbal_id)
        )

        # 2. Update ChromaDB (replace vektor lama)
        chroma_doc_id = update_herbal(herbal_id, nama, indikasi, kontraindikasi, deskripsi, doctor['id'])

        # 3. Pastikan chroma_doc_id tersimpan
        cursor.execute(
            "UPDATE herbal_catalogs SET chroma_doc_id = %s WHERE id = %s",
            (chroma_doc_id, herbal_id)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": f"Herbal '{nama}' berhasil diperbarui."}), 200

    except Exception as e:
        print("Error herbal_update:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/herbal/delete/<int:herbal_id>", methods=["DELETE"])
@jwt_required()
def herbal_delete(herbal_id):
    """
    DELETE /herbal/delete/<id>
    Soft-delete: mengubah is_active=FALSE di MySQL dan menghapus embedding dari ChromaDB.
    AI tidak akan merekomendasikan herbal ini setelah dihapus.
    """
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'herbal_doctor':
        return jsonify({"error": "Akses ditolak."}), 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Cek kepemilikan
        cursor.execute("SELECT id FROM doctors WHERE user_id = %s", (current_user['id'],))
        doctor = cursor.fetchone()
        if not doctor:
            return jsonify({"error": "Profil Dokter Herbal tidak ditemukan."}), 404

        cursor.execute(
            "SELECT * FROM herbal_catalogs WHERE id = %s AND doctor_id = %s",
            (herbal_id, doctor['id'])
        )
        herbal = cursor.fetchone()
        if not herbal:
            return jsonify({"error": "Data herbal tidak ditemukan atau bukan milik Anda."}), 404

        # 1. Hard-delete di MySQL
        cursor.execute(
            "DELETE FROM herbal_catalogs WHERE id = %s",
            (herbal_id,)
        )

        # 2. Hapus embedding dari ChromaDB agar AI tidak lagi merujuknya
        delete_herbal(herbal_id)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "success", "message": f"Herbal (ID: {herbal_id}) berhasil dinonaktifkan dari sistem."}), 200

    except Exception as e:
        print("Error herbal_delete:", e)
        return jsonify({"error": str(e)}), 500


# ==========================================
# 6. HERBAL AI SEARCH (Pasien)
# ==========================================

@app.route("/herbal/search", methods=["GET"])
@jwt_required()
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
                "name": result["metadatas"][0][i].get("nama") or result["metadatas"][0][i].get("name", ""),
                "indikasi": result["metadatas"][0][i].get("indikasi", ""),
                "kontraindikasi": result["metadatas"][0][i].get("kontraindikasi", ""),
                "deskripsi": result["metadatas"][0][i].get("deskripsi", ""),
                "score": result["distances"][0][i]
            })

    if medical_conditions:
        herbs = filter_herbs_by_medical_condition(herbs, medical_conditions, query)

    return jsonify({
        "query": query,
        "medical_conditions": medical_conditions,
        "results": herbs
    })

@app.route("/herbal/recommendation-input", methods=["GET"])
@jwt_required()
def recommendation_input():
    query = request.args.get("q")
    use_rag = request.args.get("useRag", "true").lower() == "true"
    current_user = json.loads(get_jwt_identity())

    if not query:
        return jsonify({"error": "query kosong"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Ambil status membership dan quota
        cursor.execute("SELECT membership_tier, premium_until, recommendation_count FROM users WHERE id = %s", (current_user['id'],))
        user = cursor.fetchone()
        
        tier = user["membership_tier"]
        rec_count = user["recommendation_count"]
        premium_until = user["premium_until"]
        
        # Check expired premium
        if tier == 'premium' and premium_until and premium_until < datetime.now():
            tier = 'basic'
            rec_count = 0
            cursor.execute("UPDATE users SET membership_tier = 'basic', premium_until = NULL, recommendation_count = 0 WHERE id = %s", (current_user['id'],))
            conn.commit()
            
        # QUOTA GATE
        try:
            from smartherbal_config import FREE_QUOTA_LIMIT
        except ImportError:
            FREE_QUOTA_LIMIT = 3

        if tier == 'basic' and rec_count >= FREE_QUOTA_LIMIT:
            cursor.close()
            conn.close()
            return jsonify({
                "status": "quota_exceeded",
                "used": rec_count,
                "limit": FREE_QUOTA_LIMIT,
                "message": "Batas rekomendasi gratis tercapai. Silakan upgrade ke Premium untuk akses tak terbatas."
            }), 403

        # Ambil ID pasien
        cursor.execute("SELECT id FROM patients WHERE user_id = %s", (current_user['id'],))
        patient = cursor.fetchone()
        
        medical_conditions = []
        if patient:
            cursor.execute("SELECT diagnosis FROM medical_records WHERE patient_id = %s", (patient['id'],))
            records = cursor.fetchall()
            for r in records:
                if r['diagnosis']:
                    medical_conditions.append(r['diagnosis'].lower())

        # PROSES AI — RAG Pipeline (sesuai implementation plan)
        if use_rag:
            # STEP 0: Enrich Query with Medical Keywords (Symptoms Awareness)
            from services.llm_generator import extract_medical_keywords
            keywords = extract_medical_keywords(query)
            enriched_query = f"{query} {' '.join(keywords)}"
            print(f"🔍 [RAG] Enriched Query: {enriched_query}")

            # STEP 1: Semantic Search via ChromaDB + Distance Filter
            # retrieve_relevant_herbs() membuang hasil dengan jarak > 0.6 (tidak relevan)
            herbs = retrieve_relevant_herbs(enriched_query, k=5)
            print(f"📦 Herbal ditemukan setelah distance filter: {len(herbs)}")

            if not herbs:
                llm_output = {
                    "mode": "RAG (Database Kosong / Tidak Relevan)",
                    "rekomendasi": [{
                        "nama": "Informasi",
                        "alasan": f"Maaf, tidak ada data herbal di database pakar yang relevan dengan keluhan '{query}'.",
                        "status": "warning"
                    }]
                }
            else:
                # STEP 2: Kirim ke LLM (Remote GPU via Ngrok)
                # Normalisasi field: ChromaDB metadata pakai 'nama', bukan 'name'
                from services.llm_generator import generate_herbal_recommendation
                llm_input = {
                    "mode": "RAG (Terverifikasi Database)",
                    "patient_context": {"keluhan": query, "kondisi_medis": medical_conditions},
                    "safe_herbs": [
                        {
                            "nama": h.get("nama") or h.get("name", ""),
                            "indikasi": h.get("indikasi", ""),
                            "kontraindikasi": h.get("kontraindikasi", ""),
                            "deskripsi": h.get("deskripsi", ""),
                            "id": h.get("id")
                        }
                        for h in herbs
                    ]
                }
                llm_output = generate_herbal_recommendation(llm_input)
                if isinstance(llm_output, dict):
                    llm_output["mode"] = llm_input["mode"]
        else:
            # Mode Non-RAG: LLM pakai pengetahuan umum tanpa database herbal
            llm_input = {
                "mode": "Non-RAG (Pengetahuan Umum AI)",
                "patient_context": {"keluhan": query, "kondisi_medis": medical_conditions},
                "safe_herbs": []
            }
            llm_output = generate_herbal_recommendation(llm_input)
            if isinstance(llm_output, dict):
                llm_output["mode"] = llm_input["mode"]

        # Increment quota & save history
        cursor.execute("UPDATE users SET recommendation_count = recommendation_count + 1 WHERE id = %s", (current_user['id'],))
        
        if patient:
            cursor.execute(
                "INSERT INTO sh_riwayat_rekomendasi (patient_id, keluhan, hasil_ai, mode) VALUES (%s, %s, %s, %s)",
                (patient['id'], query, json.dumps(llm_output), llm_output.get("mode", "AI Search"))
            )
            
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify(llm_output), 200

    except Exception as e:
        print("Error sh_herbal_recommendation:", e)
        return jsonify({"error": str(e)}), 500

# Notifications & other basic routes
@app.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    current_user = json.loads(get_jwt_identity())
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sh_notifications WHERE user_id = %s ORDER BY tanggal DESC", (current_user['id'],))
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        for row in rows:
            if row.get("tanggal") and isinstance(row["tanggal"], datetime):
                row["tanggal"] = row["tanggal"].isoformat()
        return jsonify(rows)
    except Exception as e:
        return jsonify([])

@app.route("/notifications/mark-read", methods=["POST"])
@jwt_required()
def mark_read():
    current_user = json.loads(get_jwt_identity())
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE sh_notifications SET is_read = TRUE WHERE user_id = %s", (current_user['id'],))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 6. PREMIUM TOKEN MANAGEMENT
# ==========================================

@app.route("/sh/admin/tokens/generate", methods=["POST"])
@jwt_required()
def sh_admin_generate_token():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    chars = string.ascii_uppercase + string.digits
    token = "SH-" + ''.join(secrets.choice(chars) for _ in range(8))
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sh_premium_tokens (token_code) VALUES (%s)",
            (token,)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "token": token}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/sh/admin/tokens", methods=["GET"])
@jwt_required()
def sh_admin_list_tokens():
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM sh_premium_tokens ORDER BY created_at DESC")
        tokens = cursor.fetchall()
        for t in tokens:
            if isinstance(t['created_at'], datetime): 
                t['created_at'] = t['created_at'].isoformat()
            if t['used_at'] and isinstance(t['used_at'], datetime): 
                t['used_at'] = t['used_at'].isoformat()
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "tokens": tokens}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/sh/admin/tokens/<int:id>", methods=["DELETE"])
@jwt_required()
def sh_admin_delete_token(id):
    current_user = json.loads(get_jwt_identity())
    if current_user['role'] != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sh_premium_tokens WHERE id = %s AND status = 'ACTIVE'", (id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Token tidak ditemukan atau sudah digunakan"}), 400
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/sh/membership/activate-token", methods=["POST", "OPTIONS"])
def sh_activate_token():
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200
        
    @jwt_required()
    def process_activation():
        current_user = json.loads(get_jwt_identity())
        try:
            data = request.get_json() or {}
        except:
            data = {}
            
        token = data.get("token", "").strip().upper()
        user_id = current_user['id']
        
        if not token:
            return jsonify({"error": "Token wajib diisi"}), 400

        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
            
            # Check token validity
            cursor.execute("SELECT * FROM sh_premium_tokens WHERE token_code = %s", (token,))
            payment = cursor.fetchone()
            is_legacy = False
            
            if not payment:
                # Fallback to old table
                cursor.execute("SELECT * FROM sh_manual_payments WHERE activation_token = %s", (token,))
                payment = cursor.fetchone()
                is_legacy = True
                
            if not payment:
                return jsonify({"error": "Token tidak valid"}), 400
                
            if (not is_legacy and payment["status"] == "USED") or (is_legacy and payment.get("status") == "approved" and payment.get("user_id") != user_id):
                return jsonify({"error": "Token sudah digunakan"}), 400
                
            # Get current user premium status
            cursor.execute("SELECT premium_until FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            curr_until = user["premium_until"] if user and user["premium_until"] and user["premium_until"] > datetime.now() else datetime.now()
            new_until = curr_until + timedelta(days=30)
            
            # Update user status
            cursor.execute("UPDATE users SET membership_tier = 'premium', premium_until = %s WHERE id = %s", (new_until, user_id))
            
            # Mark token as used
            if is_legacy:
                cursor.execute("UPDATE sh_manual_payments SET status = 'approved' WHERE id = %s", (payment["id"],))
            else:
                cursor.execute("UPDATE sh_premium_tokens SET status = 'USED', used_by_user_id = %s, used_at = NOW() WHERE id = %s", (user_id, payment["id"]))
            
            # Add notification
            add_notification_by_id(user_id, f"✨ Premium aktif hingga {new_until.strftime('%d %B %Y')}! Nikmati akses tak terbatas.")
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return jsonify({"status": "success", "premium_until": new_until.isoformat()}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return process_activation()

@app.route("/sh/user/quota-status", methods=["GET"])
@jwt_required()
def sh_quota_status():
    current_user = json.loads(get_jwt_identity())
    user_id = current_user['id']
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT membership_tier, premium_until, recommendation_count, referral_code FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
            
        tier = user["membership_tier"]
        premium_until = user["premium_until"]
        
        # Check if premium has expired
        if tier == 'premium' and premium_until and premium_until < datetime.now():
            cursor.execute("UPDATE users SET membership_tier = 'basic', premium_until = NULL, recommendation_count = 0 WHERE id = %s", (user_id,))
            conn.commit()
            tier = 'basic'
            premium_until = None
            user["recommendation_count"] = 0
            
        cursor.close()
        conn.close()
        
        return jsonify({
            "tier": tier,
            "premium_until": premium_until.isoformat() if premium_until else None,
            "quota_used": user["recommendation_count"],
            "quota_limit": FREE_QUOTA_LIMIT,
            "referral_code": user["referral_code"]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")
