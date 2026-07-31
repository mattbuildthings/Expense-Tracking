import React, { useState } from 'react';
import { X, History, Trash2, RotateCcw, ShieldCheck, Clock, Trash } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, AuditLogEntry } from '../types/expense';
import { formatVND } from '../services/storageService';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedExpenses: ExpenseItem[];
  auditLogs: AuditLogEntry[];
  onRestoreExpense: (id: string) => void;
  onPermanentDeleteExpense: (id: string) => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  deletedExpenses,
  auditLogs,
  onRestoreExpense,
  onPermanentDeleteExpense
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'recycle_bin' | 'audit_trail'>('recycle_bin');

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', borderRadius: '24px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#818cf8' }}>
              <History size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Lịch Sử Thao Tác & Thùng Rác Hóa Đơn
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Truy xuất lịch sử thêm/sửa/xóa và khôi phục các chi phí đã bị xóa
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('recycle_bin')}
            className={`btn btn-sm ${activeTab === 'recycle_bin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <Trash2 size={16} />
            <span>Thùng Rác Hóa Đơn ({deletedExpenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_trail')}
            className={`btn btn-sm ${activeTab === 'audit_trail' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px' }}
          >
            <Clock size={16} />
            <span>Nhật Ký Thao Tác ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab Content 1: Recycle Bin */}
        {activeTab === 'recycle_bin' && (
          <div>
            {deletedExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-dim)' }}>
                <ShieldCheck size={48} color="#34d399" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>Thùng rác trống!</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Không có hóa đơn nào bị xóa gần đây. Tất cả dữ liệu chi phí của bạn đều an toàn.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Các mục dưới đây đã bị xóa khỏi sổ chính. Bạn có thể khôi phục 1-click hoặc xóa vĩnh viễn:
                </p>
                {deletedExpenses.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="Hóa đơn" style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                      ) : (
                        <div style={{ width: '42px', height: '42px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          No Img
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#f87171', fontSize: '1rem' }}>{formatVND(item.amount)}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {item.date}</span>
                          <span className="badge" style={{ background: CATEGORY_METADATA[item.category]?.bg, color: CATEGORY_METADATA[item.category]?.color, fontSize: '0.72rem' }}>
                            {CATEGORY_METADATA[item.category]?.label}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                          {item.merchant} ({item.subCategory || 'Vật tư'})
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Ghi chú: {item.note}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => onRestoreExpense(item.id)}
                        style={{ padding: '6px 12px' }}
                      >
                        <RotateCcw size={14} />
                        <span>Khôi Phục</span>
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN chi phí này không?\n\n(Hành động này sẽ xóa dữ liệu hoàn toàn khỏi máy tính & đám mây)')) {
                            onPermanentDeleteExpense(item.id);
                          }
                        }}
                        style={{ padding: '6px 12px' }}
                        title="Xóa hoàn toàn khỏi cơ sở dữ liệu"
                      >
                        <Trash size={14} />
                        <span>Xóa Vĩnh Viễn</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Audit Trail Log */}
        {activeTab === 'audit_trail' && (
          <div>
            {auditLogs.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', padding: '40px' }}>
                Chưa có nhật ký thao tác nào được ghi nhận.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {auditLogs.map(log => {
                  let badgeBg = 'rgba(59, 130, 246, 0.2)';
                  let badgeColor = '#60a5fa';
                  if (log.action === 'CREATE') {
                    badgeBg = 'rgba(16, 185, 129, 0.2)';
                    badgeColor = '#34d399';
                  } else if (log.action === 'DELETE') {
                    badgeBg = 'rgba(239, 68, 68, 0.2)';
                    badgeColor = '#f87171';
                  } else if (log.action === 'RESTORE') {
                    badgeBg = 'rgba(245, 158, 11, 0.2)';
                    badgeColor = '#fbbf24';
                  }

                  return (
                    <div
                      key={log.id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge" style={{ background: badgeBg, color: badgeColor, fontSize: '0.72rem', fontWeight: 800 }}>
                            {log.action}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                            {log.description}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                          ID Hóa đơn: {log.expenseId} • Thời gian: {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
