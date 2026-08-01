import React, { useState } from 'react';
import { X, FileText, Store, Layers, DollarSign, Calendar, Tag } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseCategory, VendorQuotation, QuotationStatus } from '../types/expense';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quote: Omit<VendorQuotation, 'id' | 'createdAt'>) => void;
  existingVendors?: string[];
  existingSubCategories?: string[];
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

export const QuotationModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingVendors = [],
  existingSubCategories = []
}) => {
  if (!isOpen) return null;

  const [vendorName, setVendorName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('phần_thô_vật_tư');
  const [subCategory, setSubCategory] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('signed');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFormattedNumber(amountStr);
    if (!vendorName.trim() || amt <= 0) return;

    onSave({
      vendorName: vendorName.trim(),
      title: title.trim() || `Báo giá ${vendorName.trim()}`,
      category,
      subCategory: subCategory.trim() || undefined,
      amount: amt,
      status,
      date,
      note: note.trim() || undefined
    });

    // Reset
    setVendorName('');
    setTitle('');
    setAmountStr('');
    setNote('');
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="glass-panel" style={{ maxWidth: '580px', width: '100%', borderRadius: '24px', padding: '28px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '12px', color: '#818cf8' }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                📜 Nhập Báo Giá / Hợp Đồng Nhà Cung Cấp
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tạo hạn mức dự toán chi tiết & liên kết số nợ với Nhà cung cấp
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Vendor Name & Quote Title */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                <Store size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Đơn Vị / Nhà Cung Cấp *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Sắt Thép Hồng Phát..."
                value={vendorName}
                list="vendor-quote-suggestions"
                onChange={e => setVendorName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#f8fafc', fontSize: '0.88rem', fontWeight: 700 }}
              />
              <datalist id="vendor-quote-suggestions">
                {existingVendors.map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                Tên Báo Giá / Hợp Đồng
              </label>
              <input
                type="text"
                placeholder="VD: Báo giá thép sàn móng..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#60a5fa', fontSize: '0.88rem', fontWeight: 700 }}
              />
            </div>
          </div>

          {/* Category & Subcategory */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Hạng Mục Công Trình Chuẩn *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#f8fafc', fontSize: '0.88rem', fontWeight: 700 }}
              >
                {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => (
                  <option key={catKey} value={catKey}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Chi Tiết Phụ (Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="VD: Thép CB300, Gạch 80x80..."
                value={subCategory}
                list="subcat-quote-suggestions"
                onChange={e => setSubCategory(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#f8fafc', fontSize: '0.88rem' }}
              />
              <datalist id="subcat-quote-suggestions">
                {existingSubCategories.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Amount & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '4px' }}>
                <DollarSign size={14} style={{ display: 'inline', marginRight: '2px' }} />
                Giá Trị Báo Giá / Hợp Đồng (VND) *
              </label>
              <input
                type="text"
                required
                placeholder="VD: 320,000,000"
                value={amountStr}
                onChange={e => setAmountStr(formatFormattedNumber(e.target.value))}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#34d399', fontSize: '1.1rem', fontWeight: 800 }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                Trạng Thái Báo Giá
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as QuotationStatus)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: status === 'signed' ? '#34d399' : '#fbbf24', fontSize: '0.88rem', fontWeight: 800 }}
              >
                <option value="signed">🟢 Đã Ký Hợp Đồng</option>
                <option value="draft">🟡 Báo Giá Dự Thảo</option>
              </select>
            </div>
          </div>

          {/* Date & Note */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Ngày Báo Giá / Ký HĐ
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#f8fafc', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                Ghi Chú Điều Khoản
              </label>
              <input
                type="text"
                placeholder="VD: Bao gồm vận chuyển tận bãi..."
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#f8fafc', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}>
              Lưu Báo Giá
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
