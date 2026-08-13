import React from 'react';
import { HardHat, PlusCircle, Calendar, Settings, CheckCircle2, AlertCircle, Lock, History, FilePlus, Target, Users, Wallet, FileText, ClipboardList, Sun, Moon } from 'lucide-react';
import { formatVND } from '../services/storageService';

type ViewKey = 'ledger' | 'saturday_report' | 'bva_budget' | 'vendors' | 'cash_flow';

interface NavbarProps {
  projectName: string;
  totalSpent: number;
  pendingCount: number;
  activeView: ViewKey;
  setActiveView: (view: ViewKey) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenUpload: () => void;
  onOpenManualCreate: () => void;
  onOpenQuotationModal: () => void;
  onOpenSettings: () => void;
  onOpenAuditLog: () => void;
  onLockApp: () => void;
}

// Per-tab accent color (matches the design spec's per-view accent scheme)
const TAB_ACCENTS: Record<ViewKey, string> = {
  ledger: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  saturday_report: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  bva_budget: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  vendors: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  cash_flow: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)'
};

const TAB_ACCENT_SOLID: Record<ViewKey, string> = {
  ledger: '#3b82f6',
  saturday_report: '#10b981',
  bva_budget: '#6366f1',
  vendors: '#14b8a6',
  cash_flow: '#818cf8'
};

interface TabDef {
  key: ViewKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { key: 'ledger', label: 'Sổ Ghi Chép Chi Phí (Ledger)', shortLabel: 'Sổ Chi', icon: ClipboardList },
  { key: 'saturday_report', label: 'Báo Cáo', shortLabel: 'Báo Cáo', icon: Calendar },
  { key: 'bva_budget', label: 'Dự Toán Ngân Sách (BVA)', shortLabel: 'BVA', icon: Target },
  { key: 'vendors', label: 'Nhà Cung Cấp & Tổ Thợ', shortLabel: 'Nhà CC', icon: Users },
  { key: 'cash_flow', label: 'Dòng Tiền & Quỹ', shortLabel: 'Dòng Tiền', icon: Wallet }
];

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  totalSpent,
  pendingCount,
  activeView,
  setActiveView,
  theme,
  onToggleTheme,
  onOpenUpload,
  onOpenManualCreate,
  onOpenQuotationModal,
  onOpenSettings,
  onOpenAuditLog,
  onLockApp
}) => {
  return (
    <>
      <header className="glass-panel no-print" style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100, background: 'var(--header-bg)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '16px 24px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

            {/* Logo & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                flexShrink: 0
              }}>
                <HardHat size={26} color="#ffffff" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {projectName}
                  </h1>
                  <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                    AI Vision 1.5
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Hệ thống tự động đọc hóa đơn Zalo
                </p>
              </div>
            </div>

            {/* Quick Metrics Bar + Theme Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-card-alt)', padding: '8px 18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Tổng Chi Phí</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>{formatVND(totalSpent)}</p>
                </div>
                <div style={{ width: '1px', height: '28px', background: 'var(--border-color)' }} />
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>Cần Xác Minh</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: pendingCount > 0 ? 'var(--warning)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {pendingCount > 0 ? <AlertCircle size={16} color="var(--warning)" /> : <CheckCircle2 size={16} color="var(--success)" />}
                    {pendingCount} mục
                  </p>
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
                aria-label="Đổi giao diện sáng / tối"
                style={{ padding: '9px' }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
            <button className="btn btn-primary" onClick={onOpenUpload}>
              <PlusCircle size={18} />
              <span>Thêm Ảnh / Hóa Đơn</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenManualCreate} title="Tạo hóa đơn thủ công khi không có ảnh đính kèm">
              <FilePlus size={18} color="var(--primary)" />
              <span>Tạo Hóa Đơn</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenQuotationModal} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }} title="Nhập báo giá hoặc hợp đồng chi tiết với nhà cung cấp">
              <FileText size={18} color="#818cf8" />
              <span>Nhập Báo Giá / HĐ</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenAuditLog} title="Lịch sử giao dịch & Thùng rác khôi phục">
              <History size={18} color="var(--primary)" />
              <span>Lịch Sử & Thùng Rác</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenSettings} title="Cài đặt chìa khóa AI Gemini & Tên công trình">
              <Settings size={18} />
              <span>Cài Đặt</span>
            </button>

            <button className="btn btn-secondary" onClick={onLockApp} title="Khóa ứng dụng ngay lập tức">
              <Lock size={16} color="var(--warning)" />
            </button>
          </div>

          {/* Desktop View Switching Tabs */}
          <nav className="desktop-only-nav" style={{ alignItems: 'center', gap: '10px', marginTop: '18px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap' }}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeView === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: active ? TAB_ACCENTS[tab.key] : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {tab.key === 'saturday_report' && pendingCount > 0 && (
                    <span style={{ background: 'var(--warning)', color: '#000', fontSize: '0.7rem', fontWeight: 900, padding: '2px 6px', borderRadius: '10px' }}>
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="mobile-only-nav no-print"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          zIndex: 60,
          background: 'var(--header-bg)',
          borderTop: '1px solid var(--border-color)',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)'
        }}
      >
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: active ? TAB_ACCENT_SOLID[tab.key] : 'var(--text-dim)',
                position: 'relative'
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: '0.62rem', fontWeight: 700 }}>{tab.shortLabel}</span>
              {tab.key === 'saturday_report' && pendingCount > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '22%', background: 'var(--warning)', color: '#000', fontSize: '0.6rem', fontWeight: 900, padding: '1px 4px', borderRadius: '8px' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
