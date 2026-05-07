import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function UpgradeBanner() {
    const { membership } = useAuth();
    const router = useRouter();

    if (!membership || membership.tier === 'premium') return null;

    const remaining = membership.quotaLimit - membership.quotaUsed;
    if (remaining > 1) return null; // Hanya tampil jika sisa <= 1

    return (
        <div style={{
            backgroundColor: remaining === 0 ? '#FEF2F2' : '#FFFBEB',
            borderLeft: `4px solid ${remaining === 0 ? '#EF4444' : '#F59E0B'}`,
            padding: '16px',
            marginBottom: '24px',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
            <div>
                <h4 style={{ margin: 0, color: remaining === 0 ? '#991B1B' : '#B45309', fontWeight: 600, fontSize: '16px' }}>
                    {remaining === 0 ? 'Kuota Rekomendasi Habis' : 'Sisa 1 Rekomendasi Gratis!'}
                </h4>
                <p style={{ margin: '4px 0 0', color: '#4B5563', fontSize: '14px' }}>
                    {remaining === 0 
                        ? 'Anda telah menggunakan semua batas percobaan gratis. Upgrade ke Premium untuk akses tanpa batas.' 
                        : 'Setelah ini, Anda perlu berlangganan Premium untuk mendapatkan rekomendasi lanjutan.'}
                </p>
            </div>
            <button
                onClick={() => router.push('/upgrade')}
                style={{
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}
            >
                ✨ Upgrade Sekarang
            </button>
        </div>
    );
}
