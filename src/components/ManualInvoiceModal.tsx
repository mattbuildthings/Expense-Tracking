import React, { useState } from 'react';
import { X, Plus, FilePlus, DollarSign, Calendar, Tag, Store, CreditCard, Layers } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, ExpenseCategory, PaymentMethod, VerificationStatus } from '../types/expense';

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ExpenseItem) => void;
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

export const ManualInvoiceModal: React.FC<ManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingVendors = [],
  existingSubCategories = []
}) => {
  if (!isOpen) return null;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amountStr, setAmountStr] = useState('');
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [unit, setUnit] = useState('');
  const [unitCostStr, setUnitCostStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('phần_thô_vật_tư');
  const [subCategory, setSubCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('chuyển_khoản');
  const [status, setStatus] = useState<VerificationStatus>('cần_kiểm_tra'); // Default to unverified

  // P0 FIX: Amount is the authoritative anchor!
  const handleQuantityChange = (newQty: number | undefined) => {
    setQuantity(newQty);
    const amt = parseFormattedNumber(amountStr);
    if (amt > 0 && newQty && newQty > 0) {
      const calcUnitCost = Math.round(amt / newQty);
      setUnitCostStr(formatFormattedNumber(calcUnitCost));
    }
  };

  const handleUnitCostChange = (newUnitCostVal: string) => {
    setUnitCostStr(newUnitCostVal);
    const uCost = parseFormattedNumber(newUnitCostVal);
    const amt = parseFormattedNumber(amountStr);
    if (amt > 0 && uCost > 0) {
      const calcQty = Math.round((amt / uCost) * 100) / 100;
      setQuantity(calcQty);
    }
  };

  const handleAmountChange = (newAmtVal: string) => {
    setAmountStr(newAmtVal);
    const amt = parseFormattedNumber(newAmtVal);
    if (amt > 0 && quantity && quantity > 0) {
      const calcUnitCost = Math.round(amt / quantity);
      setUnitCostStr(formatFormattedNumber(calcUnitCost));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFormattedNumber(amountStr);
    const finalUnitCost = parseFormattedNumber(unitCostStr);

    if (finalAmount <= 0) return;

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      date,
      amount: finalAmount,
      quantity,
      unit: unit.trim() || undefined,
      unitCost: finalUnitCost || undefined,
      category,
      subCategory: subCategory.trim() || undefined,
      merchant: merchant.trim() || 'Nhà cung cấp',
      note: note.trim() || 'Thêm thủ công',
      paymentMethod,
      status,
      confidenceScore: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', borderRadius: '24px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#60a5fa' }}>
              <FilePlus size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Tạo Hóa Đơn Thủ Công
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Thêm giao dịch khi không có ảnh hóa đơn đính kèm
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Total Paid Amount */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <DollarSign size={14} />
              <span>SỐ TIỀN THANH TOÁN (VND) — THỰC CHI *</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: 18,500,000"
              value={amountStr}
              onChange={e => handleAmountChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--bg-input)',
                border: '2px solid rgba(52, 211, 153, 0.4)',
                borderRadius: '12px',
                color: '#34d399',
                fontSize: '1.25rem',
                fontWeight: 800,
                outline: 'none'
              }}
            />
          </div>

          {/* Quantity & Unit Cost Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', display: 'block', marginBottom: '4px' }}>
                # Số Lượng & Đơn Vị
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="number"
                  placeholder="VD: 50"
                  value={quantity !== undefined ? quantity : ''}
                  onChange={e => handleQuantityChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  style={{ width: '60%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.88rem', fontWeight: 700 }}
                />
                <input
                  type="text"
                  placeholder="cây, m3..."
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  style={{ width: '40%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', display: 'block', marginBottom: '4px' }}>
                💰 Đơn Giá (Unit Cost)
              </label>
              <input
                type="text"
                placeholder="VD: 370,000"
                value={unitCostStr}
                onChange={e => handleUnitCostChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fbbf24', fontSize: '0.88rem', fontWeight: 700 }}
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Danh Mục Công Trình Chuẩn *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ExpenseCategory)}
              style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', color: '#f8fafc', fontSize: '0.88rem', fontWeight: 700 }}
            >
              {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => (
                <option key={catKey} value={catKey}>
                  {meta.label} ({meta.englishLabel})
                </option>
              ))}
            </select>
          </div>

          {/* SubCategory */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              <Tag size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Chi Tiết Phụ (Tên Vật Tư / Công Việc)
            </label>
            <input
              type="text"
              placeholder="VD: Sắt thép Phi 16, Sơn Dulux..."
              value={subCategory}
              list="subcategory-suggestions-manual"
              onChange={e => setSubCategory(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700 }}
            />
            <datalist id="subcategory-suggestions-manual">
              {existingSubCategories.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {/* Date & Merchant */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Ngày Giao Dịch *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                <Store size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Đơn Vị / Thợ Nhận *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Đại lý sắt thép, Tổ thợ anh Hùng..."
                value={merchant}
                list="vendor-suggestions-manual"
                onChange={e => setMerchant(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700 }}
              />
              <datalist id="vendor-suggestions-manual">
                {existingVendors.map(v => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Payment Method & Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                <CreditCard size={14} style={{ display: 'inline', marginRight: '4px' }} />
                Hình Thức Thanh Toán
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
              >
                <option value="chuyển_khoản">🏦 Chuyển khoản</option>
                <option value="tiền_mặt">💵 Tiền mặt</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                Trạng Thái Ban Đầu
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as VerificationStatus)}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: status === 'đã_xác_minh' ? '#34d399' : '#fbbf24', fontSize: '0.85rem', fontWeight: 800 }}
              >
                <option value="cần_kiểm_tra">🟡 Cần kiểm tra lại</option>
                <option value="đã_xác_minh">🟢 Đã xác minh</option>
              </select>
            </div>
          </div>

          {/* Detail Note */}
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
              Ghi Chú Chi Tiết
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm về nội dung thanh toán..."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={18} />
              <span>Tạo Hóa Đơn</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
