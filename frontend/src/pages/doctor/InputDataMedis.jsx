import React from 'react';

const InputDataMedis = ({ 
  approvedPatients, 
  patientAddr, 
  setPatientAddr, 
  medicalData, 
  setMedicalData, 
  handleSave, 
  txLoading, 
  isEditMode 
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setMedicalData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="menu-wrapper">
      <div className="header-section">
        <h2 className="title">Tambah Data Medis</h2>
        <p className="subtitle">Input data medis untuk pasien yang sudah memberi akses</p>
      </div>

      <div className="alert-info">
        <span className="icon">ⓘ</span>
        <p>Kamu hanya bisa menambahkan data medis untuk pasien yang sudah menyetujui request aksesmu.</p>
      </div>

      <div className="card-white">
        <form onSubmit={handleSave} className="form-medical">
          <div className="form-group">
            <label>Pilih Pasien</label>
            <select 
              value={patientAddr} 
              onChange={(e) => setPatientAddr(e.target.value)}
              className="form-input"
              required
            >
              <option value="">-- Pilih Pasien Terdaftar --</option>
              {approvedPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Diagnosa</label>
            <p className="hint">Tuliskan diagnosa pasien secara mendetail:</p>
            <textarea 
              name="diagnosis"
              value={medicalData.diagnosis}
              onChange={handleChange}
              className="form-textarea"
              required
              placeholder="Contoh: Pasien mengalami gejala flu disertai batuk berdahak selama 3 hari..."
            />
          </div>

          <button type="submit" disabled={txLoading} className={`btn-submit ${isEditMode ? 'edit' : ''}`}>
            {txLoading ? "Menyimpan Data..." : (isEditMode ? "Perbarui Data" : "Simpan Rekam Medis")}
          </button>
        </form>
      </div>

      <style jsx>{`
        .menu-wrapper { animation: fadeIn 0.4s ease; }
        .alert-info { 
          display: flex; gap: 12px; background: #e3f2fd; 
          padding: 15px 20px; border-radius: 12px; margin-bottom: 25px;
          color: #1976d2; font-size: 14px; align-items: center;
        }
        .card-white { background: white; border-radius: 20px; padding: 30px; border: 1px solid #f0f0f0; }
        .form-group { margin-bottom: 25px; }
        .form-group label { display: block; font-weight: 700; margin-bottom: 8px; color: #333; font-size: 15px; }
        .hint { font-size: 13px; color: #777; margin-bottom: 10px; }
        .form-input, .form-textarea { 
          width: 100%; padding: 14px; border: 1px solid #ddd; border-radius: 12px;
          font-family: inherit; font-size: 14px; background: #fff;
        }
        .form-textarea { height: 180px; resize: vertical; }
        .btn-submit { 
          width: 100%; padding: 16px; border: none; border-radius: 12px;
          background: #2e7d32; color: white; font-weight: 700; cursor: pointer;
          transition: 0.3s; font-size: 15px;
        }
        .btn-submit:hover { background: #1b5e20; }
        .btn-submit:disabled { background: #ccc; cursor: not-allowed; }
        .btn-submit.edit { background: #ffa000; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default InputDataMedis;