import React, { useState, useEffect } from 'react';
import { X, Save, Lock, ShieldCheck, Key, RefreshCw, Database, Copy, Check, Target } from 'lucide-react';
import { savePinCode, isPinEnabled, setPinEnabled, getProjectName, saveProjectName, getCategoryBudgets, saveCategoryBudgets, getInitialFunds, saveInitialFunds, formatVND } from '../services/storageService';
import { getSupabaseUrl, getSupabaseAnonKey, setSupabaseConfig, resetSupabaseInstance, getSupabaseClient } from '../services/supabaseClient';
import { CATEGORY_METADATA } from '../types/expense';
import type { CategoryBudgets, ExpenseCategory } from '../types/expense';
import { useLanguage } from '../i18n/LanguageContext';

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
  const { t, language } = useLanguage();
  const catLabel = (meta: { label: string; englishLabel: string }) => (language === 'en' ? meta.englishLabel : meta.label);
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
              <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                {t('settings.title')}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Saved Toast Alert */}
        {savedSuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '12px 16px', borderRadius: '12px', marginBottom: '16px', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Check size={16} /> {t('settings.savedToast')}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Project Name Input */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '6px' }}>
              {t('settings.projectNameLabel')}
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
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            />
          </div>

          {/* Initial Funds Setup (Quỹ Dòng Tiền Ban Đầu) */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '18px', padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', marginBottom: '12px' }}>
              {t('settings.initialFundsTitle')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {t('settings.initialFundsBody')}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', display: 'block', marginBottom: '4px' }}>
                  {t('settings.initialBankLabel')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1,000,000,000"
                  value={bankFundsStr}
                  onChange={e => setBankFundsStr(formatFormattedNumber(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '4px' }}>
                  {t('settings.initialCashLabel')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100,000,000"
                  value={cashFundsStr}
                  onChange={e => setCashFundsStr(formatFormattedNumber(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#34d399', fontSize: '0.75rem', fontWeight: 800 }}
                />
              </div>
            </div>
          </div>

          {/* Phase 1: Target Budget Setup (Ngân Sách Dự Toán 9 Hạng Mục) */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '18px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={20} color="#60a5fa" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#60a5fa' }}>
                  {t('settings.budgetLimitsTitle')}
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399' }}>
                {t('settings.totalBudgetLabel')} {formatVND(totalTargetBudget)}
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {t('settings.budgetLimitsBody')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => {
                const key = catKey as ExpenseCategory;
                const val = budgets[key] !== undefined ? budgets[key] : 0;

                return (
                  <div key={key} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: meta.color, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta.color }} />
                      <span>{catLabel(meta)}</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="e.g. 550,000,000"
                        value={formatFormattedNumber(val)}
                        onChange={e => handleBudgetChange(key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '0.75rem',
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
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#60a5fa' }}>
                  {t('settings.geminiKeyTitle')}
                </h3>
              </div>
              <span className="badge" style={{ background: geminiApiKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: geminiApiKey ? '#34d399' : '#fbbf24' }}>
                {geminiApiKey ? t('settings.keyActive') : t('settings.keyMissing')}
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('settings.geminiKeyBody')} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>Google AI Studio ➔</a>
            </p>

            <input
              type="password"
              placeholder={t('settings.geminiKeyPlaceholder')}
              value={geminiApiKey}
              onChange={e => setGeminiApiKeyInput(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#60a5fa', fontSize: '0.75rem', fontWeight: 700 }}
            />
          </div>

          {/* Supabase Cloud Sync Configuration */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={20} color="#34d399" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }}>
                  {t('settings.supabaseTitle')}
                </h3>
              </div>
              <span className="badge" style={{ background: isSupabaseConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isSupabaseConnected ? '#34d399' : '#f87171' }}>
                {isSupabaseConnected ? t('settings.connected') : t('settings.keyMissing')}
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              {t('settings.supabaseBody')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.supabaseUrlLabel')}
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrlInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.75rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.supabaseKeyLabel')}
                </label>
                <input
                  type="password"
                  placeholder={t('settings.supabaseKeyPlaceholder')}
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKeyInput(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.75rem' }}
                />
              </div>

              {/* Copy SQL Script Button */}
              <div style={{ marginTop: '6px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleCopySql} style={{ width: '100%', justifyContent: 'center' }}>
                  {copiedSql ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                  <span>{copiedSql ? t('settings.copiedSql') : t('settings.copySql')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* PIN Passcode Security */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#fbbf24" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                  {t('settings.pinTitle')}
                </h3>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={e => setPinEnabledInput(e.target.checked)}
                />
                <span>{t('settings.pinToggle')}</span>
              </label>
            </div>

            {pinEnabled && (
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('settings.newPinLabel')}
                </label>
                <input
                  type="password"
                  maxLength={8}
                  placeholder={t('settings.newPinPlaceholder')}
                  value={pinCode}
                  onChange={e => setPinCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                  style={{
                    width: '180px',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fbbf24',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    letterSpacing: '0.2em',
                    textAlign: 'center'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {t('settings.pinNote')}
                </p>
              </div>
            )}
          </div>

          {/* Serverless Gemini AI API Proxy Status Badge */}
          <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Key size={18} color="#60a5fa" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#60a5fa' }}>
                {t('settings.proxyTitle')}
              </h3>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {t('settings.proxyBody')} (<code style={{ color: '#34d399' }}>GEMINI_API_KEY</code>)
            </p>
          </div>

          {/* Reset to Default */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm(t('settings.resetConfirm'))) {
                  onResetData();
                  onClose();
                }
              }}
            >
              <RefreshCw size={14} />
              <span>{t('settings.resetBtn')}</span>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} />
            <span>{t('settings.saveBtn')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
