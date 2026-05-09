import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, FileText, User } from 'lucide-react';
import axios from 'axios';

export default function PasienSaya({ changeTab }) {
    const { id } = useAuth();
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('herbalchain_token');
                const res = await axios.get("http://127.0.0.1:5000/access/patients", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const allPatients = res.data.patients || []; 
                const mapped = allPatients
                    .filter(p => p.status === 'approved')
                    .map(p => ({
                        id: p.patient_user_id,
                        name: p.patient_name || "Pasien",
                        date: "9 Mei 2026", // Simplified for now
                        category: "Hematology" // Placeholder like in screenshot
                    }));
                setPatients(mapped);
            } catch (err) {
                console.error("Gagal load pasien:", err);
            }
        };
        fetchPatients();
    }, [id]);

    const filteredPatients = patients.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id).includes(searchQuery)
    );

    return (
        <div className="pasien-wrapper">
            <div className="header-pasien">
                <div>
                    <h2 className="title">Pasien Saya</h2>
                    <p className="subtitle">Daftar pasien terverifikasi yang memberikan izin akses rekam medis kepada Anda.</p>
                </div>
                <button className="btn-add" onClick={() => changeTab('request')}>
                    <Plus size={18} />
                    <span>Request Akses Baru</span>
                </button>
            </div>

            <div className="search-container">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Cari nama atau ID..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="patient-grid">
                {filteredPatients.length === 0 ? (
                    <div className="empty-state">
                        <p>Tidak ada pasien ditemukan.</p>
                    </div>
                ) : (
                    filteredPatients.map((p) => (
                        <div key={p.id} className="patient-card">
                            <div className="card-left">
                                <div className="avatar-circle">
                                    <User size={20} />
                                </div>
                                <div className="patient-info">
                                    <h3>{p.name}</h3>
                                    <p className="p-id">ID: {p.id}</p>
                                    <span className="p-category">{p.category}</span>
                                </div>
                            </div>
                            <div className="card-right">
                                <button className="btn-input" onClick={() => changeTab('input')}>
                                    <Plus size={14} />
                                    <span>Input Data</span>
                                </button>
                                <button className="btn-history" onClick={() => changeTab('riwayat')}>
                                    <FileText size={14} />
                                    <span>Lihat Riwayat</span>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
                .pasien-wrapper { animation: fadeIn 0.4s ease; }
                .header-pasien { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
                .title { font-size: 24px; font-weight: 700; color: #333; margin: 0; }
                .subtitle { font-size: 14px; color: #666; margin-top: 4px; }
                
                .btn-add { 
                    display: flex; align-items: center; gap: 8px; background: white; 
                    border: 1px solid #ddd; padding: 10px 18px; border-radius: 12px; 
                    font-weight: 600; cursor: pointer; transition: 0.2s;
                }
                .btn-add:hover { border-color: #2e7d32; color: #2e7d32; }

                .search-container { margin-bottom: 25px; }
                .search-box { 
                    position: relative; display: flex; align-items: center; 
                    background: white; border: 1px solid #eee; border-radius: 12px;
                    padding: 0 15px; width: 300px; margin-left: auto;
                }
                .search-box input { 
                    border: none; padding: 12px 10px; width: 100%; outline: none; font-size: 14px;
                }
                .search-icon { color: #999; }

                .patient-grid { display: flex; flex-direction: column; gap: 15px; }
                .patient-card { 
                    background: white; border: 1px solid #f0f0f0; border-radius: 20px; 
                    padding: 20px 25px; display: flex; justify-content: space-between; align-items: center;
                    transition: 0.3s;
                }
                .patient-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.04); }
                
                .card-left { display: flex; align-items: center; gap: 15px; }
                .avatar-circle { 
                    width: 48px; height: 48px; background: #e8f5e9; color: #2e7d32; 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                }
                
                .patient-info h3 { font-size: 16px; margin: 0 0 4px 0; color: #333; }
                .p-id { font-size: 11px; color: #999; margin: 0; font-family: monospace; }
                .p-category { 
                    display: inline-block; margin-top: 6px; font-size: 10px; 
                    background: #f5f5f5; color: #777; padding: 2px 8px; border-radius: 4px;
                }

                .card-right { display: flex; gap: 10px; }
                .btn-input, .btn-history { 
                    display: flex; align-items: center; gap: 6px; padding: 8px 16px; 
                    border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s;
                }
                
                .btn-input { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
                .btn-input:hover { background: #2e7d32; color: white; }
                
                .btn-history { background: white; color: #666; border: 1px solid #ddd; }
                .btn-history:hover { border-color: #333; color: #333; }

                .empty-state { text-align: center; padding: 50px; color: #bbb; font-style: italic; }
                
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; } }
            `}</style>
        </div>
    );
}