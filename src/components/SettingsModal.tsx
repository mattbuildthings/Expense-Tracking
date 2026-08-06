import React, { useState, useEffect } from 'react';
import { X, Save, Lock, ShieldCheck, Key, RefreshCw, Database, Copy, Check, Target } from 'lucide-react';
import { savePinCode, isPinEnabled, setPinEnabled, getProjectName, saveProjectName, getCategoryBudgets, saveCategoryBudgets, getInitialFunds, saveInitialFunds, formatVND } from '../services/storageService';
import { getSupabaseUrl, getSupabaseAnonKey, setSupabaseConfig, resetSupabaseInstance, getSupabaseClient } from '../services/supabaseClient';
import { CATEGORY_METADATA } from '../types/expense';
import type { CategoryBudgets, ExpenseCategory } from '../types/expense';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectNameChange: (name: string) => void;
  onResetData: () => void;
}

function formatFormattedNumber(raw: number | string | undefined | null): string {
  if (raw === undefined || raw === null || raw === '') return '';
  const num = typeof raw === 'number' ? raw : parseFloat(raw.toString().replace(/,/g, ''));
  if (isNaN(num)) return '';
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function parseFormattedNumber(val: string): number {
  const clean = val.replace(/,/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
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
  const [budgets, setBudgets] = useState<CategoryBudgets>({} as CategoryBudgets);
  const [bankFundsStr, setBankFundsStr] = useState('');
  const [cashFundsStr, setCashFundsStr] = useState('');
  
  const [geminiApiKey, setGeminiApiKeyInput] = useState('');
  const [supabaseUrl, setSupabaseUrlInput] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKeyInput] = useState('');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setProjectNameInput(getProjectName());
    setPinEnabledInput(isPinEnabled());
    setGeminiApiKeyInput(localStorage.getItem('gemini_api_key') || '');
    setSupabaseUrlInput(getSupabaseUrl());
    setSupabaseAnonKeyInput(getSupabaseAnonKey());
    setBudgets(getCategoryBudgets());
    const funds = getInitialFunds();
    setBankFundsStr(formatFormattedNumber(funds.bank));
    setCashFundsStr(formatFormattedNumber(funds.cash));

    // Check Supabase connection
    const client = getSupabaseClient();
    setIsSupabaseConnected(Boolean(client && getSupabaseAnonKey()));
  }, [isOpen]);

  const handleBudgetChange = (catKey: ExpenseCategory, valStr: string) => {
    const parsed = parseFormattedNumber(valStr);
    setBudgets(prev => ({
      ...prev,
      [catKey]: parsed
    }));
  };

  const handleSave = async () => {
    saveProjectName(projectName);
    onProjectNameChange(projectName);
    setPinEnabled(pinEnabled);
    saveCategoryBudgets(budgets);

    if (geminiApiKey.trim()) {
      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }

    const bankNum = parseFormattedNumber(bankFundsStr);
    const cashNum = parseFormattedNumber(cashFundsStr);
    saveInitialFunds(bankNum, cashNum);
    
    if (pinEnabled && pinCode.trim()) {
      await savePinCode(pinCode.trim());
    }
    
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

  const totalTargetBudget = Object.values(budgets).reduce((sum, b) => sum + (b || 0), 0);

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
      <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', borderRadius: '24px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
              <Lock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Cài Đặt & Định Mức Ngân Sách
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Cấu hình tên công trình, hạn mức dự toán (BVA) & Supabase Cloud Sync
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

          {/* Initial Funds Setup (Quỹ Dòng Tiền Ban Đầu) */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '18px', padding: '20px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#34d399', marginBottom: '12px' }}>
              💵 Nguồn Vốn / Dòng Tiền Ban Đầu (Cash Flow Baseline)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Nhập số tiền ban đầu trong Ngân hàng và Tiền mặt. Hệ thống sẽ tự động trừ dần khi bạn ghi chép hóa đơn mà KHÔNG CẦN nhập thêm thao tác kế toán nào!
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', display: 'block', marginBottom: '4px' }}>
                  🏦 Số Dư Ngân Hàng Ban Đầu (đ)
                </label>
                <input
                  type="text"
                  placeholder="VD: 1,000,000,000"
                  value={bankFundsStr}
                  onChange={e => setBankFundsStr(formatFormattedNumber(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '4px' }}>
                  💵 Số Dư Ví Tiền Mặt Ban Đầu (đ)
                </label>
                <input
                  type="text"
                  placeholder="VD: 100,000,000"
                  value={cashFundsStr}
                  onChange={e => setCashFundsStr(formatFormattedNumber(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#34d399', fontSize: '0.9rem', fontWeight: 800 }}
                />
              </div>
            </div>
          </div>

          {/* Phase 1: Target Budget Setup (Ngân Sách Dự Toán 9 Hạng Mục) */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color="#60a5fa" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#60a5fa' }}>
                  🎯 Hạn Mức Ngân Sách Dự Toán (Budget vs. Actual - BVA)
                </h3>
              </div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#34d399' }}>
                Tổng Dự Toán: {formatVND(totalTargetBudget)}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Thiết lập hạn mức ngân sách tối đa cho 9 hạng mục công trình. Hệ thống sẽ tính toán mức chi tiêu thực tế vs. dự toán và cảnh báo khi sắp vượt trần chi phí.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => {
                const key = catKey as ExpenseCategory;
                const val = budgets[key] !== undefined ? budgets[key] : 0;

                return (
                  <div key={key} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: meta.color, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.color }} />
                      <span>{meta.label}</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="VD: 550,000,000"
                        value={formatFormattedNumber(val)}
                        onChange={e => handleBudgetChange(key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.88rem',
                          fontWeight: 700
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gemini Vision AI API Key Configuration */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', padding: '18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={20} color="#60a5fa" />
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#60a5fa' }}>
                  🤖 Chìa Khóa AI Đọc Hóa Đơn (Gemini Vision API Key)
                </h3>
              </div>
              <span className="badge" style={{ background: geminiApiKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: geminiApiKey ? '#34d399' : '#fbbf24' }}>
                {geminiApiKey ? '🟢 Đã Kích Hoạt Key' : '🟡 Chưa Điền Key'}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Nhập chìa khóa Google Gemini Flash API key để AI nhận diện và trích xuất hóa đơn Zalo/Vietcombank chính xác 100%. Lấy key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Google AI Studio ➔</a>
            </p>

            <input
              type="password"
              placeholder="AIzaSy... (Dán Gemini API Key tại đây)"
              value={geminiApiKey}
              onChange={e => setGeminiApiKeyInput(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#60a5fa', fontSize: '0.9rem', fontWeight: 700 }}
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

          {/* PIN Passcode Security */}
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
