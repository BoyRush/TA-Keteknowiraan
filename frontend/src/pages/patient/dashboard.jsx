import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Beranda from './menus/BerandaPasien';
import MintaRekomendasi from './menus/MintaRekomendasi';
import RiwayatMedis from './menus/RiwayatMedis';
import AksesDokter from './menus/AksesDokter';
import RiwayatRekomendasi from './menus/RiwayatRekomendasi';
import NotifikasiPasien from './menus/NotifikasiPasien';
import ProfilSaya from '../../components/ProfilSaya';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function PatientDashboard() {
  const { id, username, role, status, loading, isAuthenticated, fullName, refreshMembership } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('beranda');
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [approvedDocs, setApprovedDocs] = useState([]);
  const [rekomendasiCount, setRekomendasiCount] = useState(0);
  const [keluhan, setKeluhan] = useState('');
  const [rekomendasi, setRekomendasi] = useState(null);
  const [isRecommending, setIsRecommending] = useState(false);
  const [useRag, setUseRag] = useState(true); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [notifs, setNotifs] = useState([]); 

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (role !== 'patient') {
      router.replace('/login');
      return;
    }
  }, [loading, isAuthenticated, role, status, router]);

  const loadRekomendasiCount = async () => {
    try {
        const token = localStorage.getItem('herbalchain_token');
        const res = await axios.get(`http://127.0.0.1:5000/herbal/history-count`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setRekomendasiCount(res.data.count);
    } catch (err) {
        console.error("Gagal ambil history count:", err);
    }
  };

  const loadRequests = async () => {
    if (!id || role !== 'patient') return;
    
    try {
      const token = localStorage.getItem('herbalchain_token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Get Medical Records
      try {
        const recRes = await axios.get(`http://127.0.0.1:5000/records/medical/patient/${id}`, { headers });
        if (recRes.data.status === 'success') {
            setMedicalRecords(recRes.data.records.map(r => ({
                id: r.id,
                doctor: r.doctor_name,
                timestamp: new Date(r.created_at).getTime(),
                diagnosis: r.diagnosis,
                symptoms: r.symptoms,
                treatment: r.treatment,
                notes: r.notes,
                isActive: true
            })));
        }
      } catch (err) { console.error("Gagal ambil rekam medis", err); }

      // 2. Get Doctors Permissions Status
      try {
        const accessRes = await axios.get(`http://127.0.0.1:5000/access/status`, { headers });
        if (accessRes.data.status === 'success') {
            const permissions = accessRes.data.permissions;
            setApprovedDocs(permissions.filter(p => p.status === 'approved').map(p => ({
                name: p.doctor_name, id: p.doctor_user_id 
            })));
            setPendingDocs(permissions.filter(p => p.status === 'pending').map(p => ({
                name: p.doctor_name, id: p.doctor_user_id
            })));
        }
      } catch (err) { console.error("Gagal ambil status akses", err); }

    } catch (error) {
      console.error("Gagal load data:", error);
    }
  };

    const handleRevoke = async (docUserId, docName) => {
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.post("http://127.0.0.1:5000/access/respond", 
                { doctor_user_id: docUserId, action: 'rejected' }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Perizinan oleh Dokter ${docName} berhasil di cabut`);
            await loadRequests(); 
        } catch (error) { console.error(error); }
        finally { setIsProcessing(false); }
    }

    const handleOpenNotifications = async () => {
    setActiveTab('notifikasi');
    
    try {
      const token = localStorage.getItem('herbalchain_token');
      await axios.post('http://127.0.0.1:5000/notifications/mark-read', {}, {
          headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGetAIRecommendation = async () => {
    if (!keluhan) return alert("Silakan isi keluhan Anda.");
    setRekomendasi(null);
    setIsRecommending(true);

    try {
        const token = localStorage.getItem('herbalchain_token');
        const response = await axios.get(
            `http://127.0.0.1:5000/herbal/search?q=${keluhan}&useRag=${useRag}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setRekomendasi(response.data);
        
        if (refreshMembership) {
            refreshMembership();
        }
        loadRekomendasiCount(); 
        
    } catch (error) {
        console.error("Gagal ambil rekomendasi:", error);
        if (error.response && error.response.status === 403) {
            alert(error.response.data.message || "Batas rekomendasi gratis tercapai. Silakan upgrade ke Premium.");
        } else {
            alert("Gagal terhubung ke Server.");
        }
    } finally {
        setIsRecommending(false);
    }
};

  const handleGrant = async (docUserId) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('herbalchain_token');
      await axios.post("http://127.0.0.1:5000/access/respond", 
        { doctor_user_id: docUserId, action: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Akses berhasil diberikan!");
      loadRequests(); 
    } catch (error) { console.error(error); }
    finally { setIsProcessing(false); }
  };

  const handleReject = async (docUserId, docName) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('herbalchain_token');
      await axios.post("http://127.0.0.1:5000/access/respond", 
        { doctor_user_id: docUserId, action: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Perizinan oleh Dokter ${docName} berhasil di tolak`);
      loadRequests();
    } catch (error) { 
      console.error("Gagal menolak akses:", error);
      alert("Gagal menolak permintaan: " + (error.response?.data?.error || "Terjadi kesalahan"));
    }
    finally { setIsProcessing(false); }
  };

    const handleTabChange = async (newTab) => {
      setActiveTab(newTab);

      if (newTab === 'notifikasi') {
          try {
              const token = localStorage.getItem('herbalchain_token');
              await axios.post('http://127.0.0.1:5000/notifications/mark-read', {}, {
                  headers: { Authorization: `Bearer ${token}` }
              });

              loadNotifications(); 
              
          } catch (err) {
              console.error("Gagal update status baca:", err);
          }
      }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('herbalchain_token');
      const res = await axios.get(`http://127.0.0.1:5000/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && Array.isArray(res.data)) {
        setNotifs(res.data);
      }
    } catch (err) {
      console.error("Gagal load notifikasi:", err);
    }
  };

  useEffect(() => { 
    if (!loading && username && role === 'patient') {
      loadRequests();
      loadRekomendasiCount();
      loadNotifications();
    }
  }, [username, loading, role]);

  if (loading) return <p style={{textAlign: 'center', padding: '50px'}}>Memuat Data...</p>;

  return (
    <div className="layout-container">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} dokterCount={pendingDocs.length} notifications={{ notifCount: notifs.filter(n => !n.is_read).length }}/>
      <main className="main-content">
        <section className="page-body">
          {activeTab === 'beranda' && (
            <Beranda 
              medicalRecords={medicalRecords}
              pendingDocs={pendingDocs}
              approvedDocs={approvedDocs}
              changeTab={setActiveTab}
              onGrant={handleGrant}   
              onReject={handleReject}
            />
          )}
          {activeTab === 'rekomendasi' && (
            <MintaRekomendasi 
              keluhan={keluhan}
              setKeluhan={setKeluhan}
              useRag={useRag}
              setUseRag={setUseRag}
              handleGetAIRecommendation={handleGetAIRecommendation}
              isRecommending={isRecommending}
              rekomendasi={rekomendasi}
            />
          )}
          {activeTab === 'riwayat_medis' && (
            <RiwayatMedis 
              medicalRecords={medicalRecords} 
            />
          )}
          {activeTab === 'akses_dokter' && (
            <AksesDokter 
              pendingDocs={pendingDocs}
              approvedDocs={approvedDocs}
              onGrant={handleGrant}
              onReject={handleReject}
              onRevoke={handleRevoke}
              isProcessing={isProcessing}
            />
          )}
          {activeTab === 'riwayat_rekomendasi' && (
          <RiwayatRekomendasi />
        )}
        {activeTab === 'notifikasi' && (
          <NotifikasiPasien />
        )}
        {activeTab === 'profil' && (
          <ProfilSaya />
        )}
        </section>
      </main>

      <style jsx>{`
        .layout-container { display: flex; background: #fcfcfc; min-height: 100vh; }
        .main-content { margin-left: 260px; flex: 1; padding: 20px 40px; }
        .page-body { margin-top: 10px; }
      `}</style>
    </div>
  );
}