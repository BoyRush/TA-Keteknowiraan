import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HerbalDoctorDashboard() {
    const { address, role, loading } = useAuth();
    const [form, setForm] = useState({ name: '', indikasi: '', kontraindikasi: '', deskripsi: '' });
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== 'herbal_doctor') router.push('/');
    }, [role, loading, router]);

    // --- FUNGSI LOG ANALISIS DATA (BUKTI SIDANG) ---
    const logHerbalStorageProcess = (result, formData) => {
        console.log("\n" + "🌿".repeat(15));
        console.log("🔍 ANALISIS PENYIMPANAN PENGETAHUAN HERBAL");
        console.log("1. Data Input:", formData);
        
        if (result.ipfs_cid) {
            console.log("✅ SUMBER DATA PRIMER: IPFS");
            console.log(`🔗 CID Arsip: ${result.ipfs_cid}`);
            console.log(`🌐 Link Gateway: https://ipfs.io/ipfs/${result.ipfs_cid}`);
        }

        console.log("✅ SUMBER DATA SEKUNDER: ChromaDB (Vector Database)");
        console.log("🧠 Status: Terindeks untuk Semantic Search AI");
        console.log("🌿".repeat(15) + "\n");
    };

    const handleStoreHerbal = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            console.log("⏳ Memulai proses sinkronisasi IPFS & ChromaDB...");
            
            const response = await fetch('http://localhost:5000/herbal/store', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const result = await response.json();
            
            if (response.ok) {
                // PANGGIL LOG ANALISIS
                logHerbalStorageProcess(result, form);

                alert(`Sukses! Tersimpan di IPFS dengan CID: ${result.ipfs_cid}`);
                setForm({ name: '', indikasi: '', kontraindikasi: '', deskripsi: '' });
            } else {
                alert("Gagal menyimpan data.");
            }
        } catch (error) {
            console.error("Error Detail:", error);
            alert("Koneksi ke server Flask gagal.");
        } finally { setIsSaving(false); }
    };

    if (loading) return <p>Memverifikasi Role Herbal...</p>;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#2e7d32' }}>🌿 Dashboard Dokter Herbal</h1>
            <div style={{ background: '#f1f8e9', padding: '10px', borderRadius: '5px', marginBottom: '20px', borderLeft: '5px solid #2e7d32' }}>
                <p>Wallet: <code>{address}</code></p>
                <p style={{ fontSize: '12px' }}>💡 Cek **Console (F12)** untuk melihat bukti sinkronisasi IPFS.</p>
            </div>

            <form onSubmit={handleStoreHerbal} style={{ background: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #ddd' }}>
                <label><b>Nama Tanaman:</b></label>
                <input style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Contoh: Temulawak" required />
                
                <label><b>Indikasi (Kegunaan):</b></label>
                <input style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' }} value={form.indikasi} onChange={e => setForm({...form, indikasi: e.target.value})} placeholder="Contoh: Menambah nafsu makan" />
                
                <label><b>Kontraindikasi:</b></label>
                <input style={{ width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' }} value={form.kontraindikasi} onChange={e => setForm({...form, kontraindikasi: e.target.value})} placeholder="Dilarang untuk pasien penyakit..." />
                
                <label><b>Deskripsi Lengkap (RAG Context):</b></label>
                <textarea style={{ width: '100%', padding: '10px', margin: '10px 0', height: '100px', boxSizing: 'border-box' }} value={form.deskripsi} onChange={e => setForm({...form, deskripsi: e.target.value})} placeholder="Tulis cara olah di sini..." />

                <button type="submit" disabled={isSaving} style={{ width: '100%', padding: '15px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {isSaving ? "⏳ Sedang Mengunggah..." : "Simpan Pengetahuan Herbal"}
                </button>
            </form>
        </div>
    );
}