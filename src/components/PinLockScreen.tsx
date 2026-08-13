import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { verifyPinCode, getStoredPinHash } from '../services/storageService';

interface PinLockScreenProps {
  projectName: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ projectName, onUnlock }) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedHash = getStoredPinHash();

    if (!storedHash) {
      setErrorMsg('Chưa cài đặt mã PIN. Vui lòng thiết lập mã PIN trong Cài Đặt.');
      return;
    }

    const isValid = await verifyPinCode(pinInput);
    if (isValid) {
      onUnlock();
    } else {
      setErrorMsg('Mã PIN không chính xác, vui lòng thử lại!');
      setPinInput('');
      setTimeout(() => setErrorMsg(null), 2000);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: '#0b0f19', zIndex: 9999 }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', padding: '36px 28px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)' }}>
        
        {/* Lock Icon Badge */}
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '22px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)'
        }}>
          <Lock size={34} color="#ffffff" />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
          {projectName}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '24px' }}>
          Nhập mã PIN để mở khóa sổ chi phí công trình
        </p>

        <form onSubmit={handleUnlockSubmit}>
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <KeyRound size={20} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              maxLength={8}
              autoFocus
              placeholder="Nhập mã PIN..."
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                background: 'var(--bg-input)',
                border: errorMsg ? '2px solid #f43f5e' : '1px solid var(--border-color)',
                borderRadius: '14px',
                color: '#f8fafc',
                fontSize: '1.2rem',
                letterSpacing: '0.3em',
                textAlign: 'center',
                outline: 'none',
                transition: 'all 0.2s'
              }}
            />
          </div>

          {errorMsg && (
            <p style={{ fontSize: '0.82rem', color: '#f43f5e', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: '14px' }}>
            <span>Mở Khóa Ứng Dụng</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          <ShieldCheck size={16} color="#34d399" />
          <span>Mã PIN được bảo mật bằng mã hóa SHA-256</span>
        </div>

      </div>
    </div>
  );
};
