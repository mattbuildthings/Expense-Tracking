import React from 'react';
import { HardHat, PlusCircle, Calendar, Settings, FileSpreadsheet, CheckCircle2, AlertCircle, Lock, History, FilePlus, Target, Users, Wallet } from 'lucide-react';
import { formatVND } from '../services/storageService';

interface NavbarProps {
  projectName: string;
  totalSpent: number;
  pendingCount: number;
  activeView: 'ledger' | 'saturday_report' | 'bva_budget' | 'vendors' | 'cash_flow';
  setActiveView: (view: 'ledger' | 'saturday_report' | 'bva_budget' | 'vendors' | 'cash_flow') => void;
  onOpenUpload: () => void;
  onOpenManualCreate: () => void;
  onOpenSettings: () => void;
  onOpenAuditLog: () => void;
  onOpenExport: () => void;
  onLockApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projectName,
  totalSpent,
  pendingCount,
  activeView,
  setActiveView,
  onOpenUpload,
  onOpenManualCreate,
  onOpenSettings,
  onOpenAuditLog,
  onOpenExport,
  onLockApp
}) => {
  return (
    <header className="glass-panel no-print" style={{ borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, zIndex: 100 }}>
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
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)'
            }}>
              <HardHat size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {projectName}
                </h1>
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  AI Vision 1.5
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Hệ thống tự động đọc hóa đơn Zalo
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255, 255, 255, 0.04)', padding: '8px 18px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Tổng Chi Phí</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{formatVND(totalSpent)}</p>
            </div>
            <div style={{ width: '1px', height: '28px', background: 'var(--border-color)' }} />
            <div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Cần Xác Minh</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: pendingCount > 0 ? '#fbbf24' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {pendingCount > 0 ? <AlertCircle size={16} color="#fbbf24" /> : <CheckCircle2 size={16} color="#34d399" />}
                {pendingCount} mục
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onOpenUpload}>
              <PlusCircle size={18} />
              <span>+ Thêm Ảnh / Hóa Đơn</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenManualCreate} title="Tạo hóa đơn thủ công khi không có ảnh đính kèm">
              <FilePlus size={18} color="#60a5fa" />
              <span>Tạo Hóa Đơn</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenExport} title="Xuất dữ liệu ra Google Sheets hoặc Excel">
              <FileSpreadsheet size={18} color="#34d399" />
              <span>Xuất Sheets / Excel</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenAuditLog} title="Lịch sử giao dịch & Thùng rác khôi phục">
              <History size={18} color="#60a5fa" />
              <span>Lịch Sử & Thùng Rác</span>
            </button>

            <button className="btn btn-secondary" onClick={onOpenSettings} title="Cài đặt chìa khóa AI Gemini & Tên công trình">
              <Settings size={18} />
              <span>Cài Đặt</span>
            </button>

            <button className="btn btn-secondary" onClick={onLockApp} title="Khóa ứng dụng ngay lập tức">
              <Lock size={16} color="#fbbf24" />
            </button>
          </div>

        </div>

        {/* View Switching Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveView('ledger')}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
              background: activeView === 'ledger' ? 'var(--primary)' : 'transparent',
              color: activeView === 'ledger' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            📋 Sổ Ghi Chép Chi Phí (Ledger)
          </button>

          <button
            onClick={() => setActiveView('saturday_report')}
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
              background: activeView === 'saturday_report' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: activeView === 'saturday_report' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Calendar size={18} />
            <span>📊 Báo Cáo</span>
            {pendingCount > 0 && (
              <span style={{ background: '#fbbf24', color: '#000', fontSize: '0.7rem', fontWeight: 900, padding: '2px 6px', borderRadius: '10px' }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('bva_budget')}
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
              background: activeView === 'bva_budget' ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: activeView === 'bva_budget' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Target size={18} />
            <span>🎯 Dự Toán Ngân Sách (BVA)</span>
          </button>

          <button
            onClick={() => setActiveView('vendors')}
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
              background: activeView === 'vendors' ? 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' : 'transparent',
              color: activeView === 'vendors' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Users size={18} />
            <span>👷 Nhà Cung Cấp & Tổ Thợ</span>
          </button>

          <button
            onClick={() => setActiveView('cash_flow')}
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
              background: activeView === 'cash_flow' ? 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)' : 'transparent',
              color: activeView === 'cash_flow' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            <Wallet size={18} />
            <span>💵 Dòng Tiền & Quỹ</span>
          </button>
        </div>

      </div>
    </header>
  );
};

