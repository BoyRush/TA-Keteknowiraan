import React, { useState, useEffect } from 'react';
import { Calendar, FileText, User } from 'lucide-react'; 
import { useAuth } from '../../../context/AuthContext';

const RiwayatMedis = ({ medicalRecords = [] }) => {
  return (
    <div className="menu-wrapper">
      <div className="header-section">
        <h2 className="title">Riwayat Data Medis</h2>
        <p className="subtitle">Daftar rekam medis Anda yang tersimpan secara aman dalam sistem</p>
      </div>

      <div className="card-white">
        {medicalRecords.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} color="#ccc" />
            <p>Belum ada data medis yang tercatat untuk akun ini.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="medical-table">
              <thead>
                <tr>
                  <th><div className="th-content"><Calendar size={14} /> Tanggal & Waktu</div></th>
                  <th><div className="th-content"><FileText size={14} /> Diagnosis</div></th>
                  <th><div className="th-content"><User size={14} /> Diterbitkan Oleh</div></th> 
                </tr>
              </thead>
              <tbody>
                {medicalRecords
                  .filter((rec) => rec.isActive !== false)
                  .map((rec, idx) => (
                    <tr key={rec.id}>
                      <td className="td-date">
                        {new Date(rec.timestamp).toLocaleString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="td-diagnosis">
                        <div className="diagnosis-badge">{rec.diagnosis}</div>
                        {rec.symptoms && <p style={{fontSize: '11px', color: '#666', marginTop: '4px'}}><b>Gejala:</b> {rec.symptoms}</p>}
                        {rec.treatment && <p style={{fontSize: '11px', color: '#666'}}><b>Terapi:</b> {rec.treatment}</p>}
                      </td>
                      <td className="td-doctor">
                        <span className="doctor-name">
                          dr. {rec.doctor}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .menu-wrapper { animation: fadeIn 0.4s ease; }
        .title { font-size: 20px; font-weight: 700; color: #333; margin: 0; }
        .subtitle { font-size: 13px; color: #777; margin: 4px 0 25px 0; }
        .card-white { background: white; border-radius: 20px; border: 1px solid #f0f0f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .table-container { width: 100%; overflow-x: auto; }
        .medical-table { width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; }
        .medical-table th { background: #fafafa; padding: 15px 20px; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 1px solid #eee; }
        .medical-table th:nth-child(1) { width: 20%; }
        .medical-table th:nth-child(2) { width: 50%; }
        .medical-table th:nth-child(3) { width: 30%; }
        .th-content { display: flex; align-items: center; gap: 8px; }
        .medical-table td { padding: 18px 20px; border-bottom: 1px solid #f9f9f9; font-size: 13px; color: #444; vertical-align: top; }
        .diagnosis-badge { background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 12px; display: inline-block; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; max-width: 100%; }
        .doctor-name { font-family: sans-serif; color: #1976d2; background: #e3f2fd; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }

        .empty-state { padding: 60px; text-align: center; color: #aaa; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RiwayatMedis;