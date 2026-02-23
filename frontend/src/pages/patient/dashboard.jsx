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

    const fetchFromIPFS = async (cid) => {
        try {
            // Kita ambil data dari Gateway IPFS lokal kamu
            const response = await fetch(`http://127.0.0.1:8080/ipfs/${cid}`);
            const data = await response.json();
            // Asumsi data di IPFS bentuknya: { diagnosis: "Vertigo", patient_address: "..." }
            return data.diagnosis || data; 
        } catch (error) {
            console.error("Gagal ambil data IPFS:", error);
            return "Gagal memuat teks diagnosa";
        }
    };
    // FUNGSI UTAMA: Load semua data dari Blockchain
    const loadRequests = async () => {
        if (!window.ethereum || !address) return;

        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);
            const patientChecksum = ethers.utils.getAddress(address.toLowerCase());

            // 1. Ambil CID dari Blockchain
            const records = await contract.getMedicalRecords(patientChecksum); 

            // 2. "Terjemahkan" CID menjadi Teks secara otomatis
            const formattedRecords = await Promise.all(records.map(async (r) => {
                try {
                    // Minta bantuan Flask untuk ambil isi IPFS
                    const res = await fetch(`http://localhost:5000/medical/get-content?cid=${r.cid}`);
                    const textData = await res.text();
                    
                    // Jika data IPFS kamu berbentuk JSON, kita parse. Jika teks biasa, langsung pakai.
                    let diagnosisText;
                    try {
                        const json = JSON.parse(textData);
                        diagnosisText = json.diagnosis || textData;
                    } catch {
                        diagnosisText = textData;
                    }

                    return {
                        cid: r.cid,
                        timestamp: r.timestamp.toNumber(),
                        doctor: r.createdBy,
                        diagnosis: diagnosisText // Simpan teks aslinya di sini
                    };
                } catch (err) {
                    return { cid: r.cid, timestamp: r.timestamp.toNumber(), doctor: r.createdBy, diagnosis: "Gagal memuat teks" };
                }
            }));

            setMedicalRecords(formattedRecords);
            console.log("✅ Data Medis & Diagnosa Berhasil Dimuat");

        } catch (error) {
            console.error("Gagal load data:", error);
        }
    };

    // 1. Fungsi Menolak (Reject)
    const handleReject = async (docAddr) => {
        setIsProcessing(true);
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);
            
            const tx = await contract.rejectAccess(ethers.utils.getAddress(docAddr.toLowerCase()));
            await tx.wait();
            alert("Permintaan dokter telah ditolak!");
            await loadRequests(); // Refresh data
        } catch (error) { console.error(error); }
        finally { setIsProcessing(false); }
    };

    // 2. Fungsi Mencabut Izin (Revoke)
    const handleRevoke = async (docAddr) => {
        setIsProcessing(true);
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);
            
            const tx = await contract.revokeAccess(ethers.utils.getAddress(docAddr.toLowerCase()));
            await tx.wait();
            alert("Izin dokter telah dicabut!");
            await loadRequests(); // Refresh data
        } catch (error) { console.error(error); }
        finally { setIsProcessing(false); }
    };

    const handleGetAIRecommendation = async () => {
        // 1. RESET HASIL SEBELUMNYA (Agar tidak muncul jawaban lama)
        setRekomendasi(null); 
        
        // 2. SET LOADING
        setIsRecommending(true);

        try {
            const kondisiMedis = medicalRecords.map(r => r.diagnosis).join(', ');

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
                pendingDocs.map((doc, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', border: '1px solid #ffeeba', padding: '15px', borderRadius: '8px', background: '#fff9e6', marginBottom: '10px' }}>
                        <p style={{margin: 0, fontWeight: 'bold'}}>{doc.name}</p>
                        <code style={{ marginBottom: '10px', display: 'block' }}>{doc.address}</code>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={() => handleGrant(doc.address)} // Kirim alamatnya saja
                                disabled={isProcessing} 
                                style={{ flex: 1, background: '#28a745', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {isProcessing ? "..." : "Setujui"}
                            </button>
                            <button 
                                onClick={() => handleReject(doc.address)} // Kirim alamatnya saja
                                disabled={isProcessing} 
                                style={{ flex: 1, background: '#dc3545', color: 'white', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {isProcessing ? "..." : "Tolak"}
                            </button>
                        </div>
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
                                        <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                                            {rec.diagnosis} {/* TEKS PENYAKIT MUNCUL DI SINI */}
                                        </div>
                                        <code style={{ fontSize: '0.7rem', color: '#999' }}>{rec.cid}</code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ height: '40px' }}></div>

            {/* SEKSI 3: DOKTER AKTIF */}
            <h3 style={{ color: '#28a745', marginTop: '30px' }}>✅ Dokter Berizin</h3>
            {approvedDocs.length === 0 ? (
                <p style={{ color: '#888' }}>Belum ada dokter yang diberi izin.</p>
            ) : (
                approvedDocs.map((doc, index) => (
                    // Gunakan 'index' sebagai key agar lebih aman
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '8px', background: '#eaffea', border: '1px solid #c3e6cb', marginBottom: '10px' }}>
                        <div>
                            {/* Tampilkan NAMA dokternya */}
                            <p style={{ margin: 0, fontWeight: 'bold', color: '#155724' }}>{doc.name || "Dokter Terverifikasi"}</p>
                            
                            {/* Tampilkan ADDRESS dokternya (Gunakan doc.address, bukan doc saja) */}
                            <code style={{ fontSize: '0.9rem' }}>{doc.address}</code>
                            
                            <span style={{ marginLeft: '10px', color: '#155724', fontWeight: 'bold', fontSize: '0.7rem', verticalAlign: 'middle' }}>● AKTIF</span>
                        </div>
                        
                        <button 
                            onClick={() => handleRevoke(doc.address)} // Gunakan doc.address di sini juga
                            disabled={isProcessing}
                            style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                            {isProcessing ? "..." : "Cabut Izin"}
                        </button>
                    </div>
                ))
            )}
            {/* SEKSI BARU: AI HERBAL RECOMMENDATION */}
            <div style={{ marginTop: '40px', padding: '20px', background: '#f0fff4', borderRadius: '15px', border: '2px solid #28a745' }}>
                <h3>🤖 AI Rekomendasi Herbal (RAG + Rules)</h3>
                <p style={{ fontSize: '0.9rem' }}>Sistem akan menganalisis keluhan Anda berdasarkan riwayat penyakit di Blockchain.</p>
                
                <input 
                    type="text" 
                    placeholder="Apa yang Anda rasakan? (Contoh: Susah tidur)" 
                    value={keluhan}
                    onChange={(e) => setKeluhan(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px', boxSizing: 'border-box' }}
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