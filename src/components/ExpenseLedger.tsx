import React, { useState } from 'react';
import { Search, Trash2, CheckCircle, ExternalLink, Boxes, AlertTriangle, ShieldCheck, Plus, Paintbrush, HardHat, Armchair, Filter, ChevronLeft, ChevronRight, RotateCcw, FileSpreadsheet, FileText, Target, Landmark, Wallet, DollarSign } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, FilterOptions } from '../types/expense';
import { formatVND, filterExpenses, getCategoryBudgets, getInitialFunds } from '../services/storageService';
import { useLanguage } from '../i18n/LanguageContext';

interface ExpenseLedgerProps {
  expenses: ExpenseItem[];
  onSelectExpense: (item: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchVerify: (ids: string[]) => void;
  onExportExcel: () => void;
  onOpenUpload: () => void;
  onOpenQuotationModal?: () => void;
}

const ITEMS_PER_PAGE = 25;

export const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({
  expenses,
  onSelectExpense,
  onDeleteExpense,
  onBatchDelete,
  onBatchVerify,
  onExportExcel,
  onOpenUpload,
  onOpenQuotationModal
}) => {
  const { t, language } = useLanguage();
  const catLabel = (meta: { label: string; englishLabel: string }) => (language === 'en' ? meta.englishLabel : meta.label);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    category: 'all',
    status: 'all',
    paymentMethod: 'all',
    startDate: '',
    endDate: '',
    minAmount: undefined,
    maxAmount: undefined,
    minQuantity: undefined,
    maxQuantity: undefined,
    subCategorySearch: '',
    merchantSearch: ''
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const budgets = getCategoryBudgets();
  const totalTargetBudget = Object.values(budgets).reduce((sum, b) => sum + (b || 0), 0);

  // Automatic Zero-Work Cash Flow Math
  const initialFunds = getInitialFunds();
  const bankSpent = expenses.filter(i => i.paymentMethod === 'chuyển_khoản').reduce((sum, i) => sum + i.amount, 0);
  const cashSpent = expenses.filter(i => i.paymentMethod === 'tiền_mặt').reduce((sum, i) => sum + i.amount, 0);
  const bankAvailable = initialFunds.bank - bankSpent;
  const cashAvailable = initialFunds.cash - cashSpent;
  const totalFundsAvailable = bankAvailable + cashAvailable;

  const categoryStats = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalRemainingBudget = totalTargetBudget - totalSpent;
  const pendingItems = expenses.filter(i => i.status === 'cần_kiểm_tra');
  const totalManDays = expenses.reduce((sum, item) => sum + (item.manDays || 0), 0);

  const filteredExpenses = filterExpenses(expenses, filters);

  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      category: 'all',
      status: 'all',
      paymentMethod: 'all',
      startDate: '',
      endDate: '',
      minAmount: undefined,
      maxAmount: undefined,
      minQuantity: undefined,
      maxQuantity: undefined,
      subCategorySearch: '',
      merchantSearch: ''
    });
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedExpenses.map(i => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* GROUP 1: OVERALL PROJECT BUDGET SUMMARY (BVA) */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={14} /> {t('ledger.bvaOverview')}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', background: 'rgba(99, 102, 241, 0.06)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--primary)', background: 'var(--bg-card)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.actualSpent')}</p>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
              {formatVND(totalSpent)}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {expenses.length} {t('ledger.transactionsSuffix')}
            </p>
          </div>

          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid var(--chart-blue)', background: 'var(--bg-card)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.budgetEstimate')}</p>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--chart-blue)', marginTop: '4px' }}>
              {formatVND(totalTargetBudget)}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {t('ledger.budgetLimit9')}
            </p>
          </div>

          <div className="glass-card" style={{ padding: '16px', borderLeft: `4px solid ${totalRemainingBudget < 0 ? 'var(--danger)' : 'var(--success)'}`, background: 'var(--bg-card)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.remainingBudget')}</p>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: totalRemainingBudget < 0 ? 'var(--danger)' : 'var(--success)', marginTop: '4px' }}>
              {formatVND(totalRemainingBudget)}
            </h3>
            <p style={{ fontSize: '0.75rem', color: totalRemainingBudget < 0 ? 'var(--danger)' : 'var(--success)', marginTop: '2px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {totalRemainingBudget < 0 ? <><AlertTriangle size={12} /> {t('ledger.overBudget')}</> : <><ShieldCheck size={12} /> {t('ledger.available')}</>}
            </p>
          </div>
        </div>

        {/* Real-time Cash Flow Sub-strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--chart-blue)', display: 'flex', alignItems: 'center', gap: '5px' }}><Landmark size={13} /> {t('ledger.bankRemaining')}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: bankAvailable < 0 ? 'var(--danger)' : 'var(--text-main)' }}>{formatVND(bankAvailable)}</span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}><Wallet size={13} /> {t('ledger.cashRemaining')}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: cashAvailable < 0 ? 'var(--danger)' : 'var(--text-main)' }}>{formatVND(cashAvailable)}</span>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(99, 102, 241, 0.35)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '5px' }}><DollarSign size={13} /> {t('ledger.totalFundsAvailable')}</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: totalFundsAvailable < 0 ? 'var(--danger)' : 'var(--success)' }}>{formatVND(totalFundsAvailable)}</span>
          </div>
        </div>
      </div>

      {/* GROUP 2: CATEGORY BREAKDOWN & STATUS */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardHat size={14} /> {t('ledger.categoryStatus')}
          </h4>
          {totalManDays > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--chart-blue)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <HardHat size={13} /> {t('ledger.manDaysRecordedPrefix')} {totalManDays} {t('ledger.manDaysRecordedSuffix')}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', background: 'var(--bg-card-alt)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid var(--cat-shell-material)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.catShellMaterial')}</p>
              <Boxes size={14} color="var(--cat-shell-material)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cat-shell-material)', marginTop: '4px' }}>
              {formatVND(categoryStats['phần_thô_vật_tư'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t('ledger.catShellMaterialDesc')}</p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid var(--cat-shell-labor)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.catShellLabor')}</p>
              <HardHat size={14} color="var(--cat-shell-labor)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cat-shell-labor)', marginTop: '4px' }}>
              {formatVND(categoryStats['phần_thô_nhân_công'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--cat-shell-labor)', fontWeight: 700, marginTop: '2px' }}>
              {t('ledger.catShellLaborDesc')}
            </p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid var(--cat-finish-material)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.catFinishMaterial')}</p>
              <Paintbrush size={14} color="var(--cat-finish-material)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cat-finish-material)', marginTop: '4px' }}>
              {formatVND(categoryStats['hoàn_thiện_vật_tư'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t('ledger.catFinishMaterialDesc')}</p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid var(--cat-furniture)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.catFurniture')}</p>
              <Armchair size={14} color="var(--cat-furniture)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cat-furniture)', marginTop: '4px' }}>
              {formatVND(categoryStats['nội_thất_thiết_bị'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t('ledger.catFurnitureDesc')}</p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: `4px solid ${pendingItems.length > 0 ? 'var(--border-strong)' : 'var(--success)'}`, background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('ledger.needsReview')}</p>
              {pendingItems.length > 0 ? <AlertTriangle size={14} color="var(--text-dim)" /> : <ShieldCheck size={14} color="var(--success)" />}
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: pendingItems.length > 0 ? 'var(--text-dim)' : 'var(--success)', marginTop: '4px' }}>
              {pendingItems.length} {t('ledger.itemsSuffix')}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t('ledger.unverified')}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder={t('ledger.searchPlaceholder')}
                value={filters.searchTerm}
                onChange={e => {
                  setFilters({ ...filters, searchTerm: e.target.value });
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              />
            </div>

            <select
              value={filters.status}
              onChange={e => {
                setFilters({ ...filters, status: e.target.value });
                setCurrentPage(1);
              }}
              style={{
                padding: '10px 12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">{t('ledger.allStatuses')}</option>
              <option value="đã_xác_minh">{t('ledger.verified')}</option>
              <option value="cần_kiểm_tra">{t('ledger.needsRecheck')}</option>
            </select>

            <button
              className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} />
              <span>{showAdvancedFilters ? t('ledger.filtersHide') : t('ledger.filtersShow')}</span>
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handleResetFilters} title={t('ledger.resetFiltersTitle')}>
              <RotateCcw size={16} />
            </button>

            {onOpenQuotationModal && (
              <button
                className="btn btn-secondary"
                onClick={onOpenQuotationModal}
                style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                title={t('nav.importQuoteTitle')}
              >
                <FileText size={16} />
                <span>{t('ledger.importQuoteShort')}</span>
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={onExportExcel}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
              title={t('ledger.exportTitle')}
            >
              <FileSpreadsheet size={16} />
              <span>{t('ledger.exportSheets')} ({filteredExpenses.length})</span>
            </button>
          </div>

          {showAdvancedFilters && (
            <div style={{
              background: 'var(--bg-card-alt)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px'
            }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('ledger.fromDate')}
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={e => { setFilters({ ...filters, startDate: e.target.value }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.75rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  {t('ledger.toDate')}
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={e => { setFilters({ ...filters, endDate: e.target.value }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', fontSize: '0.75rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', display: 'block', marginBottom: '4px' }}>
                  {t('ledger.minAmount')}
                </label>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ''}
                  onChange={e => { setFilters({ ...filters, minAmount: parseFloat(e.target.value) || undefined }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--success)', display: 'block', marginBottom: '4px' }}>
                  {t('ledger.maxAmount')}
                </label>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount || ''}
                  onChange={e => { setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || undefined }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}
                />
              </div>
            </div>
          )}

          {/* Category Filter Grid */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              {t('ledger.categoryFilterLabel')} ({Object.keys(CATEGORY_METADATA).length} {t('ledger.categoriesSuffix')}):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              <button
                onClick={() => { setFilters({ ...filters, category: 'all' }); setCurrentPage(1); }}
                className={`btn btn-sm ${filters.category === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', width: '100%' }}
              >
                {t('ledger.all')} ({expenses.length})
              </button>

              {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => (
                <button
                  key={catKey}
                  onClick={() => { setFilters({ ...filters, category: catKey }); setCurrentPage(1); }}
                  className={`btn btn-sm ${filters.category === catKey ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    background: filters.category === catKey ? meta.color : undefined,
                    borderColor: filters.category === catKey ? meta.color : undefined,
                    justifyContent: 'center',
                    width: '100%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {catLabel(meta)}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          borderRadius: '14px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {selectedIds.length} {t('ledger.selectedSuffix')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-success btn-sm" onClick={() => { onBatchVerify(selectedIds); setSelectedIds([]); }}>
              <CheckCircle size={16} />
              <span>{t('ledger.verifyBtn')}</span>
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm(t('ledger.deleteSelectedConfirm'))) {
                  onBatchDelete(selectedIds);
                  setSelectedIds([]);
                }
              }}
            >
              <Trash2 size={16} />
              <span>{t('ledger.deleteSelected')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Result Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {t('ledger.found')} <strong style={{ color: 'var(--success)' }}>{filteredExpenses.length}</strong> {t('ledger.transactionsSuffix')}
        </p>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {t('ledger.page')} {validCurrentPage} / {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Expenses List Container (Mobile Cards & Desktop Table) */}
      <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {paginatedExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('ledger.noMatch')}</p>
            <button className="btn btn-primary" onClick={onOpenUpload} style={{ marginTop: '16px' }}>
              <Plus size={18} />
              <span>{t('ledger.uploadFirst')}</span>
            </button>
          </div>
        ) : (
          <div>
            {/* 1. Mobile Cards View (Visible on touch / small screens) */}
            <div className="mobile-only-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px' }}>
              {paginatedExpenses.map(item => {
                const categoryMeta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA['chi_phí_khác'];
                const uCost = item.unitCost || (item.quantity && item.amount ? Math.round(item.amount / item.quantity) : undefined);

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectExpense(item)}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '14px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={t('ledger.invoiceImageAlt')} style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color)' }} />
                    ) : (
                      <div style={{ width: '54px', height: '54px', background: 'var(--bg-card-alt)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                        {t('ledger.noImg')}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>{formatVND(item.amount)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.date}</span>
                      </div>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                        {item.merchant}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: categoryMeta.bg, color: categoryMeta.color, fontSize: '0.72rem' }}>
                          {catLabel(categoryMeta)}
                        </span>
                        {item.quantity && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                            {item.quantity} {item.unit || ''} {uCost ? `(${formatVND(uCost)}/đv)` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Table View (Full Column View) */}
            <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-card-alt)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 16px', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedExpenses.length && paginatedExpenses.length > 0}
                        onChange={e => handleSelectAll(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '14px 16px', width: '75px' }}>{t('ledger.colImage')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colDate')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colQuantity')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colUnitCost')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colTotalPaid')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colCategory')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colVendor')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colNote')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colPayment')}</th>
                    <th style={{ padding: '14px 16px' }}>{t('ledger.colStatus')}</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>{t('ledger.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedExpenses.map(item => {
                    const categoryMeta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA['chi_phí_khác'];
                    const isSelected = selectedIds.includes(item.id);
                    const uCost = item.unitCost || (item.quantity && item.amount ? Math.round(item.amount / item.quantity) : undefined);

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={t('ledger.invoiceImageAlt')}
                              onClick={() => onSelectExpense(item)}
                              style={{
                                width: '46px',
                                height: '46px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                cursor: 'pointer'
                              }}
                            />
                          ) : (
                            <div
                              onClick={() => onSelectExpense(item)}
                              style={{
                                width: '46px',
                                height: '46px',
                                background: 'var(--bg-input)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-dim)',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              {t('ledger.noImg')}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {item.date}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 700, color: item.quantity ? 'var(--text-main)' : 'var(--text-dim)' }}>
                          {item.quantity ? `${item.quantity} ${item.unit || ''}` : '—'}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 700, color: uCost ? 'var(--primary)' : 'var(--text-dim)' }}>
                          {uCost ? formatVND(uCost) : '—'}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--success)', fontSize: '0.98rem' }}>
                          {formatVND(item.amount)}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span className="badge" style={{ background: categoryMeta.bg, color: categoryMeta.color }}>
                            {catLabel(categoryMeta)}
                          </span>
                          {item.subCategory && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--chart-blue)', fontWeight: 700, marginTop: '3px' }}>
                              ↳ {item.subCategory}
                            </p>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>
                          {item.merchant}
                        </td>

                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.note}
                        </td>

                        <td style={{ padding: '14px 16px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {item.paymentMethod === 'chuyển_khoản' ? <><Landmark size={13} /> {t('ledger.bankTransfer')}</> : <><Wallet size={13} /> {t('ledger.cash')}</>}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {item.status === 'đã_xác_minh' ? (
                            <span className="badge badge-verified">
                              <CheckCircle size={14} /> {t('ledger.verifiedBadge')}
                            </span>
                          ) : (
                            <span className="badge badge-pending">
                              <AlertTriangle size={14} /> {t('ledger.needsCheckBadge')}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onSelectExpense(item)}
                              title={t('ledger.editTitle')}
                            >
                              <ExternalLink size={14} />
                              <span>{t('ledger.edit')}</span>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                if (window.confirm(t('ledger.deleteConfirm'))) {
                                  onDeleteExpense(item.id);
                                }
                              }}
                              title={t('ledger.deleteTitle')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', background: 'var(--bg-card-alt)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {t('ledger.page')} <strong style={{ color: 'var(--text-main)' }}>{validCurrentPage}</strong> / {totalPages}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} /> {t('ledger.prevPage')}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                {t('ledger.nextPage')} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
