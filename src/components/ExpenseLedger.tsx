import React, { useState } from 'react';
import { Search, Trash2, CheckCircle, ExternalLink, Boxes, AlertTriangle, ShieldCheck, Plus, Paintbrush, HardHat, Armchair, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, FilterOptions } from '../types/expense';
import { formatVND, filterExpenses, getCategoryBudgets, getInitialFunds } from '../services/storageService';

interface ExpenseLedgerProps {
  expenses: ExpenseItem[];
  onSelectExpense: (item: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchVerify: (ids: string[]) => void;
  onExportExcel: () => void;
  onOpenUpload: () => void;
}

const ITEMS_PER_PAGE = 25;

export const ExpenseLedger: React.FC<ExpenseLedgerProps> = ({
  expenses,
  onSelectExpense,
  onDeleteExpense,
  onBatchDelete,
  onBatchVerify,
  onOpenUpload
}) => {
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
        <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🎯 Tổng Quan Ngân Sách Dự Án (BVA)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', background: 'rgba(99, 102, 241, 0.06)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #3b82f6', background: 'var(--bg-panel)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Chi Phí Thực Tế</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
              {formatVND(totalSpent)}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {expenses.length} giao dịch
            </p>
          </div>

          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #60a5fa', background: 'var(--bg-panel)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Dự Toán Ngân Sách</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
              {formatVND(totalTargetBudget)}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Hạn mức 9 hạng mục
            </p>
          </div>

          <div className="glass-card" style={{ padding: '16px', borderLeft: `4px solid ${totalRemainingBudget < 0 ? '#f87171' : '#10b981'}`, background: 'var(--bg-panel)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ngân Sách Còn Lại</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: totalRemainingBudget < 0 ? '#f87171' : '#34d399', marginTop: '4px' }}>
              {formatVND(totalRemainingBudget)}
            </h3>
            <p style={{ fontSize: '0.75rem', color: totalRemainingBudget < 0 ? '#f87171' : '#34d399', marginTop: '2px', fontWeight: 700 }}>
              {totalRemainingBudget < 0 ? '⚠️ Đã Vượt Ngân Sách' : '🟢 Khả Dụng'}
            </p>
          </div>
        </div>

        {/* Real-time Cash Flow Sub-strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '12px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd' }}>🏦 Số Dư Ngân Hàng Còn:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: bankAvailable < 0 ? '#f87171' : '#ffffff' }}>{formatVND(bankAvailable)}</span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7' }}>💵 Ví Tiền Mặt Còn:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: cashAvailable < 0 ? '#f87171' : '#ffffff' }}>{formatVND(cashAvailable)}</span>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.18)', border: '1px solid rgba(99, 102, 241, 0.35)', padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a7f3d0' }}>💰 Tổng Dòng Tiền Khả Dụng:</span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: totalFundsAvailable < 0 ? '#f87171' : '#34d399' }}>{formatVND(totalFundsAvailable)}</span>
          </div>
        </div>
      </div>

      {/* GROUP 2: CATEGORY BREAKDOWN & STATUS */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🏗️ Chi Phí Hạng Mục Chính & Trạng Thái
          </h4>
          {totalManDays > 0 && (
            <span style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 800 }}>
              👷 Tổng {totalManDays} công thợ ghi nhận
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #3b82f6', background: 'var(--bg-panel)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phần Thô — Vật Tư</p>
              <Boxes size={14} color="#3b82f6" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#60a5fa', marginTop: '4px' }}>
              {formatVND(categoryStats['phần_thô_vật_tư'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Sắt, cát, xi măng</p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #10b981', background: 'var(--bg-panel)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phần Thô — Nhân Công</p>
              <HardHat size={14} color="#10b981" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
              {formatVND(categoryStats['phần_thô_nhân_công'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, marginTop: '2px' }}>
              👷 Lương thợ
            </p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #06b6d4', background: 'var(--bg-panel)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hoàn Thiện — Vật Tư</p>
              <Paintbrush size={14} color="#06b6d4" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#22d3ee', marginTop: '4px' }}>
              {formatVND(categoryStats['hoàn_thiện_vật_tư'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Sơn, gạch, thiết bị</p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: '4px solid #f59e0b', background: 'var(--bg-panel)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Nội Thất (FF&E)</p>
              <Armchair size={14} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {formatVND(categoryStats['nội_thất_thiết_bị'] || 0)}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Tủ kệ, máy lạnh</p>
          </div>

          <div className="glass-card" style={{ padding: '14px', borderLeft: `4px solid ${pendingItems.length > 0 ? '#f59e0b' : '#10b981'}`, background: 'var(--bg-panel)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cần Rà Soát</p>
              {pendingItems.length > 0 ? <AlertTriangle size={14} color="#fbbf24" /> : <ShieldCheck size={14} color="#34d399" />}
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: pendingItems.length > 0 ? '#fbbf24' : '#34d399', marginTop: '4px' }}>
              {pendingItems.length} mục
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Chưa xác minh</p>
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
                placeholder="Tìm GPXD, sắt thép, minh ngoc, 18.5M..."
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
                  color: '#f8fafc',
                  fontSize: '0.88rem',
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
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="đã_xác_minh">🟢 Đã xác minh</option>
              <option value="cần_kiểm_tra">🟡 Cần kiểm tra lại</option>
            </select>

            <button
              className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={16} />
              <span>{showAdvancedFilters ? 'Ẩn Bộ Lọc' : 'Bộ Lọc...'}</span>
            </button>

            <button className="btn btn-secondary btn-sm" onClick={handleResetFilters} title="Đặt lại bộ lọc">
              <RotateCcw size={16} />
            </button>
          </div>

          {showAdvancedFilters && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '14px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px'
            }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Từ Ngày
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={e => { setFilters({ ...filters, startDate: e.target.value }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Đến Ngày
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={e => { setFilters({ ...filters, endDate: e.target.value }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#f8fafc', fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '4px' }}>
                  Tiền Min (VND)
                </label>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ''}
                  onChange={e => { setFilters({ ...filters, minAmount: parseFloat(e.target.value) || undefined }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '4px' }}>
                  Tiền Max (VND)
                </label>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount || ''}
                  onChange={e => { setFilters({ ...filters, maxAmount: parseFloat(e.target.value) || undefined }); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}
                />
              </div>
            </div>
          )}

          {/* Category Filter Grid */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Danh Mục Công Trình ({Object.keys(CATEGORY_METADATA).length} Hạng Mục):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
              <button
                onClick={() => { setFilters({ ...filters, category: 'all' }); setCurrentPage(1); }}
                className={`btn btn-sm ${filters.category === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'center', width: '100%' }}
              >
                Tất cả ({expenses.length})
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
                  {meta.label}
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
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
            Đã chọn {selectedIds.length} mục
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-success btn-sm" onClick={() => { onBatchVerify(selectedIds); setSelectedIds([]); }}>
              <CheckCircle size={16} />
              <span>Xác Minh</span>
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} chi phí đã chọn không?`)) {
                  onBatchDelete(selectedIds);
                  setSelectedIds([]);
                }
              }}
            >
              <Trash2 size={16} />
              <span>Xóa Đã Chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Result Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Tìm thấy <strong style={{ color: '#34d399' }}>{filteredExpenses.length}</strong> giao dịch
        </p>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Trang {validCurrentPage} / {totalPages}
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
      <div className="glass-panel" style={{ borderRadius: '18px', overflow: 'hidden' }}>
        {paginatedExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-muted)' }}>Chưa có hóa đơn nào khớp với bộ lọc</p>
            <button className="btn btn-primary" onClick={onOpenUpload} style={{ marginTop: '16px' }}>
              <Plus size={18} />
              <span>Tải Lên Hóa Đơn Đầu Tiên</span>
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
                      <img src={item.imageUrl} alt="Hóa đơn" style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '10px', border: '1px solid var(--border-color)' }} />
                    ) : (
                      <div style={{ width: '54px', height: '54px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                        No Img
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, color: '#34d399', fontSize: '1.05rem' }}>{formatVND(item.amount)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.date}</span>
                      </div>
                      <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                        {item.merchant}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ background: categoryMeta.bg, color: categoryMeta.color, fontSize: '0.72rem' }}>
                          {categoryMeta.label}
                        </span>
                        {item.quantity && (
                          <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
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
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 16px', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.length === paginatedExpenses.length && paginatedExpenses.length > 0}
                        onChange={e => handleSelectAll(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                    <th style={{ padding: '14px 16px', width: '75px' }}>Ảnh Hóa Đơn</th>
                    <th style={{ padding: '14px 16px' }}>Ngày</th>
                    <th style={{ padding: '14px 16px' }}>Số Lượng</th>
                    <th style={{ padding: '14px 16px' }}>Đơn Giá (Unit Cost)</th>
                    <th style={{ padding: '14px 16px' }}>Số Tiền (Total Paid)</th>
                    <th style={{ padding: '14px 16px' }}>Danh Mục Chuẩn & Phụ</th>
                    <th style={{ padding: '14px 16px' }}>Đơn Vị / Thợ Nhận</th>
                    <th style={{ padding: '14px 16px' }}>Ghi Chú Chi Tiết</th>
                    <th style={{ padding: '14px 16px' }}>Thanh Toán</th>
                    <th style={{ padding: '14px 16px' }}>Trạng Thái</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Thao Tác</th>
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
                              alt="Hóa đơn"
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
                              No Img
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {item.date}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 700, color: item.quantity ? '#f8fafc' : 'var(--text-dim)' }}>
                          {item.quantity ? `${item.quantity} ${item.unit || ''}` : '—'}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 700, color: uCost ? '#fbbf24' : 'var(--text-dim)' }}>
                          {uCost ? formatVND(uCost) : '—'}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#34d399', fontSize: '0.98rem' }}>
                          {formatVND(item.amount)}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span className="badge" style={{ background: categoryMeta.bg, color: categoryMeta.color }}>
                            {categoryMeta.label}
                          </span>
                          {item.subCategory && (
                            <p style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 700, marginTop: '3px' }}>
                              ↳ {item.subCategory}
                            </p>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>
                          {item.merchant}
                        </td>

                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.note}
                        </td>

                        <td style={{ padding: '14px 16px', color: 'var(--text-dim)' }}>
                          {item.paymentMethod === 'chuyển_khoản' ? '🏦 Chuyển khoản' : '💵 Tiền mặt'}
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          {item.status === 'đã_xác_minh' ? (
                            <span className="badge badge-verified">
                              <CheckCircle size={14} /> Đã xác minh
                            </span>
                          ) : (
                            <span className="badge badge-pending">
                              <AlertTriangle size={14} /> Cần kiểm tra
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onSelectExpense(item)}
                              title="Xem chi tiết & Chỉnh sửa"
                            >
                              <ExternalLink size={14} />
                              <span>Sửa</span>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                if (window.confirm('Bạn có chắc chắn muốn xóa chi phí này không?')) {
                                  onDeleteExpense(item.id);
                                }
                              }}
                              title="Xóa dòng chi phí"
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
          <div style={{ padding: '16px 20px', background: 'rgba(0, 0, 0, 0.2)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Trang <strong style={{ color: '#f8fafc' }}>{validCurrentPage}</strong> / {totalPages}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={validCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft size={16} /> Trang Trước
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={validCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Trang Sau <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
