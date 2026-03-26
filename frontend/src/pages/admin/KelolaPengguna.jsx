import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const KelolaPengguna = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://127.0.0.1:5000/admin/users');
        const data = await res.json();
        if (data.status === 'success') {
          setUsers(data.users || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error('❌ Gagal ambil data pengguna:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(term) ||
      u.address.toLowerCase().includes(term) ||
      u.role.toLowerCase().includes(term)
    );
  });

  // --- Helper: Warna Avatar berdasarkan Role ---
  const getAvatarColor = (role) => {
    if (role === 'Dokter Medis') return { bg: '#e8f5e9', color: '#2e7d32' };
    if (role === 'Dokter Herbal') return { bg: '#e8f5e9', color: '#388e3c' };
    return { bg: '#e3f2fd', color: '#1565c0' }; // Pasien
  };

  // --- Helper: Label & Warna Role Badge ---
  const getRoleBadge = (role) => {
    if (role === 'Dokter Medis') return { label: 'Dokter Medis', bg: '#e8f0fe', color: '#1a73e8', border: '#c5d8f8' };
    if (role === 'Dokter Herbal') return { label: 'Dokter Herbal', bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' };
    return { label: 'Pasien', bg: '#e8f5e9', color: '#388e3c', border: '#c8e6c9' };
  };

  // --- Helper: Label & Warna Status Badge ---
  const getStatusBadge = (status) => {
    if (status === 'active') return { label: 'Aktif', bg: '#e8f5e9', color: '#2e7d32', border: '#c8e6c9' };
    if (status === 'pending') return { label: 'Menunggu', bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    return { label: 'Nonaktif', bg: '#ffebee', color: '#c62828', border: '#ffcdd2' };
  };

  // Helper: Inisial Nama
  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="kp-container">
      {/* Header */}
      <div className="kp-header">
        <h1 className="kp-title">Kelola Pengguna</h1>
        <p className="kp-subtitle">Daftar semua pengguna yang terdaftar di sistem</p>
      </div>

      {/* Search Bar */}
      <div className="kp-search-bar">
        <Search size={16} className="kp-search-icon" />
        <input
          type="text"
          placeholder="Cari nama, wallet, atau role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="kp-search-input"
        />
      </div>

      {/* List Card */}
      <div className="kp-card">
        {loading ? (
          <p className="kp-empty">Memuat data dari Blockchain...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="kp-empty">Tidak ada pengguna yang cocok.</p>
        ) : (
          filteredUsers.map((user, idx) => {
            const avatarStyle = getAvatarColor(user.role);
            const roleBadge = getRoleBadge(user.role);
            const statusBadge = getStatusBadge(user.status);
            // Pasien hanya tampil status Aktif (sesuai ketentuan)
            const showStatus = user.role !== 'Pasien' ? true : true; // Pasien tetap tampil 'Aktif'

            return (
              <div key={idx} className="kp-item">
                {/* Avatar */}
                <div
                  className="kp-avatar"
                  style={{ background: avatarStyle.bg, color: avatarStyle.color }}
                >
                  {getInitials(user.name)}
                </div>

                {/* Info */}
                <div className="kp-info">
                  <div className="kp-name">{user.name}</div>
                  <div className="kp-address">
                    {user.address.substring(0, 20)}...{user.address.substring(user.address.length - 6)}
                  </div>
                </div>

                {/* Badges */}
                <div className="kp-badges">
                  <span
                    className="kp-badge"
                    style={{ background: roleBadge.bg, color: roleBadge.color, border: `1px solid ${roleBadge.border}` }}
                  >
                    {roleBadge.label}
                  </span>
                  <span
                    className="kp-badge"
                    style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}
                  >
                    {/* Pasien selalu tampilkan Aktif */}
                    {user.role === 'Pasien' ? 'Aktif' : statusBadge.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Count */}
      {!loading && (
        <p className="kp-footer">
          Menampilkan {filteredUsers.length} dari {total} pengguna
        </p>
      )}

      <style jsx>{`
        .kp-container { animation: fadeIn 0.4s ease; }

        .kp-header { margin-bottom: 20px; }
        .kp-title { font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0; }
        .kp-subtitle { font-size: 14px; color: #888; margin: 4px 0 0; }

        .kp-search-bar {
          position: relative;
          margin-bottom: 20px;
        }
        .kp-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #aaa;
        }
        .kp-search-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          border-radius: 12px;
          border: 1px solid #e8e8e8;
          font-size: 14px;
          color: #333;
          background: #fff;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .kp-search-input:focus { border-color: #4caf50; }

        .kp-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #f0f0f0;
          padding: 8px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.02);
        }

        .kp-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .kp-item:last-child { border-bottom: none; }

        .kp-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .kp-info { flex: 1; overflow: hidden; }
        .kp-name {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .kp-address {
          font-size: 12.5px;
          color: #999;
          margin-top: 2px;
          font-family: monospace;
        }

        .kp-badges {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .kp-badge {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
          white-space: nowrap;
        }

        .kp-empty {
          text-align: center;
          padding: 40px;
          color: #aaa;
          font-style: italic;
        }

        .kp-footer {
          text-align: center;
          font-size: 13px;
          color: #aaa;
          margin-top: 16px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default KelolaPengguna;
