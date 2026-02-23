import { useAuth } from '../../context/AuthContext';
import { CONTRACT_ADDRESS, HEALTH_RECORD_ABI } from '../../api/contract_abi';
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DoctorDashboard() {
    const { address, role, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('request');
    const [patientAddr, setPatientAddr] = useState('');
    const [medicalData, setMedicalData] = useState('');
    const [txLoading, setTxLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && role !== 'doctor') router.push('/'); 
    }, [role, loading, router]);

    // --- FUNGSI LOG PEMBUKTIAN (UNTUK SIDANG) ---
    const logDataSource = (data) => {
        console.log("\n" + "=".repeat(40));
        console.log("🔍 ANALISIS SUMBER DATA MEDIS");
        console.log("Data Mentah:", data);

        // IPFS CID v0 biasanya diawali 'Qm', v1 diawali 'ba'
        const isIPFS = data.startsWith("Qm") || data.startsWith("ba");

        if (isIPFS) {
            console.log("✅ STATUS: DATA BERASAL DARI IPFS");
            console.log("🔗 CID Detected:", data);
            console.log(`🌐 Link Gateway: https://ipfs.io/ipfs/${data}`);
        } else {
            console.log("⚠️ STATUS: DATA BERASAL DARI BLOCKCHAIN (TEKS BIASA)");
            console.log("📝 Konten Teks:", data);
        }
        console.log("=".repeat(40) + "\n");
    };

    const handleRequestAccess = async (e) => {
        e.preventDefault();
        setTxLoading(true);
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);
            
            console.log("Mengirim permintaan akses ke:", patientAddr);
            const tx = await contract.requestAccess(patientAddr);
            await tx.wait();
            
            alert("Permintaan akses berhasil dikirim!");
        } catch (error) { 
            console.error(error);
            alert("Gagal meminta akses."); 
        } finally { 
            setTxLoading(false); 
        }
    };

const handleSaveMedicalData = async (e) => {
    e.preventDefault();
    setTxLoading(true);
    try {
        console.log("1. Mengirim data ke Flask...");
        const response = await fetch("http://127.0.0.1:5000/medical/ipfs-only", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                diagnosis: medicalData,
                patient_address: patientAddr.toLowerCase().trim()
            })
        });

        const result = await response.json();
        const cid = result.ipfs_cid;
        console.log("2. CID dari IPFS didapat:", cid);

        if (!cid) throw new Error("Gagal mendapatkan CID dari IPFS");

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);

        console.log("3. Mengirim ke Blockchain untuk Pasien:", patientAddr);
        
        // PASTIKAN URUTANNYA: (Alamat Pasien, Kode CID)
        const tx = await contract.storeMedicalRecord(
            ethers.utils.getAddress(patientAddr.toLowerCase().trim()), 
            cid
        );
        
        console.log("4. Menunggu konfirmasi Blockchain (Gas dikirim)...");
        const receipt = await tx.wait();
        
        console.log("5. Transaksi Sukses! Receipt:", receipt);
        alert(`Berhasil! Data tersimpan dengan CID: ${cid}`);

        // Reset form agar tidak double submit
        setMedicalData('');
        setPatientAddr('');

    } catch (error) {
        console.error("❌ ERROR DI DOKTER:", error);
        alert(`Gagal: ${error.message}`);
    } finally {
        setTxLoading(false);
    }
};

    if (loading) return <p>Memverifikasi...</p>;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1>👨‍⚕️ Dashboard Dokter Medis</h1>
            
            <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                <p>Wallet Dokter: <code>{address}</code></p>
                <p style={{fontSize: '12px', color: '#666'}}>*Buka Console (F12) untuk melihat log verifikasi data IPFS</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick={() => setActiveTab('request')} 
                    style={{ background: activeTab === 'request' ? '#0070f3' : '#ccc', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Minta Akses
                </button>
                <button 
                    onClick={() => setActiveTab('input')} 
                    style={{ background: activeTab === 'input' ? '#dc3545' : '#ccc', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Input Diagnosa
                </button>
            </div>

            {activeTab === 'request' && (
                <form onSubmit={handleRequestAccess} style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                    <h3>Minta Izin Akses Pasien</h3>
                    <input 
                        type="text" 
                        value={patientAddr} 
                        onChange={(e) => setPatientAddr(e.target.value)} 
                        placeholder="0x... (Alamat Wallet Pasien)" 
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} 
                        required
                    />
                    <button type="submit" disabled={txLoading} style={{ width: '100%', padding: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
                        {txLoading ? "Memproses..." : "Kirim Request ke Blockchain"}
                    </button>
                </form>
            )}

            {activeTab === 'input' && (
                <form onSubmit={handleSaveMedicalData} style={{ padding: '20px', border: '1px solid #dc3545', borderRadius: '8px' }}>
                    <h3>Input Diagnosa Baru</h3>
                    <input 
                        type="text" 
                        value={patientAddr} 
                        onChange={(e) => setPatientAddr(e.target.value)} 
                        placeholder="Alamat Wallet Pasien" 
                        style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }} 
                        required
                    />
                    <textarea 
                        value={medicalData} 
                        onChange={(e) => setMedicalData(e.target.value)} 
                        placeholder="Masukkan Diagnosa atau Hash IPFS (e.g. Qm...)" 
                        style={{ width: '100%', padding: '10px', height: '100px', marginBottom: '10px', boxSizing: 'border-box' }} 
                        required
                    />
                    <button type="submit" disabled={txLoading} style={{ width: '100%', padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}>
                        {txLoading ? "Menyimpan..." : "Simpan ke Smart Contract"}
                    </button>
                </form>
            )}
        </div>
    );
}