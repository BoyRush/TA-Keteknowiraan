import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { loginWithPassword } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState(null);
    const [popup, setPopup] = useState(null);
    const [inlineErrors, setInlineErrors] = useState({});

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setInlineErrors({}); 

        let errs = {};
        if (!username) errs.username = "Username tidak boleh kosong!";
        if (!password) errs.password = "Password tidak boleh kosong!";

        if (Object.keys(errs).length > 0) {
            setInlineErrors(errs);
            return;
        }

        setLoading(true);
        try {
            const result = await loginWithPassword(username, password);

            if (result.success) {
                showToast("Login Berhasil", "success");
            } else {
                setInlineErrors({ api: result.error || "Login gagal. Cek kembali username/password." });
            }
        } catch (error) {
            showToast("Terjadi kesalahan sistem", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', fontFamily: 'Inter, sans-serif' }}>
            
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', background: toast.type === 'success' ? '#38a169' : '#e53e3e', color: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 1000, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
                    {toast.message}
                </div>
            )}

            <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <h1 style={{ color: '#2d3748', marginBottom: '24px' }}>🌿 Herbal Chain AI</h1>
                
                <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568' }}>Username:</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (inlineErrors.username || inlineErrors.api) {
                                    setInlineErrors(prev => ({ ...prev, username: "", api: "" }));
                                }
                            }}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: `1px solid ${inlineErrors.username ? '#e53e3e' : '#cbd5e0'}`, 
                                outline: 'none' 
                            }}
                            placeholder="Masukkan username Anda"
                        />
                        {inlineErrors.username && (
                            <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '6px', marginBottom: 0 }}>
                                ⚠️ {inlineErrors.username}
                            </p>
                        )}
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568' }}>Password:</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (inlineErrors.password || inlineErrors.api) {
                                    setInlineErrors(prev => ({ ...prev, password: "", api: "" }));
                                }
                            }}
                            style={{ 
                                width: '100%', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: `1px solid ${inlineErrors.password || inlineErrors.api ? '#e53e3e' : '#cbd5e0'}`, 
                                outline: 'none' 
                            }}
                            placeholder="Masukkan password Anda"
                        />
                        {(inlineErrors.password || inlineErrors.api) && (
                            <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '6px', marginBottom: 0 }}>
                                ⚠️ {inlineErrors.password || inlineErrors.api}
                            </p>
                        )}
                    </div>
                    
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '1rem', cursor: 'pointer', background: '#38a169', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Memproses...' : 'Login Aplikasi'}
                    </button>
                    
                    <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#718096' }}>
                        Belum punya akun?{' '}
                        <span onClick={() => router.push('/register')} style={{ color: '#3182ce', cursor: 'pointer', textDecoration: 'underline' }}>
                            Daftar di sini
                        </span>
                    </p>
                </form>
            </div>
            
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}