-- ============================================
-- DATABASE BARU: smartherbal_db
-- Jalankan sekali untuk setup awal
-- ============================================

CREATE DATABASE IF NOT EXISTS smartherbal_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartherbal_db;

-- [1] Tabel pengguna utama SmartHerbal
--     Menyimpan akun, password, dan status membership
CREATE TABLE IF NOT EXISTS sh_users (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address      VARCHAR(100) UNIQUE NOT NULL,
    name                VARCHAR(150),
    password_hash       VARCHAR(255) NOT NULL,
    membership_tier     ENUM('basic', 'premium') DEFAULT 'basic',
    premium_until       DATETIME NULL,           -- NULL jika basic
    recommendation_count INT DEFAULT 0,          -- Counter lifetime penggunaan
    referral_code       VARCHAR(20) UNIQUE,      -- Kode unik user (e.g. HERB-A1B2)
    referred_by         VARCHAR(20) NULL,        -- Kode yang dipakai saat daftar
    created_at          DATETIME DEFAULT NOW(),
    last_login          DATETIME NULL
);

-- [2] Tabel riwayat rekomendasi SmartHerbal
--     Terpisah dari tabel riwayat_rekomendasi TA
CREATE TABLE IF NOT EXISTS sh_riwayat_rekomendasi (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    address     VARCHAR(100) NOT NULL,
    keluhan     TEXT,
    hasil_ai    JSON,
    mode        VARCHAR(100),
    tanggal     DATETIME DEFAULT NOW(),
    INDEX idx_address (address)
);

-- [3] Tabel transaksi membership (Midtrans)
CREATE TABLE IF NOT EXISTS sh_membership_transactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        VARCHAR(100) UNIQUE NOT NULL,
    wallet_address  VARCHAR(100) NOT NULL,
    amount          INT NOT NULL DEFAULT 5000,
    method          VARCHAR(50),
    status          ENUM('pending','success','failed','expired') DEFAULT 'pending',
    snap_token      VARCHAR(255),
    created_at      DATETIME DEFAULT NOW(),
    paid_at         DATETIME NULL,
    expires_at      DATETIME NULL
);

-- [4] Tabel pembayaran manual (fallback admin)
CREATE TABLE IF NOT EXISTS sh_manual_payments (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    wallet_address      VARCHAR(100) NOT NULL,
    amount              INT NOT NULL DEFAULT 5000,
    bukti_url           VARCHAR(500),
    activation_token    VARCHAR(20) UNIQUE,
    status              ENUM('pending_verification','approved','rejected') DEFAULT 'pending_verification',
    used                BOOLEAN DEFAULT FALSE,
    used_by             VARCHAR(100),
    used_at             DATETIME,
    created_at          DATETIME DEFAULT NOW()
);

-- [5] Log reward referral
CREATE TABLE IF NOT EXISTS sh_referral_rewards (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    referrer_address    VARCHAR(100),
    referred_address    VARCHAR(100),
    reward_days         INT,
    granted_at          DATETIME DEFAULT NOW()
);

-- [6] Notifikasi SmartHerbal (terpisah dari notifikasi TA)
CREATE TABLE IF NOT EXISTS sh_notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    address     VARCHAR(100) NOT NULL,
    pesan       TEXT,
    is_read     BOOLEAN DEFAULT FALSE,
    tanggal     DATETIME DEFAULT NOW(),
    INDEX idx_address (address)
);
