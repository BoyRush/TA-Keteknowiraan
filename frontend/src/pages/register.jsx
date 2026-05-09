import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState(''); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('patient');
    const [specialty, setSpecialty] = useState('');
    const [loading, setLoading] = useState(false);

    const [toast, setToast] = useState(null);
    const [popup, setPopup] = useState(null);
    const [inlineErrors, setInlineErrors] = useState({});
    const [pendingRedirect, setPendingRedirect] = useState(null); 
    const [documentFile, setDocumentFile] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRegister = async () => {
        setInlineErrors({}); 
        
        let errs = {};
        if (!username.trim()) errs.username = "Username wajib diisi!";
        if (!fullName.trim()) errs.fullName = "Nama lengkap wajib diisi!";
        if (!email.trim()) errs.email = "Email wajib diisi!";
        if (!password) errs.password = "Password tidak boleh kosong!";
        if (password && password !== confirmPassword) errs.confirmPassword = "Konfirmasi password tidak cocok!";
        if (role === 'doctor' && !specialty) errs.specialty = "Kategori spesialisasi dokter wajib dipilih!";
        if (role === 'doctor' && !documentFile) errs.document = "Dokumen STR/SIP wajib diunggah!";
        
        if (Object.keys(errs).length > 0) {
            setInlineErrors(errs);
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("username", username);
            formData.append("full_name", fullName);
            formData.append("email", email);
            formData.append("password", password);
            
            // "doctor" UI selection translates to either doctor or herbal_doctor in the backend logic, 
            // but for simplicity we can send role based on specialty.
            const finalRole = role === 'doctor' ? (specialty === 'Dokter Spesialis Herbal' ? 'herbal_doctor' : 'doctor') : 'patient';
            formData.append("role", finalRole);
            
            if (documentFile) {
                formData.append("document", documentFile);
            }

            const res = await axios.post('http://127.0.0.1:5000/auth/register', formData, {
                validateStatus: (status) => status < 500 
            });

            if (res.status === 409) {
                showToast("Username atau Email sudah digunakan", "error");
                setLoading(false);
                return;
            } else if (res.status !== 200 && res.status !== 201) {
                setLoading(false);
                return showToast(res.data.error || "Gagal mendaftar ke server", "error");
            }
            
            if (role === 'patient') {
                setPopup({ 
                    title: "Berhasil!", 
                    message: "Registrasi Pasien Berhasil! Anda akan dialihkan ke halaman Login." 
                });
                setPendingRedirect('/login');
            } else {
                setPopup({ 
                    title: "Berhasil!", 
                    message: "Registrasi Dokter Berhasil! Tunggu Approval Admin. Anda akan dialihkan ke halaman verifikasi." 
                });
                setPendingRedirect('/pending-verification');
            }

        } catch (error) {
            console.error(error);
            showToast("Proses registrasi gagal.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', background: '#f7fafc', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 24px', background: toast.type === 'success' ? '#38a169' : '#e53e3e', color: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 1000, fontWeight: 'bold', animation: 'fadeIn 0.3s' }}>
                    {toast.message}
                </div>
            )}

            {/* POPUP MODAL NOTIFICATION */}
            {popup && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 16px 0', color: '#2d3748', fontSize: '1.25rem' }}>{popup.title}</h3>
                        <p style={{ margin: '0 0 24px 0', color: '#4a5568', lineHeight: '1.5' }}>{popup.message}</p>
                        <button onClick={() => { setPopup(null); if (pendingRedirect) { router.push(pendingRedirect); setPendingRedirect(null); } }} style={{ padding: '10px 24px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            <div style={{ padding: '40px', width: '100%', maxWidth: '500px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <h2 style={{ textAlign: 'center', color: '#2d3748', marginBottom: '30px' }}>📝 Registrasi Akun</h2>

                <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} style={{ width: '100%' }}>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label>Username:</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        {inlineErrors.username && <p style={{ color: 'red', fontSize: '12px' }}>{inlineErrors.username}</p>}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Nama Lengkap:</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama Lengkap" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        {inlineErrors.fullName && <p style={{ color: 'red', fontSize: '12px' }}>{inlineErrors.fullName}</p>}
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label>Email:</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        {inlineErrors.email && <p style={{ color: 'red', fontSize: '12px' }}>{inlineErrors.email}</p>}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568' }}>Daftar Sebagai:</label>
                        <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0' }} onChange={(e) => setRole(e.target.value)}>
                            <option value="patient">Pasien</option>
                            <option value="doctor">Dokter</option>
                        </select>
                    </div>

                    {role === 'doctor' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Pilih Kategori Dokter:</label>
                            <div style={{ display: 'flex', gap: '20px', background: '#f7fafc', padding: '15px', borderRadius: '8px', border: `1px solid ${inlineErrors.specialty ? '#e53e3e' : '#e2e8f0'}` }}>
                                <label style={{ cursor: 'pointer' }}>
                                    <input type="radio" name="specialty" value="Dokter Umum" checked={specialty === "Dokter Umum"} onChange={(e) => { setSpecialty(e.target.value); setInlineErrors({...inlineErrors, specialty: null}); }} /> Dokter Umum
                                </label>
                                <label style={{ cursor: 'pointer' }}>
                                    <input type="radio" name="specialty" value="Dokter Spesialis Herbal" checked={specialty === "Dokter Spesialis Herbal"} onChange={(e) => { setSpecialty(e.target.value); setInlineErrors({...inlineErrors, specialty: null}); }} /> Dokter Herbal
                                </label>
                            </div>
                            {inlineErrors.specialty && <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '6px' }}>⚠️ {inlineErrors.specialty}</p>}
                            
                            <label style={{ display: 'block', margin: '20px 0 8px 0', fontWeight: 'bold' }}>Upload STR / SIP (PDF/JPG/PNG):</label>
                            <input 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={(e) => { setDocumentFile(e.target.files[0]); setInlineErrors({...inlineErrors, document: null}); }}
                                style={{ width: '100%', padding: '10px', background: '#fff', borderRadius: '8px', border: `1px solid ${inlineErrors.document ? '#e53e3e' : '#cbd5e0'}` }}
                            />
                            {inlineErrors.document && <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '6px' }}>⚠️ {inlineErrors.document}</p>}
                        </div>
                    )}
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568' }}>Buat Password:</label>
                        <input 
                            type="password" 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${inlineErrors.password ? '#e53e3e' : '#cbd5e0'}`, outline: 'none' }} 
                            onChange={(e) => { setPassword(e.target.value); setInlineErrors({...inlineErrors, password: null}); }} 
                            placeholder="Masukkan password" 
                        />
                        {inlineErrors.password && <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '6px' }}>⚠️ {inlineErrors.password}</p>}
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', color: '#4a5568' }}>Konfirmasi Password:</label>
                        <input 
                            type="password" 
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${inlineErrors.confirmPassword ? '#e53e3e' : '#cbd5e0'}`, outline: 'none' }} 
                            onChange={(e) => { setConfirmPassword(e.target.value); setInlineErrors({...inlineErrors, confirmPassword: null}); }} 
                            placeholder="Ulangi password" 
                        />
                        {inlineErrors.confirmPassword && <p style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '6px' }}>⚠️ {inlineErrors.confirmPassword}</p>}
                    </div>

                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#2f855a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Sedang Mendaftar...' : 'Daftar Sekarang'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: '#718096' }}>
                        Sudah punya akun?{' '}
                        <span onClick={() => router.push('/login')} style={{ color: '#3182ce', cursor: 'pointer', textDecoration: 'underline' }}>
                            Login di sini
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