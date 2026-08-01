import React, { useState } from 'react';
import { Target, Save, AlertCircle, ChevronDown, ChevronUp, Check, Edit2, FileSpreadsheet } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, ExpenseCategory, CategoryBudgets } from '../types/expense';
import { formatVND, getCategoryBudgets, saveCategoryBudgets, generateMultiPeriodReport, exportBvaToExcel } from '../services/storageService';

interface BudgetViewProps {
  projectName: string;
  allExpenses: ExpenseItem[];
  onSelectExpense: (item: ExpenseItem) => void;
  onExportExcel?: () => void;
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
  onExportExcel
}) => {
  const [budgets, setBudgets] = useState<CategoryBudgets>(getCategoryBudgets());
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
              <span className="badge" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff', padding: '6px 12px', fontSize: '0.85rem' }}>
                <Target size={14} /> BVA Cost Control
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Dự án {projectName}
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
              🎯 Dự Toán Ngân Sách Hạng Mục (Budget vs. Actual)
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Quản lý hạn mức ngân sách dự toán, theo dõi chênh lệch & kiểm soát vượt trần chi phí 9 hạng mục
            </p>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => onExportExcel ? onExportExcel() : exportBvaToExcel(allExpenses, projectName)}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
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
                <Edit2 size={18} color="#60a5fa" />
                <span>Chỉnh Sửa Dự Toán</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Toast Alert */}
      {savedSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', fontWeight: 700, textAlign: 'center' }}>
          <Check size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
          Đã cập nhật hạn mức dự toán ngân sách thành công!
        </div>
      )}

      {/* OVERRUN ALERT CARD */}
      {overBudgetCategories.length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertCircle size={24} color="#f87171" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171' }}>
              🚨 CẢNH BÁO: Có {overBudgetCategories.length} Hạng Mục Chi Vượt Ngân Sách Dự Toán!
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overBudgetCategories.map(c => {
              const target = budgets[c.category] || 0;
              const overrun = c.totalAmount - target;
              return (
                <div key={c.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                    {c.label}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f87171' }}>
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
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #60a5fa' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Ngân Sách Dự Toán</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa', marginTop: '6px' }}>
            {formatVND(totalTargetBudget)}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Tất cả 9 hạng mục công trình</p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #38bdf8' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Thực Chi Đến Nay</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
            {formatVND(totalActualSpent)}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Đã dùng {totalPercentageUsed}% tổng dự toán</p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: `4px solid ${totalRemaining < 0 ? '#f87171' : '#10b981'}` }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ngân Sách Còn Lại</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: totalRemaining < 0 ? '#f87171' : '#34d399', marginTop: '6px' }}>
            {formatVND(totalRemaining)}
          </h3>
          <p style={{ fontSize: '0.78rem', color: totalRemaining < 0 ? '#f87171' : '#34d399', marginTop: '4px', fontWeight: 700 }}>
            {totalRemaining < 0 ? '⚠️ Vượt Tổng Dự Toán' : '🟢 Ngân Sách An Toàn'}
          </p>
        </div>
      </div>

      {/* 9 Category Budget vs. Actual Cards List */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
            📋 Chi Tiết Hạn Mức & Biến Động Ngân Sách 9 Hạng Mục
          </h3>
          {isEditing && (
            <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 700 }}>
              ✏️ Bạn đang ở chế độ chỉnh sửa hạn mức dự toán
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => {
            const key = catKey as ExpenseCategory;
            const targetB = budgets[key] || 0;
            const catSummary = report.categoryBreakdown.find(c => c.category === key) || { totalAmount: 0, count: 0 };
            const actual = catSummary.totalAmount;
            const remaining = targetB - actual;
            const pctUsed = targetB > 0 ? Math.round((actual / targetB) * 100) : 0;
            const isOver = targetB > 0 && actual > targetB;
            const isExpanded = Boolean(expandedCategories[key]);
            const categoryTransactions = allExpenses.filter(i => i.category === key);

            let barColor = '#34d399'; // Green < 85%
            if (pctUsed >= 85 && pctUsed <= 100) barColor = '#fbbf24'; // Yellow
            if (isOver) barColor = '#f87171'; // Red > 100%

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px', flex: 1 }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#f8fafc' }}>{meta.label}</span>
                        {isOver && (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.72rem', fontWeight: 800 }}>
                            ⚠️ Vượt {formatVND(actual - targetB)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {meta.englishLabel} • {catSummary.count} giao dịch
                      </p>
                    </div>
                  </div>

                  {/* Budget Input & Spent Stats */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    
                    {/* Target Budget Input / Display */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Hạn Mức Dự Toán</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formatFormattedNumber(targetB)}
                          onChange={e => handleBudgetChange(key, e.target.value)}
                          style={{
                            width: '150px',
                            padding: '6px 10px',
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid #60a5fa',
                            borderRadius: '8px',
                            color: '#60a5fa',
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            textAlign: 'right'
                          }}
                        />
                      ) : (
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa' }}>
                          {formatVND(targetB)}
                        </p>
                      )}
                    </div>

                    {/* Actual Spent */}
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Thực Chi</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                        {formatVND(actual)}
                      </p>
                    </div>

                    {/* Remaining */}
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Còn Lại</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: remaining < 0 ? '#f87171' : '#34d399' }}>
                        {formatVND(remaining)}
                      </p>
                    </div>

                    {/* Expand Transactions Button */}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => toggleCategory(key)}
                      style={{ padding: '8px', borderRadius: '8px' }}
                      title="Xem danh sách chi tiết"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                  </div>
                </div>

                {/* Progress bar line */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ width: `${Math.min(100, pctUsed)}%`, height: '100%', background: barColor, transition: 'width 0.4s ease' }} />
                </div>

                {/* Expanded Transactions List Dropdown */}
                {isExpanded && (
                  <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.18)' }}>
                    {categoryTransactions.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        Chưa có giao dịch nào thuộc hạng mục này.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categoryTransactions.map(item => (
                          <div
                            key={item.id}
                            onClick={() => onSelectExpense(item)}
                            style={{
                              background: 'var(--bg-panel)',
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
                                <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>{formatVND(item.amount)}</span>
                                {item.quantity && (
                                  <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', color: '#f8fafc' }}>
                                    SL: {item.quantity} {item.unit || ''}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {item.date}</span>
                              </div>
                              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                                {item.merchant} {item.subCategory ? `(↳ ${item.subCategory})` : ''}
                              </p>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700 }}>
                              Xem chi tiết ➔
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
