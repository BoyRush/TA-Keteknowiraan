import { useAuth } from '../../context/AuthContext';
import { CONTRACT_ADDRESS, HEALTH_RECORD_ABI } from '../../api/contract_abi';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PatientDashboard() {
    const { address, role, loading } = useAuth();
    const [pendingDocs, setPendingDocs] = useState([]);
    const [approvedDocs, setApprovedDocs] = useState([]); 
    const [medicalRecords, setMedicalRecords] = useState([]); // STATE BARU UNTUK DATA MEDIS
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const [keluhan, setKeluhan] = useState('');
    const [rekomendasi, setRekomendasi] = useState(null);
    const [isRecommending, setIsRecommending] = useState(false);

    useEffect(() => {
        if (!loading && role !== 'patient') {
            router.push('/'); 
        }
    }, [role, loading, router]);

    // FUNGSI UTAMA: Load semua data dari Blockchain
    const loadRequests = async () => {
        if (!window.ethereum || !address) return;

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // --- PERBAIKAN DI SINI ---
            // Ambil signer agar msg.sender terbaca oleh Smart Contract
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);
            // -------------------------
            
            const patientChecksum = ethers.utils.getAddress(address.toLowerCase());
            
            // Pastikan alamat ini adalah Account (1) di Ganache kamu
            const doctorAddr = "0xbef4a50d20216f69482f0545ac35ce3be2ad89a2";
            const doctorChecksum = ethers.utils.getAddress(doctorAddr.toLowerCase());

            console.log("Memanggil data untuk Pasien:", patientChecksum, "dan Dokter:", doctorChecksum);

            // 1. Tarik status izin
            // Fungsi ini sekarang tidak akan 'Access denied' karena sudah membawa identitas (signer)
            const rawPending = await contract.pendingRequests(patientChecksum, doctorChecksum);
            const rawAccess = await contract.checkAccess(patientChecksum, doctorChecksum);

            setApprovedDocs(rawAccess ? [doctorChecksum] : []);
            if (rawAccess) {
                setPendingDocs([]);
            } else {
                setPendingDocs(rawPending ? [doctorChecksum] : []);
            }

            // 2. Tarik Data Rekam Medis
            // Menggunakan address pasien saat ini untuk menarik data miliknya sendiri
            const records = await contract.getMedicalRecords(patientChecksum);
            console.log("=== DATA MEDIS DARI BLOCKCHAIN ===", records);
            setMedicalRecords(records);

        } catch (error) {
            console.error("Gagal baca data blockchain:", error);
            // Tips: Lihat di console jika ada "revert Access denied" lagi, 
            // pastikan alamat wallet di MetaMask sama dengan patientChecksum
        }
    };

    const handleGetAIRecommendation = async () => {
        setIsRecommending(true);
        try {
            // Ambil data medis terakhir dari state medicalRecords yang sudah kita buat tadi
            // Kita gabungkan semua diagnosa menjadi string (contoh: "Hipertensi, Jantung")
            const kondisiMedis = medicalRecords.map(r => r.cid).join(', ');

            const response = await fetch('http://localhost:5000/herbal/recommendation-input?q=' + keluhan + '&medical=' + kondisiMedis);
            const data = await response.json();
            
            setRekomendasi(data);
        } catch (error) {
            console.error("Gagal mengambil rekomendasi AI:", error);
            alert("Pastikan Flask Backend (app.py) sudah dijalankan!");
        } finally {
            setIsRecommending(false);
        }
    };

    const handleGrant = async (docAddr) => {
        setIsProcessing(true);
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);
            const formattedDoc = ethers.utils.getAddress(docAddr.toLowerCase());
            
            const tx = await contract.grantAccess(formattedDoc);
            alert("Menunggu konfirmasi blockchain...");
            await tx.wait(); 
            
            alert("Akses berhasil diberikan!");
            await loadRequests(); 
        } catch (error) {
            console.error("Transaksi gagal:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    useEffect(() => {
         const initLoad = async () => {
            if (!loading && address && role === 'patient') {
                console.log("Memanggil Blockchain...");
                await loadRequests();
            }
        };

        initLoad();
        // Dependency 'loading' ditambahkan agar dia menunggu AuthContext selesai cek wallet
    }, [address, role, loading]);

    if (loading) return <p style={{ padding: '40px', textAlign: 'center' }}>Memverifikasi akses blockchain...</p>;

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ color: '#2c3e50' }}>🌿 Dashboard Pasien</h1>
            
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', borderLeft: '5px solid #28a745', marginBottom: '30px' }}>
                <p><strong>Wallet Anda:</strong> <code>{address}</code></p>
            </div>

            {/* SEKSI 1: REQUEST MASUK */}
            <h3>🔔 Permintaan Akses</h3>
            {pendingDocs.length === 0 ? (
                <p style={{ color: '#888', fontStyle: 'italic' }}>Tidak ada permintaan tertunda.</p>
            ) : (
                pendingDocs.map(doc => (
                    <div key={doc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ffeeba', padding: '15px', borderRadius: '8px', background: '#fff9e6', marginBottom: '10px' }}>
                        <code>{doc}</code>
                        <button onClick={() => handleGrant(doc)} disabled={isProcessing} style={{ background: '#ffc107', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isProcessing ? "Proses..." : "Setujui Akses"}
                        </button>
                    </div>
                ))
            )}

            <hr style={{ margin: '40px 0' }} />

            {/* SEKSI 2: REKAM MEDIS ANDA (HASIL INPUT DOKTER) */}
            <h3 style={{ color: '#0070f3' }}>📄 Rekam Medis Anda</h3>
            {medicalRecords.length === 0 ? (
                <p style={{ color: '#888' }}>Belum ada rekam medis tersimpan.</p>
            ) : (
                <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f4f4f4' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Waktu</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Keterangan / CID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {medicalRecords.map((rec, index) => (
                                <tr key={index}>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eee', fontSize: '0.8rem' }}>
                                        {new Date(rec.timestamp * 1000).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                        <code>{rec.cid}</code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ height: '40px' }}></div>

            {/* SEKSI 3: DOKTER AKTIF */}
            <h3 style={{ color: '#28a745' }}>✅ Dokter Berizin</h3>
            {approvedDocs.map(doc => (
                <div key={doc} style={{ padding: '15px', borderRadius: '8px', background: '#eaffea', border: '1px solid #c3e6cb' }}>
                    <code>{doc}</code>
                    <span style={{ marginLeft: '10px', color: '#155724', fontWeight: 'bold', fontSize: '0.8rem' }}>● AKTIF</span>
                </div>
            ))}

            {/* SEKSI BARU: AI HERBAL RECOMMENDATION */}
            <div style={{ marginTop: '40px', padding: '20px', background: '#f0fff4', borderRadius: '15px', border: '2px solid #28a745' }}>
                <h3>🤖 AI Rekomendasi Herbal (RAG + Rules)</h3>
                <p style={{ fontSize: '0.9rem' }}>Sistem akan menganalisis keluhan Anda berdasarkan riwayat penyakit di Blockchain.</p>
                
                <input 
                    type="text" 
                    placeholder="Apa yang Anda rasakan? (Contoh: Susah tidur)" 
                    value={keluhan}
                    onChange={(e) => setKeluhan(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px' }}
                />
                
                <button 
                    onClick={handleGetAIRecommendation}
                    disabled={isRecommending || !keluhan}
                    style={{ width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {isRecommending ? "Menganalisis..." : "Tanya AI Rekomendasi"}
                </button>

                {rekomendasi && (
                    <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '10px', borderLeft: '5px solid #0070f3' }}>
                        <h4>🌿 Hasil Analisis Pakar Herbal:</h4>
                        
                        {/* Jika ada rekomendasi yang divalidasi */}
                        {rekomendasi.rekomendasi && rekomendasi.rekomendasi.length > 0 ? (
                            rekomendasi.rekomendasi.map((item, index) => (
                                <div key={index} style={{ marginBottom: '15px', padding: '10px', borderBottom: '1px solid #eee' }}>
                                    <p style={{ margin: '0', fontWeight: 'bold', color: '#28a745' }}>{item.nama}</p>
                                    <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#555' }}>
                                        <strong>Alasan:</strong> {item.alasan}
                                    </p>
                                </div>
                            ))
                        ) : (
                            /* Jika AI tidak menemukan herbal yang aman (validated empty) */
                            <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                {rekomendasi.catatan || "Tidak ada herbal yang disarankan untuk kondisi medis Anda."}
                            </p>
                        )}
                        
                        <p style={{ fontSize: '0.7rem', color: '#888', marginTop: '10px' }}>
                            *Analisis berdasarkan data rekam medis terverifikasi di Blockchain.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}