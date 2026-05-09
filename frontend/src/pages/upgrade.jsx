import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../context/AuthContext';
import { QrCode, MessageCircle, Key, CheckCircle } from 'lucide-react';

export default function UpgradePage() {
    const { address, membership, refreshMembership } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [tokenManual, setTokenManual] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPayment, setShowPayment] = useState(false);

    useEffect(() => {
        if (membership?.tier === 'premium') {
            router.push('/patient/dashboard');
        }
    }, [membership, router]);

    const handleActivateManual = async () => {
        if (!tokenManual) return setErrorMsg('Silakan masukkan token aktivasi terlebih dahulu');
        setErrorMsg('');
        setLoading(true);

        try {
            const token = localStorage.getItem('herbalchain_token');
            const res = await fetch('http://127.0.0.1:5000/sh/membership/activate-token', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ token: tokenManual })
            });
            const data = await res.json();

            if (res.ok) {
                await refreshMembership(address);
                setSuccessMsg('Token berhasil diaktivasi! Selamat datang di Premium.');
                setTimeout(() => router.push('/patient/dashboard'), 2000);
            } else {
                setErrorMsg(data.error || 'Gagal mengaktivasi token');
            }
        } catch (e) {
            setErrorMsg('Terjadi kesalahan koneksi saat aktivasi');
        }
        setLoading(false);
    };

    const handleConfirmWA = () => {
        const message = encodeURIComponent("Halo Admin SmartHerbal, saya sudah melakukan pembayaran untuk akun Premium. Mohon konfirmasi dan berikan Token Aktivasi saya. Terima kasih.");
        window.open(`https://wa.me/6285365205722?text=${message}`, '_blank');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            <Head>
                <title>Upgrade Premium - SmartHerbal</title>
            </Head>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>
                        Tingkatkan Pengalaman Sehat Anda
                    </h1>
                    <p style={{ fontSize: '18px', color: '#4B5563', maxWidth: '600px', margin: '0 auto' }}>
                        Dapatkan akses rekomendasi tak terbatas dan fitur eksklusif SmartHerbal Premium.
                    </p>
                </div>

                {errorMsg && (
                    <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', fontWeight: 500 }}>
                        {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <CheckCircle size={20} />
                        {successMsg}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                    {/* Basic Plan */}
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#374151' }}>Basic</h2>
                        <div style={{ fontSize: '36px', fontWeight: 800, margin: '16px 0', color: '#111827' }}>Gratis</div>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>Untuk Anda yang ingin mencoba.</p>
                        
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
                            <li style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6', color: '#4B5563' }}>✅ Maksimal 3x Rekomendasi</li>
                            <li style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6', color: '#4B5563' }}>✅ Riwayat Tersimpan</li>
                            <li style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6', color: '#9CA3AF' }}>❌ Detail Kandungan Terkunci</li>
                            <li style={{ padding: '12px 0', color: '#9CA3AF' }}>❌ Tanpa Konsultasi</li>
                        </ul>
                        
                        <button disabled style={{ marginTop: '24px', width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#9CA3AF', fontWeight: 600 }}>
                            Saat Ini
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', border: '2px solid #F59E0B', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#F59E0B', color: 'white', padding: '4px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                            TERBAIK
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#B45309' }}>✨ Premium</h2>
                        <div style={{ fontSize: '36px', fontWeight: 800, margin: '16px 0', color: '#111827' }}>Rp 5.000<span style={{ fontSize: '16px', fontWeight: 500, color: '#6B7280' }}>/bln</span></div>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>Akses penuh tanpa batas.</p>
                        
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, flex: 1 }}>
                            <li style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6', color: '#111827', fontWeight: 500 }}>✨ Rekomendasi Tak Terbatas</li>
                            <li style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6', color: '#111827', fontWeight: 500 }}>✨ Riwayat Unlimited</li>
                            <li style={{ padding: '12px 0', borderBottom: '1px solid #F3F4F6', color: '#111827', fontWeight: 500 }}>✨ Akses Penuh Detail Kandungan</li>
                            <li style={{ padding: '12px 0', color: '#111827', fontWeight: 500 }}>✨ Fitur Tambahan (Eksklusif)</li>
                        </ul>
                        
                        <button 
                            onClick={() => setShowPayment(true)}
                            style={{ marginTop: '24px', width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#10B981', color: 'white', fontWeight: 600, fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                        >
                            Transaksi Sekarang
                        </button>
                    </div>
                </div>

                {/* Section Pembayaran & Aktivasi (Muncul saat diklik Transaksi Sekarang) */}
                {showPayment && (
                    <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #E5E7EB', animation: 'fadeIn 0.5s ease', marginBottom: '40px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Langkah Pembayaran & Aktivasi</h3>
                            <p style={{ color: '#4B5563' }}>Selesaikan pembayaran dan dapatkan token aktivasi dari Admin.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            {/* Kiri: QRIS & Konfirmasi */}
                            <div style={{ padding: '24px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px dashed #D1D5DB', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', color: '#374151', fontWeight: 600 }}>
                                    <QrCode size={20} />
                                    <span>1. Scan QR Code Berikut</span>
                                </div>
                                
                                {/* Container QR Code Premium */}
                                <div className="qr-premium-container">
                                    <div className="qr-wrapper">
                                        <img 
                                            src="/qris-payment.png" 
                                            alt="QRIS Payment" 
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                            className="qr-image"
                                        />
                                        <div className="qr-fallback">
                                            <QrCode size={64} />
                                            <span>QRIS Payment</span>
                                        </div>
                                    </div>
                                    <div className="qr-overlay">
                                        <div className="corner top-left"></div>
                                        <div className="corner top-right"></div>
                                        <div className="corner bottom-left"></div>
                                        <div className="corner bottom-right"></div>
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: '20px', fontSize: '15px', color: '#1F2937', fontWeight: 600 }}>
                                    Transfer Nominal: <span style={{ color: '#059669', fontSize: '18px' }}>Rp 5.000</span>
                                </div>

                                <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '24px 0' }} />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', color: '#374151', fontWeight: 600 }}>
                                    <MessageCircle size={20} />
                                    <span>2. Konfirmasi ke WhatsApp</span>
                                </div>
                                <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                                    Apabila telah melakukan pembayaran, mohon melakukan konfirmasi ke WhatsApp Admin untuk mendapatkan token aktivasi premium.
                                </p>
                                <button 
                                    onClick={handleConfirmWA}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#25D366', color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                                >
                                    <MessageCircle size={18} />
                                    Chat Admin Sekarang
                                </button>
                            </div>

                            {/* Kanan: Input Token */}
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#374151', fontWeight: 600 }}>
                                    <Key size={20} />
                                    <span>3. Masukkan Token Aktivasi</span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '24px' }}>
                                    Jika Anda sudah mendapatkan Token dari Admin, masukkan kode tersebut di bawah ini untuk mengaktifkan Premium Anda.
                                </p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Contoh: SH-A1B2C3D4" 
                                        value={tokenManual}
                                        onChange={(e) => setTokenManual(e.target.value.toUpperCase())}
                                        style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '2px solid #D1D5DB', outline: 'none', fontSize: '16px', fontWeight: 600, letterSpacing: '1px', textAlign: 'center', textTransform: 'uppercase' }}
                                    />
                                    <button 
                                        onClick={handleActivateManual}
                                        disabled={loading}
                                        style={{ width: '100%', padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: 'white', fontWeight: 600, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                                    >
                                        {loading ? 'Memproses Aktivasi...' : 'Aktivasi Token Sekarang'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style jsx>{`
                .qr-premium-container {
                    position: relative;
                    width: 220px;
                    height: 220px;
                    margin: 0 auto;
                    padding: 10px;
                    background: white;
                    border-radius: 16px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s ease;
                }
                .qr-premium-container:hover {
                    transform: scale(1.02);
                }
                .qr-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border-radius: 8px;
                    background: #F3F4F6;
                }
                .qr-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                .qr-fallback {
                    display: none;
                    flex-direction: column;
                    align-items: center;
                    color: #9CA3AF;
                    gap: 8px;
                }
                .qr-overlay {
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                }
                .corner {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border: 3px solid #10B981;
                }
                .top-left { top: 0; left: 0; border-right: none; border-bottom: none; border-top-left-radius: 12px; }
                .top-right { top: 0; right: 0; border-left: none; border-bottom: none; border-top-right-radius: 12px; }
                .bottom-left { bottom: 0; left: 0; border-right: none; border-top: none; border-bottom-left-radius: 12px; }
                .bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; border-bottom-right-radius: 12px; }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
