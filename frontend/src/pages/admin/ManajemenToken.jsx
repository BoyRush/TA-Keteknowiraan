import React, { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle, Trash2, Plus, Clock, User } from 'lucide-react';

const ManajemenToken = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');

  const fetchTokens = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/sh/admin/tokens');
      if (res.ok) {
        const data = await res.json();
        setTokens(data.tokens || []);
      }
    } catch (e) {
      console.error('Error fetching tokens:', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleGenerateToken = async () => {
    setGenerating(true);
    try {
      const res = await fetch('http://127.0.0.1:5000/sh/admin/tokens/generate', {
        method: 'POST'
      });
      if (res.ok) {
        await fetchTokens();
      }
    } catch (e) {
      console.error('Error generating token:', e);
    }
    setGenerating(false);
  };

  const handleDeleteToken = async (id) => {
    if (!window.confirm('Yakin ingin menghapus token ini?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/sh/admin/tokens/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchTokens();
      } else {
        alert('Gagal menghapus token atau token sudah digunakan');
      }
    } catch (e) {
      console.error('Error deleting token:', e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(''), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const activeTokens = tokens.filter(t => t.status === 'ACTIVE').length;
  const usedTokens = tokens.filter(t => t.status === 'USED').length;

  return (
    <div className="token-container">
      <div className="header-section">
        <div>
          <h1 className="title">Manajemen Token Premium</h1>
          <p className="subtitle">Kelola dan generate token aktivasi untuk pasien Premium.</p>
        </div>
        <button 
          className="btn-generate"
          onClick={handleGenerateToken}
          disabled={generating}
        >
          {generating ? 'Loading...' : <><Plus size={18} /> Generate Token Baru</>}
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon bg-blue"><Key size={24} color="#3b82f6" /></div>
          <div className="stat-info">
            <p>Total Token</p>
            <h3>{tokens.length}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-green"><CheckCircle size={24} color="#10b981" /></div>
          <div className="stat-info">
            <p>Token Aktif / Siap Pakai</p>
            <h3>{activeTokens}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-orange"><Clock size={24} color="#f59e0b" /></div>
          <div className="stat-info">
            <p>Token Terpakai</p>
            <h3>{usedTokens}</h3>
          </div>
        </div>
      </div>

      <div className="table-card">
        <h3 className="card-title">Daftar Token</h3>
        
        {loading ? (
          <div className="loading-state">Memuat data...</div>
        ) : tokens.length === 0 ? (
          <div className="empty-state">
            <Key size={48} color="#cbd5e1" />
            <p>Belum ada token. Generate token pertama Anda.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="token-table">
              <thead>
                <tr>
                  <th>Kode Token</th>
                  <th>Status</th>
                  <th>Dibuat Pada</th>
                  <th>Digunakan Oleh</th>
                  <th>Waktu Digunakan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map(token => (
                  <tr key={token.id}>
                    <td>
                      <div className="token-code-cell">
                        <span className="token-code">{token.token_code}</span>
                        <button 
                          className="btn-copy" 
                          onClick={() => copyToClipboard(token.token_code)}
                          title="Copy Token"
                        >
                          {copiedToken === token.token_code ? <CheckCircle size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${token.status.toLowerCase()}`}>
                        {token.status === 'ACTIVE' ? 'SIAP PAKAI' : 'TERPAKAI'}
                      </span>
                    </td>
                    <td><div className="date-cell"><Clock size={14} /> {formatDate(token.created_at)}</div></td>
                    <td>
                      {token.used_by ? (
                        <div className="user-cell">
                          <User size={14} />
                          <span>{token.used_by.substring(0, 6)}...{token.used_by.substring(token.used_by.length - 4)}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td>{formatDate(token.used_at)}</td>
                    <td>
                      {token.status === 'ACTIVE' ? (
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteToken(token.id)}
                          title="Hapus Token"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .token-container {
          animation: fadeIn 0.4s ease;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
        .subtitle { font-size: 14px; color: #6b7280; margin: 4px 0 0 0; }
        
        .btn-generate {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-generate:hover:not(:disabled) { background: #2563eb; }
        .btn-generate:disabled { opacity: 0.7; cursor: not-allowed; }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon.bg-blue { background: #eff6ff; }
        .stat-icon.bg-green { background: #ecfdf5; }
        .stat-icon.bg-orange { background: #fffbeb; }
        .stat-info p { margin: 0; font-size: 13px; color: #6b7280; }
        .stat-info h3 { margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #111827; }

        .table-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
        }
        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 20px 0;
        }

        .table-responsive {
          overflow-x: auto;
        }
        .token-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        .token-table th {
          text-align: left;
          padding: 12px 16px;
          background: #f9fafb;
          color: #6b7280;
          font-weight: 600;
          border-bottom: 1px solid #e5e7eb;
        }
        .token-table td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }
        .token-table tbody tr:hover { background: #f9fafb; }

        .token-code-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .token-code {
          font-family: monospace;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 1px;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 6px;
          color: #1f2937;
        }
        .btn-copy {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .btn-copy:hover { color: #4b5563; background: #e5e7eb; }

        .status-badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .status-badge.active { background: #d1fae5; color: #065f46; }
        .status-badge.used { background: #f3f4f6; color: #4b5563; }

        .date-cell, .user-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
        }

        .btn-delete {
          background: #fff5f5;
          color: #ef4444;
          border: 1px solid #fee2e2;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-delete:hover { background: #fee2e2; }

        .empty-state, .loading-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }
        .empty-state p { margin-top: 12px; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ManajemenToken;
