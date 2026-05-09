-- ============================================
-- SCRIPT MIGRASI WEB3 KE WEB2 (MYSQL CRUD)
-- Sesuai dengan progres normalisasi database
-- Asumsi: Reset Database dari 0
-- ============================================

CREATE DATABASE IF NOT EXISTS smartherbal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartherbal_db;

-- Menghapus tabel lama jika ada (Urutan disesuaikan dengan FK)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS sh_notifications;
DROP TABLE IF EXISTS sh_riwayat_rekomendasi;
DROP TABLE IF EXISTS sh_premium_tokens;
DROP TABLE IF EXISTS sh_manual_payments;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS herbal_catalogs;
DROP TABLE IF EXISTS access_permissions;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 1. TABEL INTI: USERS (Identitas Global)
-- ============================================
CREATE TABLE users (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    username            VARCHAR(50) UNIQUE NOT NULL,
    email               VARCHAR(100) UNIQUE NULL,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(150) NOT NULL,
    role                ENUM('admin', 'patient', 'doctor', 'herbal_doctor') NOT NULL DEFAULT 'patient',
    
    -- Status & Verifikasi
    verification_status ENUM('pending', 'approved', 'rejected', 'revoked') DEFAULT 'pending',
    document_url        VARCHAR(255) NULL, -- Path file lokal untuk STR/SIP
    rejection_reason    TEXT NULL,
    
    -- SmartHerbal Specific
    membership_tier     ENUM('basic', 'premium') DEFAULT 'basic',
    premium_until       DATETIME NULL,
    recommendation_count INT DEFAULT 0,
    referral_code       VARCHAR(20) UNIQUE NULL,
    
    created_at          DATETIME DEFAULT NOW(),
    last_login          DATETIME NULL
);

-- ============================================
-- 2. TABEL PROFIL PASIEN (Extended Data)
-- ============================================
CREATE TABLE patients (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL UNIQUE,
    gender      ENUM('L', 'P') NULL,
    birth_date  DATE NULL,
    address     TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. TABEL PROFIL DOKTER (Extended Data)
-- ============================================
CREATE TABLE doctors (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL UNIQUE,
    specialization  VARCHAR(100) NULL,
    hospital_name   VARCHAR(150) NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 4. TABEL KATALOG HERBAL (Knowledge Base)
--    Diisi oleh Dokter Herbal (herbal_doctor)
--    Menjadi Source of Truth untuk RAG Pipeline
-- ============================================
CREATE TABLE herbal_catalogs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id       INT NOT NULL,               -- Dokter herbal yang menambahkan (audit trail)
    nama            VARCHAR(255) NOT NULL,       -- Nama tanaman herbal
    indikasi        TEXT NOT NULL,               -- Khasiat/manfaat (keyword utama untuk Vector Search)
    kontraindikasi  TEXT NOT NULL,               -- Pantangan/larangan (keselamatan AI)
    deskripsi       TEXT NULL,                   -- Penjelasan botani / detail tambahan
    is_active       BOOLEAN DEFAULT TRUE,        -- Soft-delete: FALSE = AI tidak merekomendasikan
    chroma_doc_id   VARCHAR(100) NULL,           -- ID dokumen di ChromaDB (untuk Update/Delete vektor)
    created_at      DATETIME DEFAULT NOW(),
    updated_at      DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- ============================================
-- 5. TABEL IZIN AKSES (Many-to-Many)
-- ============================================
CREATE TABLE access_permissions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT NOT NULL, -- FK ke patients.id
    doctor_id       INT NOT NULL, -- FK ke doctors.id
    status          ENUM('pending', 'approved', 'rejected', 'revoked') DEFAULT 'pending',
    requested_at    DATETIME DEFAULT NOW(),
    approved_at     DATETIME NULL,
    rejected_at     DATETIME NULL,
    UNIQUE KEY unique_access (patient_id, doctor_id),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- ============================================
-- 5. TABEL REKAM MEDIS (Normalized)
-- ============================================
CREATE TABLE medical_records (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT NOT NULL,
    doctor_id       INT NOT NULL,
    diagnosis       TEXT NOT NULL,
    symptoms        TEXT NULL,
    treatment       TEXT NULL,
    notes           TEXT NULL,
    created_at      DATETIME DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- ============================================
-- 6. TABEL RIWAYAT REKOMENDASI AI
-- ============================================
CREATE TABLE sh_riwayat_rekomendasi (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    patient_id      INT NOT NULL,
    keluhan         TEXT,
    hasil_ai        JSON,
    mode            VARCHAR(100),
    tanggal         DATETIME DEFAULT NOW(),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- ============================================
-- 7. TABEL NOTIFIKASI
-- ============================================
CREATE TABLE sh_notifications (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    pesan           TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    tanggal         DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 8. TABEL PREMIUM & PAYMENTS
-- ============================================
CREATE TABLE sh_premium_tokens (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    token_code      VARCHAR(20) NOT NULL UNIQUE,
    status          ENUM('ACTIVE', 'USED') DEFAULT 'ACTIVE',
    used_by_user_id INT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at         TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (used_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE sh_manual_payments (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT NOT NULL,
    amount              INT NOT NULL DEFAULT 5000,
    bukti_url           VARCHAR(500),
    activation_token    VARCHAR(20) UNIQUE,
    status              ENUM('pending_verification','approved','rejected') DEFAULT 'pending_verification',
    created_at          DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- SEED DATA: ADMIN DEFAULT
-- ============================================
INSERT INTO users (username, email, password_hash, full_name, role, verification_status) 
VALUES ('admin', 'admin@smartherbal.com', 'scrypt:32768:8:1$PZgPtn1FQHyiqylk$8e6877dff493e19a38dc920b852dd7099645699c5efe929583427ee6eb0bbf311966c99db898cf995bdd288e0881ab081055395b6e0e1a487960db714bbde41e', 'Administrator Sistem', 'admin', 'approved');
