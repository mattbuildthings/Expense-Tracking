import React, { useState } from 'react';
import { Calendar, Printer, FileSpreadsheet, Sparkles, AlertTriangle, ChevronDown, ChevronUp, ExternalLink, Image as ImageIcon, Filter, AlertCircle, Target, HardHat } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, ExpenseCategory, ReportPeriod } from '../types/expense';
import { formatVND, generateMultiPeriodReport } from '../services/storageService';
import { categoryAccent } from '../theme';
import { useLanguage } from '../i18n/LanguageContext';

interface SaturdayReportViewProps {
  projectName: string;
  onSelectExpense: (item: ExpenseItem) => void;
  onExportExcel: () => void;
  allExpenses: ExpenseItem[];
}

export const SaturdayReportView: React.FC<SaturdayReportViewProps> = ({
  projectName,
  onSelectExpense,
  onExportExcel,
  allExpenses
}) => {
  const { t, language } = useLanguage();
  const catLabel = (meta: { label: string; englishLabel: string }) => (language === 'en' ? meta.englishLabel : meta.label);
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('all');
  
  const report = generateMultiPeriodReport(allExpenses, selectedPeriod);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    [report.categoryBreakdown[0]?.category || 'phần_thô_vật_tư']: true
  });

  const toggleCategory = (catKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catKey]: !prev[catKey]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const overBudgetCategories = report.categoryBreakdown.filter(c => c.targetBudget && c.totalAmount > c.targetBudget);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Top Header Banner & Multi-Period Switcher */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', padding: '6px 12px', fontSize: '0.75rem' }}>
                <Calendar size={14} /> {report.periodLabel}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {t('report.autoSummaryFor')} {projectName}
              </span>
            </div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '10px' }}>
              {t('report.title')}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('report.subtitle')}
            </p>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={18} />
              <span>{t('report.printPdf')}</span>
            </button>
            <button className="btn btn-success" onClick={onExportExcel}>
              <FileSpreadsheet size={18} />
              <span>{t('report.exportExcel')}</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> {t('report.periodLabel')}
          </span>

          <button
            onClick={() => setSelectedPeriod('weekly')}
            className={`btn btn-sm ${selectedPeriod === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('report.periodWeekly')}
          </button>

          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`btn btn-sm ${selectedPeriod === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('report.periodMonthly')}
          </button>

          <button
            onClick={() => setSelectedPeriod('quarterly')}
            className={`btn btn-sm ${selectedPeriod === 'quarterly' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('report.periodQuarterly')}
          </button>

          <button
            onClick={() => setSelectedPeriod('all')}
            className={`btn btn-sm ${selectedPeriod === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            {t('report.periodAll')}
          </button>
        </div>

      </div>

      {/* PHASE 1 OVERRUN WARNING ALERT CARD */}
      {overBudgetCategories.length > 0 && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '2px solid rgba(239, 68, 68, 0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertCircle size={24} color="var(--danger)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--danger)' }}>
              {t('report.overrunAlertTitle').replace('{n}', String(overBudgetCategories.length))}
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {overBudgetCategories.map(c => (
              <div key={c.category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card-alt)', padding: '10px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {catLabel(CATEGORY_METADATA[c.category as ExpenseCategory])}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)' }}>
                  {t('report.actual')}: {formatVND(c.totalAmount)} / {t('report.budget')}: {formatVND(c.targetBudget || 0)} ({t('report.over')} {formatVND(c.totalAmount - (c.targetBudget || 0))})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP PRIORITY: Flagged Expenses Needing Review */}
      {report.flaggedExpenses.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', border: '2px solid rgba(245, 158, 11, 0.6)', background: 'rgba(245, 158, 11, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '10px' }}>
                <AlertTriangle color="var(--accent-amber)" size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  {t('report.flaggedTitle')} ({report.flaggedExpenses.length} {t('ledger.itemsSuffix')})
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {t('report.flaggedSubtitle')}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.flaggedExpenses.map(item => (
              <div
                key={item.id}
                onClick={() => onSelectExpense(item)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={t('ledger.invoiceImageAlt')} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color)' }} />
                  ) : (
                    <div style={{ width: '48px', height: '48px', background: 'var(--bg-card-alt)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={20} color="var(--text-dim)" />
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '0.95rem' }}>{formatVND(item.amount)}</span>
                      {item.quantity && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-card-alt)', padding: '2px 8px', borderRadius: '6px', color: 'var(--text-main)', fontWeight: 700 }}>
                          {t('report.qty')}: {item.quantity} {item.unit || ''}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {item.date}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '3px' }}>
                      {item.merchant} ({catLabel(CATEGORY_METADATA[item.category])})
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t('report.note')}: {item.note}</p>
                  </div>
                </div>

                <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--chart-blue)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span>{t('report.reviewEdit')}</span>
                  <ExternalLink size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Executive Summary Card */}
      <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', borderLeft: '4px solid var(--success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', color: 'var(--success)' }}>
            <Sparkles size={20} />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)' }}>
            {t('report.summaryTitle')} ({report.periodLabel})
          </h3>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6', fontWeight: 500 }}>
          {report.aiExecutiveSummary}
        </p>
      </div>

      {/* Financial Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('report.totalActualSpend')}</p>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)', marginTop: '6px' }}>
            {formatVND(report.totalAmount)}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{report.itemCount} {t('report.invoicesTransactions')}</p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('report.topCategory')}</p>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--chart-blue)', marginTop: '6px' }}>
            {report.categoryBreakdown[0] ? catLabel(CATEGORY_METADATA[report.categoryBreakdown[0].category as ExpenseCategory]) : t('report.none')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {formatVND(report.categoryBreakdown[0]?.totalAmount || 0)} ({report.categoryBreakdown[0]?.percentage}%)
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('report.manDaysRecorded')}</p>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)', marginTop: '6px' }}>
            {report.totalManDaysRecorded} {t('report.manDaysUnit')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{t('report.shellAndFinish')}</p>
        </div>
      </div>

      {/* PHASE 1: BVA BUDGET VS ACTUAL ACCORDION CARDS */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} /> {t('report.bvaDetailTitle')}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('report.bvaDetailSubtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {report.categoryBreakdown.map((catSummary) => {
            const catKey = catSummary.category as ExpenseCategory;
            const meta = CATEGORY_METADATA[catKey] || CATEGORY_METADATA['chi_phí_khác'];
            const isExpanded = Boolean(expandedCategories[catKey]);
            const categoryTransactions = allExpenses.filter(i => i.category === catKey);

            const targetB = catSummary.targetBudget || 0;
            const remaining = catSummary.remainingBudget || 0;
            const variancePct = catSummary.variancePercentage || 0;
            const isOverBudget = targetB > 0 && catSummary.totalAmount > targetB;
            const accent = categoryAccent(catKey);

            let progressColor = 'var(--success)'; // Green < 85%
            if (variancePct >= 85 && variancePct <= 100) progressColor = 'var(--accent-amber)'; // Amber
            if (isOverBudget) progressColor = 'var(--danger)'; // Red, over budget

            return (
              <div
                key={catKey}
                style={{
                  background: 'var(--bg-input)',
                  border: `1px solid ${isOverBudget ? 'rgba(239, 68, 68, 0.5)' : isExpanded ? accent : 'var(--border-color)'}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Clickable Category Header Accordion Bar */}
                <div
                  onClick={() => toggleCategory(catKey)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    background: isExpanded ? 'var(--bg-card-alt)' : 'transparent',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '220px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: accent, flexShrink: 0 }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.02rem', color: 'var(--text-main)' }}>{catLabel(meta)}</span>
                        {isOverBudget && (
                          <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 800 }}>
                            {t('report.over')} {formatVND(catSummary.totalAmount - targetB)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                        {t('report.budget')}: <strong style={{ color: 'var(--text-main)' }}>{formatVND(targetB)}</strong> • {t('ledger.remainingBudget')}: <strong style={{ color: remaining < 0 ? 'var(--danger)' : 'var(--success)' }}>{formatVND(remaining)}</strong>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 800, color: progressColor }}>
                        {formatVND(catSummary.totalAmount)}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {t('report.usedPctOfBudget').replace('{pct}', String(variancePct))}
                      </p>
                    </div>
                    <div style={{ color: accent, padding: '4px' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Progress bar line */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(127, 127, 127, 0.15)' }}>
                  <div style={{ width: `${Math.min(100, variancePct)}%`, height: '100%', background: progressColor, transition: 'width 0.4s ease' }} />
                </div>

                {/* Expanded Transactions List Dropdown */}
                {isExpanded && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card-alt)' }}>
                    {categoryTransactions.length === 0 ? (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        {t('report.noTransactionsInCategory')}
                      </p>
                    ) : (
                      <div>
                        {/* Mobile Card List View for Accordion */}
                        <div className="mobile-only-cards" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {categoryTransactions.map(item => {
                            const uCost = item.unitCost || (item.quantity && item.amount ? Math.round(item.amount / item.quantity) : undefined);
                            return (
                              <div
                                key={item.id}
                                onClick={() => onSelectExpense(item)}
                                style={{
                                  background: 'var(--bg-input)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '12px',
                                  padding: '12px',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>{formatVND(item.amount)}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.date}</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                                  {item.merchant} {item.subCategory ? `(↳ ${item.subCategory})` : ''}
                                </p>
                                {item.quantity && (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
                                    {t('report.qty')}: {item.quantity} {item.unit || ''} {uCost ? `(${formatVND(uCost)}/đv)` : ''}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table View for Accordion */}
                        <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                <th style={{ padding: '8px' }}>{t('report.colCode')}</th>
                                <th style={{ padding: '8px' }}>{t('report.colQuantity')}</th>
                                <th style={{ padding: '8px' }}>{t('report.colUnitCost')}</th>
                                <th style={{ padding: '8px' }}>{t('report.colAmount')}</th>
                                <th style={{ padding: '8px' }}>{t('report.colSubDetail')}</th>
                                <th style={{ padding: '8px' }}>{t('report.colVendor')}</th>
                                <th style={{ padding: '8px' }}>{t('report.colNote')}</th>
                                <th style={{ padding: '8px', textAlign: 'right' }}>{t('report.colActions')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryTransactions.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                                    <strong>{item.id}</strong>
                                    <br />
                                    <span style={{ fontSize: '0.75rem' }}>{item.date}</span>
                                  </td>
                                  <td style={{ padding: '10px 8px', fontWeight: 800, color: item.quantity ? 'var(--text-main)' : 'var(--text-dim)' }}>
                                    {item.quantity ? `${item.quantity} ${item.unit || ''}` : item.manDays ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><HardHat size={12} /> {item.manDays} {t('report.manDaysShort')}</span>
                                    ) : '—'}
                                  </td>
                                  <td style={{ padding: '10px 8px', fontWeight: 700, color: item.unitCost ? 'var(--primary)' : 'var(--text-dim)' }}>
                                    {item.unitCost ? formatVND(item.unitCost) : '—'}
                                  </td>
                                  <td style={{ padding: '10px 8px', fontWeight: 800, color: 'var(--success)' }}>
                                    {formatVND(item.amount)}
                                  </td>
                                  <td style={{ padding: '10px 8px', color: 'var(--chart-blue)', fontWeight: 600 }}>
                                    {item.subCategory || '—'}
                                  </td>
                                  <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--text-main)' }}>
                                    {item.merchant}
                                  </td>
                                  <td style={{ padding: '10px 8px', color: 'var(--text-dim)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {item.note}
                                  </td>
                                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => onSelectExpense(item)}
                                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                    >
                                      {t('report.viewEdit')}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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
