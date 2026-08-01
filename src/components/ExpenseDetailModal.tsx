import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, DollarSign, Calendar, Tag, Store, CreditCard, Layers, ExternalLink } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, ExpenseCategory, PaymentMethod, VerificationStatus } from '../types/expense';
import { formatVND } from '../services/storageService';

interface ExpenseDetailModalProps {
  item: ExpenseItem | null;
  onClose: () => void;
  onSave: (updatedItem: ExpenseItem) => void;
  onDelete: (id: string) => void;
  existingVendors?: string[];
  existingSubCategories?: string[];
}

// Utility to format input with thousand separators (e.g. 18500000 -> "18,500,000")
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

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  item,
  onClose,
  onSave,
  onDelete,
  existingVendors = [],
  existingSubCategories = []
}) => {
  if (!item) return null;

  const [date, setDate] = useState(item.date);
  const [amountStr, setAmountStr] = useState(formatFormattedNumber(item.amount));
  const [quantity, setQuantity] = useState<number | undefined>(item.quantity);
  const [unit, setUnit] = useState(item.unit || '');
  const [unitCostStr, setUnitCostStr] = useState(formatFormattedNumber(item.unitCost));
  const [category, setCategory] = useState<ExpenseCategory>(item.category);
  const [subCategory, setSubCategory] = useState(item.subCategory || '');
  const [merchant, setMerchant] = useState(item.merchant);
  const [note, setNote] = useState(item.note);
  const [manDays, setManDays] = useState<number | undefined>(item.manDays);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(item.paymentMethod);
  const [status, setStatus] = useState<VerificationStatus>(item.status);

  useEffect(() => {
    if (item) {
      setDate(item.date);
      setAmountStr(formatFormattedNumber(item.amount));
      setQuantity(item.quantity);
      setUnit(item.unit || '');
      setUnitCostStr(formatFormattedNumber(item.unitCost || (item.quantity && item.amount ? Math.round(item.amount / item.quantity) : undefined)));
      setCategory(item.category);
      setSubCategory(item.subCategory || '');
      setMerchant(item.merchant);
      setNote(item.note);
      setManDays(item.manDays);
      setPaymentMethod(item.paymentMethod);
      setStatus(item.status);
    }
  }, [item]);

  // P0 FIX: Amount is the authoritative anchor! Editing quantity updates unitCost, NEVER amount!
  const handleQuantityChange = (newQty: number | undefined) => {
    setQuantity(newQty);
    const amt = parseFormattedNumber(amountStr);
    if (amt > 0 && newQty && newQty > 0) {
      const calcUnitCost = Math.round(amt / newQty);
      setUnitCostStr(formatFormattedNumber(calcUnitCost));
    }
  };

  // Editing unitCost updates quantity or indicates calculation without destroying amount
  const handleUnitCostChange = (newUnitCostVal: string) => {
    setUnitCostStr(newUnitCostVal);
    const uCost = parseFormattedNumber(newUnitCostVal);
    const amt = parseFormattedNumber(amountStr);
    if (amt > 0 && uCost > 0) {
      const calcQty = Math.round((amt / uCost) * 100) / 100;
      setQuantity(calcQty);
    }
  };

  // Editing total amount updates unitCost if quantity is set
  const handleAmountChange = (newAmtVal: string) => {
    setAmountStr(newAmtVal);
    const amt = parseFormattedNumber(newAmtVal);
    if (amt > 0 && quantity && quantity > 0) {
      const calcUnitCost = Math.round(amt / quantity);
      setUnitCostStr(formatFormattedNumber(calcUnitCost));
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFormattedNumber(amountStr);
    const finalUnitCost = parseFormattedNumber(unitCostStr);

    onSave({
      ...item,
      date,
      amount: finalAmount,
      quantity,
      unit: unit.trim() || undefined,
      unitCost: finalUnitCost || undefined,
      category,
      subCategory: subCategory.trim() || undefined,
      merchant: merchant.trim(),
      note: note.trim(),
      manDays,
      paymentMethod,
      status,
      updatedAt: new Date().toISOString()
    });
  };

  const currentAmt = parseFormattedNumber(amountStr);
  const currentUCost = parseFormattedNumber(unitCostStr);
  const calculatedTotal = (quantity || 0) * (currentUCost || 0);
  const isVariance = currentAmt > 0 && quantity && currentUCost && Math.abs(calculatedTotal - currentAmt) > 100;

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '820px', borderRadius: '24px', padding: '28px', maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge" style={{ background: CATEGORY_METADATA[category]?.bg, color: CATEGORY_METADATA[category]?.color, fontSize: '0.85rem', padding: '6px 12px' }}>
              {CATEGORY_METADATA[category]?.label}
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              ID: {item.id}
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSaveSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Left Column: Image & AI Reasoning */}
            <div>
              {item.imageUrl ? (
                <div style={{ marginBottom: '16px' }}>
                  <img
                    src={item.imageUrl}
                    alt="Hóa đơn chi tiết"
                    style={{
                      width: '100%',
                      maxHeight: '340px',
                      objectFit: 'contain',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.3)'
                    }}
                  />
                  <div style={{ textAlign: 'right', marginTop: '6px' }}>
                    <a
                      href={item.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '0.78rem', color: '#60a5fa', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Xem ảnh phóng to</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-input)', borderRadius: '16px', border: '1px dashed var(--border-color)', marginBottom: '16px', color: 'var(--text-dim)' }}>
                  <p style={{ fontSize: '0.88rem' }}>Không có ảnh đính kèm (Hóa đơn thủ công)</p>
                </div>
              )}

              {/* AI Confidence & Reasoning */}
              {item.aiReasoning && (
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa' }}>🤖 ĐỘ TIN CẬY AI VISION</span>
                    <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>{item.confidenceScore}% Match</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                    {item.aiReasoning}
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Editable Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Total Paid Amount (Authoritative Anchor) */}
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <DollarSign size={14} />
                  <span>SỐ TIỀN THANH TOÁN (VND) — THỰC CHI</span>
                </label>
                <input
                  type="text"
                  required
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

              {/* Quantity & Unit Cost Calculation Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                {/* Quantity & Unit */}
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
                      placeholder="cây, m3, công..."
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      style={{ width: '40%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Unit Cost */}
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

              {/* Variance Indicator Notice */}
              {isVariance && (
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  ℹ️ LƯU Ý: Số tiền thực chi ({formatVND(currentAmt)}) khác tích SL × Đơn giá ({formatVND(calculatedTotal)}). Số tiền thực chi được giữ nguyên làm chuẩn.
                </div>
              )}

              {/* Category Dropdown */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  <Layers size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Danh Mục Công Trình Chuẩn
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
                  Chi Tiết Vật Tư / Công Việc Phụ
                </label>
                <input
                  type="text"
                  placeholder="VD: Sắt Phi 16, Sơn Dulux, Thợ tô..."
                  value={subCategory}
                  list="subcategory-suggestions-detail"
                  onChange={e => setSubCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: 700 }}
                />
                <datalist id="subcategory-suggestions-detail">
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
                    Ngày Giao Dịch
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
                    Đơn Vị / Thợ Nhận
                  </label>
                  <input
                    type="text"
                    required
                    value={merchant}
                    list="vendor-suggestions-detail"
                    onChange={e => setMerchant(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem', fontWeight: 700 }}
                  />
                  <datalist id="vendor-suggestions-detail">
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
                    Trạng Thái Kiểm Tra
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as VerificationStatus)}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: status === 'đã_xác_minh' ? '#34d399' : '#fbbf24', fontSize: '0.85rem', fontWeight: 800 }}
                  >
                    <option value="đã_xác_minh">🟢 Đã xác minh</option>
                    <option value="cần_kiểm_tra">🟡 Cần kiểm tra lại</option>
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
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

            </div>

          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm('Bạn có chắc chắn muốn xóa chi phí này không?\n\n(Lưu ý: Hóa đơn đã xóa có thể khôi phục từ Thùng Rác)')) {
                  onDelete(item.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={16} />
              <span>Xóa Hóa Đơn</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
