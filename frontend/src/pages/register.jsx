import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, HEALTH_RECORD_ABI } from '../api/contract_abi';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [role, setRole] = useState('patient'); 
    const [specialty, setSpecialty] = useState('');

    const handleRegister = async () => {
        if (!window.ethereum) return alert("MetaMask tidak ditemukan!");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTH_RECORD_ABI, signer);

        try {
            if (role === 'patient') {
                const tx = await contract.registerPatient(name);
                await tx.wait();
                alert("Registrasi Pasien Berhasil!");
            } else {
                // Jika Dokter Herbal, ketik spesialisasi yang ada kata 'herbal'
                const tx = await contract.registerDoctor(name, specialty);
                await tx.wait();
                alert("Registrasi Dokter Berhasil! Tunggu Approval Admin.");
            }
        } catch (error) {
            console.error(error);
            alert("Gagal daftar: " + error.message);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h2>📝 Registrasi Blockchain</h2>
            <div style={{ marginBottom: '15px' }}>
                <label>Nama Lengkap:</label>
                <input style={{ width: '100%', padding: '8px' }} onChange={(e) => setName(e.target.value)} />
            </div>
            <div style={{ marginBottom: '15px' }}>
                <label>Daftar Sebagai:</label>
                <select style={{ width: '100%', padding: '8px' }} onChange={(e) => setRole(e.target.value)}>
                    <option value="patient">Pasien</option>
                    <option value="doctor">Dokter</option>
                </select>
            </div>
           {role === 'doctor' && (
              <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                      Pilih Kategori Dokter:
                  </label>
                  
                  <div style={{ display: 'flex', gap: '20px', background: '#f0f0f0', padding: '10px', borderRadius: '8px' }}>
                      <label style={{ cursor: 'pointer' }}>
                          <input 
                              type="radio" 
                              name="specialty" 
                              value="Dokter Umum" 
                              checked={specialty === "Dokter Umum"}
                              onChange={(e) => setSpecialty(e.target.value)} 
                          /> Dokter Umum
                      </label>

                      <label style={{ cursor: 'pointer' }}>
                          <input 
                              type="radio" 
                              name="specialty" 
                              value="Dokter Spesialis Herbal" 
                              checked={specialty === "Dokter Spesialis Herbal"}
                              onChange={(e) => setSpecialty(e.target.value)} 
                          /> Dokter Herbal
                      </label>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                      *Kategori ini akan menentukan akses Anda ke fitur AI Rekomendasi Herbal.
                  </p>
              </div>
          )}
            <button onClick={handleRegister} style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Daftar Sekarang
            </button>
        </div>
    );
}