import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

export default function HerbalDoctorDashboard() {
    const { address, role, loading } = useAuth();
    const [form, setForm] = useState({ id: null, name: '', indikasi: '', kontraindikasi: '', deskripsi: '' });
    const [herbalList, setHerbalList] = useState([]); 
    const [isSaving, setIsSaving] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const router = useRouter();

    // 1. Fungsi Fetch Data - Dibuat stabil dengan useCallback
    const fetchHerbalData = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/herbal/all');
            if (!res.ok) throw new Error("Server error");
            const data = await res.json();
            
            console.log("📥 Data masuk ke Dashboard:", data);
            // Pastikan data yang masuk adalah Array
            setHerbalList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("❌ Gagal mengambil data tabel:", err);
            setHerbalList([]);
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    // 2. Proteksi Akses & Inisialisasi Data
    useEffect(() => {
        if (!loading) {
            if (role === 'herbal_doctor') {
                fetchHerbalData();
            } else {
                router.push('/');
            }
        }
    }, [role, loading, fetchHerbalData]); // router sengaja tidak dimasukkan untuk cegah loop

    // 3. Handler Simpan (Create & Update)
    const handleStoreHerbal = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const isUpdate = !!form.id;
            const url = isUpdate 
                ? `http://localhost:5000/herbal/update/${form.id}` 
                : 'http://localhost:5000/herbal/store';
            
            const response = await fetch(url, {
                method: isUpdate ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (response.ok) {
                alert(isUpdate ? "✅ Data diperbarui!" : "✅ Data tersimpan ke Blockchain & AI!");
                setForm({ id: null, name: '', indikasi: '', kontraindikasi: '', deskripsi: '' });
                fetchHerbalData(); // Refresh tabel
            } else {
                alert("❌ Gagal menyimpan data.");
            }
        } catch (error) {
            alert("❌ Terjadi kesalahan koneksi server.");
        } finally {
            setIsSaving(false);
        }
    };

    // 4. Handler Hapus
    const handleDelete = async (id) => {
        if (!window.confirm("Hapus permanen data ini dari Blockchain & AI?")) return;
        try {
            const res = await fetch(`http://localhost:5000/herbal/delete/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert("🗑️ Data berhasil dihapus!");
                fetchHerbalData();
            }
        } catch (err) {
            alert("❌ Gagal menghapus.");
        }
    };

    const handleEdit = (herb) => {
        setForm({
            id: herb.id,
            name: herb.nama,
            indikasi: herb.indikasi,
            kontraindikasi: herb.kontraindikasi,
            deskripsi: herb.deskripsi
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading || isInitialLoading) return (
        <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
            <p>⌛ Memverifikasi Otoritas Dokter Herbal...</p>
        </div>
    );

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#1b5e20', display: 'flex', alignItems: 'center', gap: '10px' }}>
                🌿 <span>Dashboard Pengetahuan Herbal</span>
            </h1>

            <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '30px', borderLeft: '5px solid #2e7d32' }}>
                <p style={{ margin: 0, fontSize: '14px' }}><b>Dokter:</b> {address}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#444' }}>Status: <b>Verified Blockchain Authority</b></p>
            </div>

            {/* FORM INPUT */}
            <form onSubmit={handleStoreHerbal} style={formBoxStyle}>
                <h3 style={{ marginTop: 0 }}>{form.id ? "✏️ Edit Pengetahuan" : "➕ Tambah Pengetahuan Baru"}</h3>
                <div style={gridStyle}>
                    <div>
                        <label>Nama Tanaman</label>
                        <input style={inputStyle} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Contoh: Kunyit" required />
                    </div>
                    <div>
                        <label>Indikasi (Kegunaan)</label>
                        <input style={inputStyle} value={form.indikasi} onChange={e => setForm({...form, indikasi: e.target.value})} placeholder="Contoh: Perut kembung, Maag" required />
                    </div>
                </div>
                <label>Kontraindikasi</label>
                <input style={inputStyle} value={form.kontraindikasi} onChange={e => setForm({...form, kontraindikasi: e.target.value})} placeholder="Contoh: Penderita batu empedu" />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={isSaving} style={btnStyle}>
                        {isSaving ? "⌛ Memproses..." : (form.id ? "Update Data" : "Simpan Ke Jaringan")}
                    </button>
                    {form.id && (
                        <button type="button" onClick={() => setForm({id:null, name:'', indikasi:'', kontraindikasi:'', deskripsi:''})} style={cancelBtnStyle}>Batal</button>
                    )}
                </div>
            </form>

            {/* TABEL DATA */}

            <h3 style={{ color: '#1b5e20', borderBottom: '2px solid #2e7d32', paddingBottom: '10px' }}>📋 Database Herbal Terverifikasi</h3>
            <div style={{ overflowX: 'auto', background: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#2e7d32', color: 'white' }}>
                            <th style={tdStyle}>Nama Tanaman</th>
                            <th style={tdStyle}>Indikasi</th>
                            {/* TAMBAHKAN KOLOM INI */}
                            <th style={tdStyle}>Kontraindikasi</th> 
                            <th style={tdStyle}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {herbalList.length > 0 ? herbalList.map((herb) => (
                            <tr key={herb.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tdStyle}><b>{herb.nama}</b></td>
                                <td style={tdStyle}>{herb.indikasi}</td>
                                {/* TAMPILKAN DATA KONTRAINDIKASI DI SINI */}
                                <td style={tdStyle}> {herb.kontraindikasi || '-'} </td>
                                <td style={tdStyle}>
                                    <button onClick={() => handleEdit(herb)} style={editBtnStyle}>Edit</button>
                                    <button onClick={() => handleDelete(herb.id)} style={deleteBtnStyle}>Hapus</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    {isInitialLoading ? "Sedang memuat data..." : "Belum ada data herbal yang terdaftar."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- STYLES ---
const formBoxStyle = { background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '40px', border: '1px solid #e0e0e0' };
const gridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' };
const inputStyle = { width: '100%', padding: '12px', margin: '8px 0 16px 0', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' };
const btnStyle = { flex: 2, padding: '15px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { flex: 1, padding: '15px', background: '#757575', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const tdStyle = { padding: '15px', textAlign: 'left', fontSize: '14px' };
const editBtnStyle = { marginRight: '8px', padding: '8px 15px', background: '#0288d1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const deleteBtnStyle = { padding: '8px 15px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };