import React, { useState } from 'react';
import { Target, Save, AlertCircle, ChevronDown, ChevronUp, Check, Edit2, FileSpreadsheet, FileText, Trash2, Plus } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, ExpenseCategory, CategoryBudgets, VendorQuotation } from '../types/expense';
import { formatVND, getCategoryBudgets, saveCategoryBudgets, generateMultiPeriodReport, exportBvaToExcel, getVendorQuotations, deleteVendorQuotation } from '../services/storageService';
import { categoryAccent } from '../theme';

interface BudgetViewProps {
  projectName: string;
  allExpenses: ExpenseItem[];
  onSelectExpense: (item: ExpenseItem) => void;
  onExportExcel?: () => void;
  onOpenQuotationModal?: () => void;
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

export const BudgetView: React.FC<BudgetViewProps> = ({
  projectName,
  allExpenses,
  onSelectExpense,
  onExportExcel,
  onOpenQuotationModal
}) => {
  const [budgets, setBudgets] = useState<CategoryBudgets>(getCategoryBudgets());
  const [quotations, setQuotations] = useState<VendorQuotation[]>(getVendorQuotations());
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleDeleteQuote = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa báo giá/hợp đồng này?')) {
      deleteVendorQuotation(id);
      setQuotations(getVendorQuotations());
    }
  };

  const report = generateMultiPeriodReport(allExpenses, 'all');

  const handleBudgetChange = (catKey: ExpenseCategory, valStr: string) => {
    const parsed = parseFormattedNumber(valStr);
    setBudgets(prev => ({
      ...prev,
      [catKey]: parsed
    }));
  };

  const handleSaveBudgets = () => {
    saveCategoryBudgets(budgets);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const toggleCategory = (catKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  const totalTargetBudget = Object.values(budgets).reduce((sum, b) => sum + (b || 0), 0);
  const totalActualSpent = report.totalAmount;
  const totalRemaining = totalTargetBudget - totalActualSpent;
  const totalPercentageUsed = totalTargetBudget > 0 ? Math.round((totalActualSpent / totalTargetBudget) * 100) : 0;

  const overBudgetCategories = report.categoryBreakdown.filter(c => {
    const target = budgets[c.category] || 0;
    return target > 0 && c.totalAmount > target;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Top Header Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', padding: '6px 12px', fontSize: '0.75rem' }}>
                <Target size={14} /> BVA Cost Control
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Dự án {projectName}
              </span>
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '10px' }}>
              Dự Toán Ngân Sách Hạng Mục (Budget vs. Actual)
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Quản lý hạn mức ngân sách dự toán, theo dõi chênh lệch & kiểm soát vượt trần chi phí 9 hạng mục
            </p>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onExportExcel ? onExportExcel() : exportBvaToExcel(allExpenses, projectName)}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
              title="Xuất báo cáo dự toán BVA 9 hạng mục"
            >
              <FileSpreadsheet size={18} />
              <span>Xuất Báo Cáo Dự Toán (BVA)</span>
            </button>

            {isEditing ? (
              <button className="btn btn-primary" onClick={handleSaveBudgets}>
                <Save size={18} />
                <span>Lưu Hạn Mức Mới</span>
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                <Edit2 size={18} color="var(--chart-blue)" />
                <span>Chỉnh Sửa Dự Toán</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Toast Alert */}
      {savedSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--success)', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontWeight: 700, textAlign: 'center' }}>
          <Check size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          Đã cập nhật hạn mức dự toán ngân sách thành công!
        </div>
      )}

      {/* OVERRUN ALERT CARD */}
      {overBudgetCategories.length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertCircle size={24} color="var(--danger)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--danger)' }}>
              Cảnh Báo: Có {overBudgetCategories.length} Hạng Mục Chi Vượt Ngân Sách Dự Toán!
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overBudgetCategories.map(c => {
              const target = budgets[c.category] || 0;
              const overrun = c.totalAmount - target;
              return (
                <div key={c.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {c.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)' }}>
                    Thực chi: {formatVND(c.totalAmount)} / Dự toán: {formatVND(target)} (Vượt {formatVND(overrun)})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overview Financial KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--chart-blue)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Ngân Sách Dự Toán</p>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--chart-blue)', marginTop: '6px' }}>
            {formatVND(totalTargetBudget)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tất cả 9 hạng mục công trình</p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Thực Chi Đến Nay</p>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)', marginTop: '6px' }}>
            {formatVND(totalActualSpent)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Đã dùng {totalPercentageUsed}% tổng dự toán</p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${totalRemaining < 0 ? 'var(--danger)' : 'var(--success)'}` }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ngân Sách Còn Lại</p>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: totalRemaining < 0 ? 'var(--danger)' : 'var(--success)', marginTop: '6px' }}>
            {formatVND(totalRemaining)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: totalRemaining < 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            {totalRemaining < 0 ? <><AlertCircle size={12} /> Vượt Tổng Dự Toán</> : <><Check size={12} /> Ngân Sách An Toàn</>}
          </p>
        </div>
      </div>

      {/* 9 Category Budget vs. Actual Cards List */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Chi Tiết Hạn Mức & Biến Động Ngân Sách 9 Hạng Mục
          </h3>
          {isEditing && (
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Edit2 size={13} /> Bạn đang ở chế độ chỉnh sửa hạn mức dự toán
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => {
            const key = catKey as ExpenseCategory;
            const catQuotes = quotations.filter(q => q.category === key);
            const signedQuotesTotal = catQuotes.filter(q => q.status === 'signed').reduce((sum, q) => sum + q.amount, 0);
            
            // Quotation-driven target budget if signed quotes exist, otherwise user flat budget
            const targetB = signedQuotesTotal > 0 ? signedQuotesTotal : (budgets[key] || 0);
            const catSummary = report.categoryBreakdown.find(c => c.category === key) || { totalAmount: 0, count: 0 };
            const actual = catSummary.totalAmount;
            const remaining = targetB - actual;
            const pctUsed = targetB > 0 ? Math.round((actual / targetB) * 100) : 0;
            const isOver = targetB > 0 && actual > targetB;
            const isExpanded = Boolean(expandedCategories[key]);
            const categoryTransactions = allExpenses.filter(i => i.category === key);

            let barColor = 'var(--success)'; // Green < 85%
            if (pctUsed >= 85 && pctUsed <= 100) barColor = 'var(--accent-amber)'; // Amber
            if (isOver) barColor = 'var(--danger)'; // Red, over budget
            const accent = categoryAccent(key);

            return (
              <div
                key={key}
                style={{
                  background: 'var(--bg-input)',
                  border: `1px solid ${isOver ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-color)'}`,
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}
              >
                <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>

                  {/* Category Title & Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px', flex: 1 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{meta.label}</span>
                        {catQuotes.length > 0 && (
                          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '0.72rem', fontWeight: 700 }}>
                            <FileText size={11} /> {catQuotes.length} Hợp đồng ({formatVND(signedQuotesTotal)})
                          </span>
                        )}
                        {isOver && (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 800 }}>
                            Vượt {formatVND(actual - targetB)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {meta.englishLabel} • {catSummary.count} hóa đơn
                      </p>
                    </div>
                  </div>

                  {/* Budget Input & Spent Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>

                    {/* Target Budget Input / Display */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        {signedQuotesTotal > 0 ? 'Dự Toán (Theo HĐ)' : 'Hạn Mức Dự Toán'}
                      </p>
                      {isEditing && signedQuotesTotal === 0 ? (
                        <input
                          type="text"
                          value={formatFormattedNumber(targetB)}
                          onChange={e => handleBudgetChange(key, e.target.value)}
                          style={{
                            width: '150px',
                            padding: '6px 10px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--chart-blue)',
                            borderRadius: '8px',
                            color: 'var(--chart-blue)',
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            textAlign: 'right'
                          }}
                        />
                      ) : (
                        <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--chart-blue)' }}>
                          {formatVND(targetB)}
                        </p>
                      )}
                    </div>

                    {/* Actual Spent */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Thực Chi</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {formatVND(actual)}
                      </p>
                    </div>

                    {/* Remaining */}
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Còn Lại</p>
                      <p style={{ fontSize: '0.95rem', fontWeight: 800, color: remaining < 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {formatVND(remaining)}
                      </p>
                    </div>

                    {/* Expand Transactions Button */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleCategory(key)}
                      style={{ padding: '8px', borderRadius: '8px' }}
                      title="Xem chi tiết hợp đồng & hóa đơn"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                  </div>
                </div>

                {/* Progress bar line */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(127, 127, 127, 0.15)' }}>
                  <div style={{ width: `${Math.min(100, pctUsed)}%`, height: '100%', background: barColor, transition: 'width 0.4s ease' }} />
                </div>

                {/* Expanded Details Dropdown */}
                {isExpanded && (
                  <div style={{ padding: '20px 22px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card-alt)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Section A: Quotations Breakdown Table */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={16} /> Danh Sách Báo Giá & Hợp Đồng Thành Phần ({catQuotes.length})
                        </h4>
                        {onOpenQuotationModal && (
                          <button className="btn btn-secondary btn-sm" onClick={onOpenQuotationModal} style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                            <Plus size={14} /> Thêm Báo Giá Hạng Mục Này
                          </button>
                        )}
                      </div>

                      {catQuotes.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'var(--bg-card-alt)', padding: '12px', borderRadius: '8px' }}>
                          Chưa có báo giá/hợp đồng nào được nhập cho hạng mục này. Hạn mức đang tính theo số tiền thủ công.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {catQuotes.map(q => {
                            const vendorExpenses = categoryTransactions.filter(i => (i.merchant || '').trim().toLowerCase() === q.vendorName.trim().toLowerCase());
                            const paidAmount = vendorExpenses.reduce((sum, i) => sum + i.amount, 0);
                            const qRemaining = q.amount - paidAmount;
                            return (
                              <div
                                key={q.id}
                                style={{
                                  background: 'var(--bg-card)',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  borderRadius: '12px',
                                  padding: '12px 16px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: '12px'
                                }}
                              >
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>{q.vendorName}</span>
                                    <span className="badge" style={{ background: q.status === 'signed' ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card-alt)', color: q.status === 'signed' ? 'var(--success)' : 'var(--text-dim)', border: q.status === 'signed' ? 'none' : '1px solid var(--border-strong)', fontSize: '0.75rem' }}>
                                      {q.status === 'signed' ? 'Hợp Đồng Đã Ký' : 'Báo Giá Dự Thảo'}
                                    </span>
                                    {q.subCategory && (
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {q.subCategory}</span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, marginTop: '2px' }}>
                                    {q.title} {q.note ? `— ${q.note}` : ''}
                                  </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                  <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>GIÁ TRỊ BÁO GIÁ</p>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 800, color: '#818cf8' }}>{formatVND(q.amount)}</p>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ĐÃ CHI THANH TOÁN</p>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>{formatVND(paidAmount)}</p>
                                  </div>
                                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>CÒN LẠI THUỘC HĐ</p>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 800, color: qRemaining < 0 ? 'var(--danger)' : 'var(--success)' }}>
                                      {formatVND(qRemaining)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteQuote(q.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '6px', color: 'var(--danger)' }}
                                    title="Xóa báo giá này"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Section B: Logged Receipts List */}
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '10px' }}>
                        Danh Sách Hóa Đơn Đã Ghi Nhận ({categoryTransactions.length})
                      </h4>
                      {categoryTransactions.length === 0 ? (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          Chưa có hóa đơn nào thuộc hạng mục này.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {categoryTransactions.map(item => (
                            <div
                              key={item.id}
                              onClick={() => onSelectExpense(item)}
                              style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer'
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>{formatVND(item.amount)}</span>
                                  {item.quantity && (
                                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-card-alt)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)' }}>
                                      SL: {item.quantity} {item.unit || ''}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {item.date}</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                                  {item.merchant} {item.subCategory ? `(↳ ${item.subCategory})` : ''}
                                </p>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--chart-blue)', fontWeight: 700 }}>
                                Xem chi tiết ➔
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
