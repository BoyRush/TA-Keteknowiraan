import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import BerandaDokter from './BerandaDokter'; 
import RequestAccess from './RequestAccess';
import PasienSaya from './PasienSaya';
import NotifikasiDokter from './NotifikasiDokter';
import InputDataMedis from './InputDataMedis';
import RiwayatInput from './RiwayatInput';
import ProfilSaya from '../../components/ProfilSaya';

const DoctorDashboard = () => {
  const { id, username, fullName, role, status, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('doctor_activeTab') || 'dashboard';
    }
    return 'dashboard';
  });
  const [patientAddr, setPatientAddr] = useState(''); 
  const [txLoading, setTxLoading] = useState(false);
  const [notifs, setNotifs] = useState([]); 
  const [patientsHistory, setPatientsHistory] = useState([]);
  
  const [medicalData, setMedicalData] = useState({
    id: null,
    diagnosis: '',
    symptoms: '',
    treatment: '',
    notes: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [approvedDocs, setApprovedDocs] = useState([]); 
  const [pendingDocs, setPendingDocs] = useState([]);
  const [rejectedDocs, setRejectedDocs] = useState([]); 

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (status === 'pending') {
      router.replace('/pending-verification');
      return;
    }
    if (role === 'herbal_doctor') {
      router.replace('/herbs/dashboard');
      return;
    }
    if (role !== 'doctor') {
      router.replace('/login');
      return;
    }
  }, [loading, isAuthenticated, role, status, router]);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('herbalchain_token');
      const res = await axios.get(`http://127.0.0.1:5000/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setNotifs(res.data); 
    } catch (e) {
      console.error("Gagal ambil notif:", e);
    }
  }, []);

  const handleSaveMedicalData = async (e) => {
      e.preventDefault();
      if (!patientAddr) return alert("Pilih pasien terlebih dahulu!");
      
      setTxLoading(true);
      try {
          const token = localStorage.getItem('herbalchain_token');
          if (isEditMode && medicalData.id) {
              await axios.put(`http://127.0.0.1:5000/records/medical/${medicalData.id}`, {
                  diagnosis: medicalData.diagnosis,
                  symptoms: medicalData.symptoms,
                  treatment: medicalData.treatment,
                  notes: medicalData.notes
              }, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              alert(`Data Medis Berhasil Diperbarui!`);
          } else {
              await axios.post(`http://127.0.0.1:5000/records/medical`, {
                  patient_user_id: patientAddr,
                  ...medicalData
              }, {
                  headers: { Authorization: `Bearer ${token}` }
              });
              alert(`Data Medis Berhasil Disimpan!`);
          }

          setMedicalData({ id: null, diagnosis: '', symptoms: '', treatment: '', notes: '' });
          setPatientAddr('');
          setIsEditMode(false);
          setActiveTab('dashboard'); 
          loadPatientStatus();
          fetchMedicalHistory();
      } catch (error) {
          alert("Gagal menyimpan: " + (error.response?.data?.error || error.message));
      } finally {
          setTxLoading(false);
      }
  };

  const handleEditRecord = (rec) => {
      setPatientAddr(rec.patientId);
      setMedicalData({
          id: rec.id,
          diagnosis: rec.diagnosis || '',
          symptoms: rec.symptoms || '',
          treatment: rec.treatment || '',
          notes: rec.notes || ''
      });
      setIsEditMode(true);
      setActiveTab('input');
  };

  const handleDeleteRecord = async (recordId) => {
      if (!confirm("Yakin ingin menghapus rekam medis ini?")) return;
      setTxLoading(true);
      try {
          const token = localStorage.getItem('herbalchain_token');
          await axios.delete(`http://127.0.0.1:5000/records/medical/${recordId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          alert("Rekam medis berhasil dihapus.");
          fetchMedicalHistory();
      } catch (error) {
          alert("Gagal menghapus: " + (error.response?.data?.error || error.message));
      } finally {
          setTxLoading(false);
      }
  };

  const handleTabChange = async (newTab) => {
    setActiveTab(newTab);
    sessionStorage.setItem('doctor_activeTab', newTab);
    if (newTab === 'notifikasi') {
        try {
            const token = localStorage.getItem('herbalchain_token');
            await axios.post('http://127.0.0.1:5000/notifications/mark-read', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchNotifications();
        } catch (err) {
            console.error("Gagal update status baca:", err);
        }
    }
  };

  const handleRequestAccess = async (targetUserId) => {
      if (!targetUserId) return alert("User ID pasien tidak valid!");

      setTxLoading(true);
      try {
          const token = localStorage.getItem('herbalchain_token');
          await axios.post("http://127.0.0.1:5000/access/request", 
            { patient_user_id: targetUserId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          alert("Permintaan akses berhasil dikirim ke Pasien!");
          loadPatientStatus(); 
      } catch (error) {
          console.error("Gagal request akses:", error);
          alert("Gagal mengirim permintaan: " + (error.response?.data?.error || error.message));
      } finally {
          setTxLoading(false);
      }
  };

  const loadPatientStatus = useCallback(async () => {
    if (!id || role !== 'doctor') return;
    try {
      const token = localStorage.getItem('herbalchain_token');
      const res = await axios.get("http://127.0.0.1:5000/access/patients", {
          headers: { Authorization: `Bearer ${token}` }
      });
      
      const allPatients = res.data.patients || []; 
      
      const tanggalHariIni = new Date().toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      const mapped = allPatients.map(p => ({
          name: p.patient_name || "Pasien",
          id: p.patient_user_id,
          date: tanggalHariIni,
          status: p.status === 'approved' ? 'Aktif' : p.status === 'pending' ? 'Menunggu' : 'Ditolak'
      }));

      setApprovedDocs(mapped.filter(p => p.status === 'Aktif'));
      setPendingDocs(mapped.filter(p => p.status === 'Menunggu'));
      setRejectedDocs(mapped.filter(p => p.status === 'Ditolak'));
    } catch (error) {
      console.error("Gagal load status:", error);
    }
  }, [id, role]);

  const fetchMedicalHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('herbalchain_token');
      const res = await axios.get("http://127.0.0.1:5000/records/medical/doctor", {
          headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.records) {
          const mapped = res.data.records.map(r => ({
              id: r.id,
              patientName: r.patient_name,
              patientId: r.patient_user_id,
              diagnosis: r.diagnosis,
              symptoms: r.symptoms,
              treatment: r.treatment,
              notes: r.notes,
              date: new Date(r.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
              }),
              timestamp: r.created_at,
              tags: [r.diagnosis.split(',')[0]] // Example tag
          }));
          setPatientsHistory(mapped);
      }
    } catch (error) {
      console.error("Gagal load riwayat medis:", error);
    }
  }, []);

  useEffect(() => {
    if (!loading && username && role === 'doctor') {
      loadPatientStatus();
      fetchMedicalHistory();
      fetchNotifications();
    }
  }, [loading, username, role, loadPatientStatus, fetchMedicalHistory, fetchNotifications]);

  const totalSemuaInputan = patientsHistory.length; 
  const allFormattedInputs = patientsHistory.map(h => ({
      patientName: h.patientName,
      date: h.date,
      tags: h.tags
  }));

  return (
    <div className="doctor-layout">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} notifications={{ notifCount: notifs.filter(n => !n.is_read).length }}/>

      <main className="main-content">
      {activeTab === 'dashboard' && (
      <BerandaDokter 
        stats={{
          active: approvedDocs.length,
          pending: pendingDocs.length,
          totalInput: totalSemuaInputan,
          rejected: rejectedDocs.length 
        }}
        activePatients={approvedDocs.slice(0, 5)}
        recentRequests={[
          ...pendingDocs,
          ...approvedDocs,
          ...rejectedDocs,
        ].slice(0, 5)} 
        recentInputs={allFormattedInputs.slice(0, 5)} 
        changeTab={setActiveTab}
      />
    )}
        {activeTab === 'request' && (
          <RequestAccess 
            handleRequest={handleRequestAccess}
            txLoading={txLoading}
            pendingRequests={pendingDocs} 
            approvedDocs={approvedDocs}
            rejectedRequests={rejectedDocs}
          />
        )}

        {activeTab === 'input' && (
            <InputDataMedis 
                approvedPatients={approvedDocs} 
                patientAddr={patientAddr}
                setPatientAddr={setPatientAddr}
                medicalData={medicalData}
                setMedicalData={setMedicalData}
                handleSave={handleSaveMedicalData}
                txLoading={txLoading}
                isEditMode={isEditMode}
            />
        )}

        {activeTab === 'list' && (
            <PasienSaya changeTab={setActiveTab} />
        )}

        {activeTab === 'riwayat' && (
            <RiwayatInput 
                patientsHistory={patientsHistory}
                txLoading={txLoading}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
            />
        )}

        {activeTab === 'notifikasi' && (
          <div className="menu-wrapper">
            <NotifikasiDokter />
          </div>
        )}
        {activeTab === 'profil' && (
            <ProfilSaya />
        )}
      </main>

      <style jsx>{`
        .doctor-layout { display: flex; min-height: 100vh; background: #fcfcfc; font-family: 'Inter', sans-serif; }
        .main-content { flex: 1; margin-left: 260px; padding: 40px; background: transparent; }
      `}</style>
    </div>
  );
};

export default DoctorDashboard;