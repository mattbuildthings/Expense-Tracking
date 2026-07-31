import React, { useState, useEffect } from 'react';
import { X, Save, Lock, ShieldCheck, Key, RefreshCw, Database, Copy, Check } from 'lucide-react';
import { savePinCode, isPinEnabled, setPinEnabled, getProjectName, saveProjectName } from '../services/storageService';
import { getSupabaseUrl, getSupabaseAnonKey, setSupabaseConfig, resetSupabaseInstance, getSupabaseClient } from '../services/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectNameChange: (name: string) => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onProjectNameChange,
  onResetData
}) => {
  if (!isOpen) return null;

  const [projectName, setProjectNameInput] = useState('');
  const [pinCode, setPinCodeInput] = useState('');
  const [pinEnabled, setPinEnabledInput] = useState(false);
  
  // Supabase state
  const [supabaseUrl, setSupabaseUrlInput] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKeyInput] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setProjectNameInput(getProjectName());
    setPinEnabledInput(isPinEnabled());
    setSupabaseUrlInput(getSupabaseUrl());
    setSupabaseAnonKeyInput(getSupabaseAnonKey());

    // Purge any lingering client-side API keys from local storage
    localStorage.removeItem('gemini_api_key');

    // Check Supabase connection
    const client = getSupabaseClient();
    setIsSupabaseConnected(Boolean(client && getSupabaseAnonKey()));
  }, [isOpen]);

  const handleSave = async () => {
    saveProjectName(projectName);
    onProjectNameChange(projectName);
    setPinEnabled(pinEnabled);
    
    if (pinEnabled && pinCode.trim()) {
      await savePinCode(pinCode.trim());
    }

    // Always keep client-side storage free of raw API keys
    localStorage.removeItem('gemini_api_key');

    // Save Supabase config
    setSupabaseConfig(supabaseUrl, supabaseAnonKey);
    resetSupabaseInstance();

    const client = getSupabaseClient();
    setIsSupabaseConnected(Boolean(client && supabaseAnonKey.trim()));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const sqlScript = `-- Run this script ONCE in your Supabase SQL Editor:

-- 1. Create expenses table
create table if not exists public.expenses (
  id text primary key,
  date text not null,
  amount numeric not null,
  quantity numeric,
  unit text,
  unit_cost numeric,
  category text not null,
  sub_category text,
  merchant text not null,
  note text not null,
  man_days numeric,
  payment_method text not null,
  image_url text,
  image_type text,
  status text not null,
  confidence_score numeric,
  ai_reasoning text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- 2. Create audit logs table
create table if not exists public.audit_logs (
  id text primary key,
  timestamp text not null,
  action text not null,
  expense_id text not null,
  expense_snapshot jsonb not null,
  description text not null
);

-- 3. Create storage bucket for receipt photos
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- 4. Open public permissions for app API access
alter table public.expenses disable row level security;
alter table public.audit_logs disable row level security;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', borderRadius: '24px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
              <Lock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Cài Đặt & Đồng Bộ Đa Thiết Bị
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Cấu hình tên công trình, bảo mật PIN & Supabase Cloud Sync
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Saved Toast Alert */}
        {savedSuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontWeight: 700, textAlign: 'center' }}>
            ✅ Đã lưu cấu hình thành công!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Project Name Input */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
              🏗️ Tên Dự Án / Công Trình
            </label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectNameInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontWeight: 700
              }}
            />
          </div>

          {/* Supabase Cloud Sync Configuration */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="#34d399" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>
                  🌐 Đồng Bộ Đám Mây Supabase (Điện Thoại ↔ Máy Tính)
                </h3>
              </div>
              <span className="badge" style={{ background: isSupabaseConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isSupabaseConnected ? '#34d399' : '#f87171' }}>
                {isSupabaseConnected ? '🟢 Đã Kết Nối' : '🔴 Chưa Điền Key'}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Dán URL & Public Anon Key từ Supabase Dashboard của bạn để tự động đồng bộ hóa đơn giữa Điện Thoại và Máy Tính thời gian thực.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrlInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Supabase Public Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhY2NvdW50X2lkIjoi... (Dán anon key tại đây)"
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKeyInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                />
              </div>

              {/* Copy SQL Script Button */}
              <div style={{ marginTop: '6px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleCopySql} style={{ width: '100%', justifyContent: 'center' }}>
                  {copiedSql ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                  <span>{copiedSql ? 'Đã Copy SQL Setup Script!' : '📋 Copy SQL Script Tạo Bảng Cho Supabase SQL Editor'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* PIN Passcode Security (SHA-256 Hashed) */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#fbbf24" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Mã PIN Bảo Mật (Mã Hóa SHA-256)
                </h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={e => setPinEnabledInput(e.target.checked)}
                />
                <span>Bật khóa PIN</span>
              </label>
            </div>

            {pinEnabled && (
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Thiết Lập Mã PIN Mới (4 - 8 Số)
                </label>
                <input
                  type="password"
                  maxLength={8}
                  placeholder="Nhập PIN mới..."
                  value={pinCode}
                  onChange={e => setPinCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{
                    width: '180px',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fbbf24',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    textAlign: 'center'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  🔒 Mã PIN sẽ được mã hóa bằng chuỗi SHA-256 trước khi lưu. Không lưu dạng văn bản thuần.
                </p>
              </div>
            )}
          </div>

          {/* Serverless Gemini AI API Proxy Status Badge */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Key size={18} color="#60a5fa" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#60a5fa' }}>
                🔒 Bảo Mật Chìa Khóa Gemini AI API (Serverless Proxy)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Chìa khóa Gemini API Key được bảo mật tại biến môi trường Serverless Backend (<code style={{ color: '#34d399' }}>GEMINI_API_KEY</code>). Không có bất kỳ chìa khóa API nào bị lưu trữ trên trình duyệt hoặc bộ nhớ máy client.
            </p>
          </div>

          {/* Reset to Default */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu mẫu không?')) {
                  onResetData();
                  onClose();
                }
              }}
            >
              <RefreshCw size={14} />
              <span>Đặt Lại Dữ Liệu Mẫu Mặc Định</span>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} />
            <span>Lưu Cấu Hình</span>
          </button>
        </div>

      </div>
    </div>
  );
};
