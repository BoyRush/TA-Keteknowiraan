import React from 'react';
import { Info, Send, Plus } from 'lucide-react';
import axios from 'axios';

const RequestAccess = ({ 
  handleRequest, 
  txLoading,
  pendingRequests = [],
  approvedDocs = [],
  rejectedRequests = []
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const token = localStorage.getItem('herbalchain_token');
      const res = await axios.get(`http://127.0.0.1:5000/access/search-patient?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
      alert("Pencarian gagal.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="request-wrapper">
      {/* 1. HEADER SECTION */}
      <div className="header-content">
        <div>
          <h2 className="title">Request Akses</h2>
          <p className="subtitle">Cari pasien dan kirim permintaan akses ke data medis mereka</p>
        </div>
      </div>

      {/* 2. ALERT INFO */}
      <div className="alert-info">
        <div className="alert-icon"><Info size={20} /></div>
        <div className="alert-text">
          <p>
            Cari pasien berdasarkan nama lengkap mereka. Setelah ditemukan, kirim permintaan akses.
            Pasien akan menerima notifikasi untuk menyetujui atau menolak permintaan Anda.
          </p>
        </div>
      </div>

      <div className="main-grid-request">
        {/* FORM CARD */}
        <div className="request-card">
          <div className="card-header-simple">
             <h3>Cari Pasien</h3>
          </div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Cari nama lengkap pasien..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
              className="input-field"
            />
            <button type="submit" className="btn-search" disabled={isSearching}>
              {isSearching ? "..." : "Cari"}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(p => (
                <div 
                  key={p.id} 
                  className={`result-item ${selectedPatient?.id === p.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPatient(p)}
                >
                  <div className="res-info">
                    <p className="res-name">{p.full_name}</p>
                    <p className="res-sub">Username: {p.username}</p>
                  </div>
                  {selectedPatient?.id === p.id && <span className="selected-tag">Terpilih</span>}
                </div>
              ))}
            </div>
          )}

          {selectedPatient && (
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => handleRequest(selectedPatient.id)} 
                className="btn-submit" 
                disabled={txLoading}
              >
                <Send size={18} />
                <span>{txLoading ? "Memproses..." : `Kirim Request ke ${selectedPatient.full_name}`}</span>
              </button>
            </div>
          )}
        </div>

        {/* TABEL RIWAYAT */}
       <div className="history-card">
        <div className="card-header-simple">
          <h3>Status Permintaan Anda</h3>
        </div>
        <div className="table-responsive">
          <table className="request-table">
            <thead>
              <tr>
                <th>Nama Pasien</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {/* 1. TAMPILKAN YANG SUDAH DISETUJUI */}
  {approvedDocs.length > 0 && approvedDocs.map((req) => (
    <tr key={`app-${req.id}`}>
      <td className="info-cell">
        <div className="patient-name">{req.name}</div>
      </td>
      <td>
        <span className="status-tag success">Disetujui</span>
      </td>
      <td className="time-cell">Aktif</td>
    </tr>
  ))}

  {/* 2. TAMPILKAN YANG MASIH MENUNGGU */}
  {pendingRequests.length > 0 && pendingRequests.map((req) => (
    <tr key={`pen-${req.id}`}>
      <td className="info-cell">
        <div className="patient-name">{req.name}</div>
      </td>
      <td>
        <span className="status-tag waiting">Menunggu</span>
      </td>
      <td className="time-cell">{req.date || 'Baru saja'}</td>
    </tr>
  ))}

  {rejectedRequests.length > 0 && rejectedRequests.map((req) => (
    <tr key={`rej-${req.id}`}>
      <td className="info-cell">
        <div className="patient-name">{req.name}</div>
      </td>
      <td>
        <span className="status-tag rejected">Ditolak</span>
      </td>
      <td className="time-cell">Oleh Pasien</td>
    </tr>
  ))}

              {/* 4. JIKA SEMUA KOSONG */}
              {approvedDocs.length === 0 && pendingRequests.length === 0 && rejectedRequests.length === 0 && (
                <tr>
                  <td colSpan="3" className="empty-row">Belum ada riwayat permintaan akses.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      <style jsx>{`
      /* Hijau untuk Disetujui */
.status-tag.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

/* Kuning/Oranye untuk Menunggu */
.status-tag.waiting {
  background: #fff8e1;
  color: #f57f17;
  border: 1px solid #ffecb3;
}

/* Merah untuk Ditolak */
.status-tag.rejected {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.status-tag {
  font-size: 10px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
}
        /* Background utama dibuat lebih terang (Putih Kebiruan Sangat Muda) */
        .request-wrapper { 
          padding: 10px 0; 
          background: transparent; 
        }

        /* HEADER STYLE */
        .header-content { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 25px; 
        }
        .title { font-size: 24px; font-weight: 700; margin: 0; color: #333; }
        .subtitle { font-size: 14px; color: #666; margin-top: 4px; }

        .alert-info {
          background: #e3f2fd; 
          border: 1px solid #bbdefb;
          border-radius: 16px; 
          padding: 18px;
          display: flex; 
          gap: 15px; 
          margin-bottom: 30px;
        }
        .alert-icon { color: #1976d2; }
        .alert-text p { margin: 0; font-size: 14px; color: #0d47a1; line-height: 1.5; }

        .main-grid-request { display: flex; flex-direction: column; gap: 25px; }

        /* CARD STYLE (Putih Bersih) */
        .request-card, .history-card {
          background: #ffffff; 
          border: 1px solid #f0f0f0;
          border-radius: 24px; 
          padding: 25px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        .card-header-simple h3 {
          margin: 0 0 20px 0; 
          font-size: 17px; 
          color: #333;
          font-weight: 700;
        }

        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #555; }
        
        /* Input Field Lebih Cerah */
        .input-field {
          width: 100%; 
          padding: 14px 15px; 
          border: 1.5px solid #eee;
          border-radius: 12px; 
          font-family: monospace; 
          font-size: 14px;
          background: #fff; 
          transition: 0.2s;
        }
        .input-field:focus { outline: none; border-color: #2e7d32; box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.1); }
        
        .btn-submit {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          background: #2e7d32; color: white; border: none;
          padding: 14px 25px; border-radius: 12px; font-weight: 600;
          cursor: pointer; width: 100%; transition: 0.2s;
        }
        .btn-submit:hover { background: #1b5e20; }
        .btn-submit:disabled { background: #ccc; }

        .btn-search {
          background: #333;
          color: white;
          border: none;
          padding: 0 20px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .search-results {
          background: #f9f9f9;
          border-radius: 12px;
          border: 1px solid #eee;
          max-height: 200px;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .result-item {
          padding: 12px 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          border-bottom: 1px solid #f0f0f0;
          transition: 0.2s;
        }
        .result-item:last-child { border-bottom: none; }
        .result-item:hover { background: #f0f0f0; }
        .result-item.selected { background: #e8f5e9; border-left: 4px solid #2e7d32; }

        .res-name { font-weight: 700; font-size: 14px; margin: 0; color: #333; }
        .res-sub { font-size: 11px; color: #888; margin: 2px 0 0 0; }
        .selected-tag { font-size: 10px; font-weight: 800; color: #2e7d32; text-transform: uppercase; }

        /* TABLE STYLE */
        .request-table { width: 100%; border-collapse: collapse; }
        .request-table th { text-align: left; padding: 12px; font-size: 12px; color: #999; border-bottom: 1px solid #f0f0f0; text-transform: uppercase; letter-spacing: 0.5px; }
        .request-table td { padding: 16px 12px; font-size: 14px; border-bottom: 1px solid #fafafa; }
        .addr-cell { font-family: monospace; color: #444; font-weight: 500; }
        .status-tag { padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
        .status-tag.waiting { background: #fff8e1; color: #f57f17; }
        .empty-row { text-align: center; color: #bbb; padding: 40px 0; font-style: italic; }

        .info-cell {
          padding: 12px;
        }
        .patient-name {
          font-weight: 700; /* Nama Bold */
          color: #333;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .patient-addr {
          font-size: 11px; /* Wallet lebih kecil */
          color: #888;
          font-family: monospace;
        }
        .request-table {
          width: 100%;
          border-collapse: collapse;
        }
        .request-table th {
          text-align: left;
          font-size: 12px;
          color: #999;
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
        }
        .request-table td {
          border-bottom: 1px solid #fafafa;
          vertical-align: middle;
        }
        .status-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }
        .status-tag.waiting {
          background: #fff8e1;
          color: #f57f17;
        }
        .time-cell {
          font-size: 12px;
          color: #999;
        }
        .empty-row {
          text-align: center;
          padding: 40px;
          color: #bbb;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default RequestAccess;