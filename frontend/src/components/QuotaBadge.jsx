import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';

export default function QuotaBadge() {
    const { membership } = useAuth();
    const router = useRouter();

    if (!membership) return null;

    const isPremium = membership.tier === 'premium';
    const remaining = membership.quotaLimit - membership.quotaUsed;
    const isBasicEmpty = !isPremium && remaining <= 0;

    return (
        <div 
            onClick={() => !isPremium && router.push('/upgrade')}
            style={{
                background: isPremium ? 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)' : (isBasicEmpty ? '#FEE2E2' : '#F3F4F6'),
                color: isPremium ? '#422006' : (isBasicEmpty ? '#991B1B' : '#374151'),
                padding: '12px 16px',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                cursor: isPremium ? 'default' : 'pointer',
                border: `1px solid ${isPremium ? '#FDE047' : (isBasicEmpty ? '#FCA5A5' : '#E5E7EB')}`,
                boxShadow: isPremium ? '0 4px 6px -1px rgba(253, 224, 71, 0.3)' : 'none',
                transition: 'all 0.2s',
                marginTop: 'auto',
                marginBottom: '1rem'
            }}
            className="hover:opacity-90"
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isPremium ? '✨ Premium Aktif' : '🌿 Basic Plan'}
                </span>
                {!isPremium && <span style={{ fontSize: '12px', fontWeight: 500 }}>{isBasicEmpty ? 'Habis' : `${membership.quotaUsed}/${membership.quotaLimit}`}</span>}
            </div>
            
            {!isPremium ? (
                <div style={{ width: '100%', backgroundColor: isBasicEmpty ? '#FCA5A5' : '#D1D5DB', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${(membership.quotaUsed / membership.quotaLimit) * 100}%`, 
                        backgroundColor: isBasicEmpty ? '#DC2626' : '#10B981', 
                        height: '100%' 
                    }} />
                </div>
            ) : (
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Akses Rekomendasi Tak Terbatas</div>
            )}

            {!isPremium && (
                <div style={{ fontSize: '11px', marginTop: '4px', textAlign: 'center', color: '#6B7280' }}>
                    Klik untuk upgrade
                </div>
            )}
        </div>
    );
}
