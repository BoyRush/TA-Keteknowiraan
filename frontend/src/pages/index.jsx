import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    // TAMBAHKAN 'address' di sini agar tidak error 'not defined'
    const { address, role, isConnected, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && isConnected && role) {
            if (role === 'patient') router.push('/patient/dashboard');
            if (role === 'doctor') router.push('/doctor/dashboard');
            if (role === 'doctor') router.push('/herbs/dashboard');
        }
    }, [role, loading, isConnected, router]);

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>Sistem Rekam Medis Herbal Blockchain</h1>
            {loading ? (
                <p>Sedang memverifikasi alamat wallet Anda...</p>
            ) : (
                <>
                    {isConnected && !role && (
                        <p style={{ color: 'red' }}>
                            Alamat {address} belum terdaftar sebagai Pasien/Dokter.
                        </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <w3m-button />
                    </div>
                </>
            )}
        </div>
    );
}