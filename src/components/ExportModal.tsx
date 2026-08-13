import React, { useState } from 'react';
import { X, FileSpreadsheet, ExternalLink, Check, Download, Info, Printer, FileText } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, ExpenseCategory } from '../types/expense';
import {
  exportToExcel,
  exportBvaToExcel,
  exportVendorsToExcel,
  exportCashFlowToExcel,
  getCategoryBudgets,
  getInitialFunds,
  getCapitalTransactions
} from '../services/storageService';

export type ExportContext = 'ledger' | 'saturday_report' | 'bva_budget' | 'vendors' | 'cash_flow';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  projectName: string;
  exportContext?: ExportContext;
}

function formatCommas(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return '0';
  const hasDecimal = num % 1 !== 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: 2
  }).format(num);
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  expenses,
  projectName,
  exportContext = 'ledger'
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [showPasteGuide, setShowPasteGuide] = useState(false);

  // Dynamic Modal Titles based on context
  const getContextTitle = () => {
    switch (exportContext) {
      case 'bva_budget':
        return 'Xuất Hạn Mức Dự Toán Ngân Sách (BVA)';
      case 'vendors':
        return 'Xuất Danh Sách Nhà Cung Cấp & Tổ Thợ';
      case 'cash_flow':
        return 'Xuất Báo Cáo Dòng Tiền & Quỹ';
      case 'saturday_report':
        return 'Xuất Báo Cáo Phân Tích Chi Phí Tuần / Tháng';
      case 'ledger':
      default:
        return `Xuất Dữ Liệu Chi Phí (${expenses.length} Giao Dịch)`;
    }
  };

  // Generate Tab-Separated TSV Data for Clipboard / Copying
  const generateTSVData = (): string => {
    if (exportContext === 'bva_budget') {
      const budgets = getCategoryBudgets();
      const categoryTotals: Record<string, number> = {};
      expenses.forEach(i => { categoryTotals[i.category] = (categoryTotals[i.category] || 0) + i.amount; });

      const headers = ['STT', 'Hạng Mục Công Trình', 'Tiếng Anh', 'Hạn Mức Dự Toán (VND)', 'Thực Chi (VND)', 'Còn Lại (VND)', 'Tỷ Lệ Chi (%)', 'Trạng Thái'].join('\t');
      const rows = Object.entries(CATEGORY_METADATA).map(([key, meta], idx) => {
        const catKey = key as ExpenseCategory;
        const target = budgets[catKey] || 0;
        const spent = categoryTotals[key] || 0;
        const remaining = target - spent;
        const pct = target > 0 ? Math.round((spent / target) * 100) : 0;
        return [idx + 1, meta.label, meta.englishLabel, formatCommas(target), formatCommas(spent), formatCommas(remaining), `${pct}%`, remaining < 0 ? 'Vượt Dự Toán' : 'Trong Hạn Mức'].join('\t');
      });
      return [headers, ...rows].join('\n');
    }

    if (exportContext === 'vendors') {
      const vendorsMap = new Map<string, { merchant: string; totalPaid: number; count: number; manDays: number; categories: Set<string> }>();
      expenses.forEach(item => {
        const m = (item.merchant || 'Không xác định').trim();
        if (!vendorsMap.has(m)) {
          vendorsMap.set(m, { merchant: m, totalPaid: 0, count: 0, manDays: 0, categories: new Set() });
        }
        const entry = vendorsMap.get(m)!;
        entry.totalPaid += item.amount;
        entry.count += 1;
        entry.manDays += (item.manDays || 0);
        entry.categories.add(CATEGORY_METADATA[item.category]?.label || item.category);
      });

      const headers = ['STT', 'Đơn Vị / Thợ Nhận', 'Tổng Tiền Đã Thanh Toán (VND)', 'Số Hóa Đơn', 'Số Công Thợ', 'Hạng Mục Đảm Nhận'].join('\t');
      const rows = Array.from(vendorsMap.values()).map((v, idx) => [
        idx + 1, v.merchant, formatCommas(v.totalPaid), v.count, v.manDays || 0, Array.from(v.categories).join(', ')
      ].join('\t'));
      return [headers, ...rows].join('\n');
    }

    if (exportContext === 'cash_flow') {
      const initial = getInitialFunds();
      const capitalTxs = getCapitalTransactions();
      const bankSpent = expenses.filter(i => i.paymentMethod === 'chuyển_khoản').reduce((sum, i) => sum + i.amount, 0);
      const cashSpent = expenses.filter(i => i.paymentMethod === 'tiền_mặt').reduce((sum, i) => sum + i.amount, 0);
      const capitalDeposits = capitalTxs.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
      const cashWithdrawals = capitalTxs.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);

      const bankBalance = (initial.bank + capitalDeposits) - cashWithdrawals - bankSpent;
      const cashBalance = (initial.cash + cashWithdrawals) - cashSpent;

      const headers = ['Chỉ Số Dòng Tiền', 'Số Tiền (VND)'].join('\t');
      const rows = [
        ['Ngân Sách Ban Đầu Ngân Hàng', formatCommas(initial.bank)],
        ['Ngân Sách Ban Đầu Tiền Mặt', formatCommas(initial.cash)],
        ['Tổng Nạp Vốn Bổ Sung', formatCommas(capitalDeposits)],
        ['Tổng Rút Tiền Mặt Nhập Quỹ', formatCommas(cashWithdrawals)],
        ['Tổng Chi Chuyển Khoản', formatCommas(bankSpent)],
        ['Tổng Chi Tiền Mặt', formatCommas(cashSpent)],
        ['Số Dư Ngân Hàng Hiện Tại', formatCommas(bankBalance)],
        ['Số Dư Ví Tiền Mặt Hiện Tại', formatCommas(cashBalance)],
        ['TỔNG DÒNG TIỀN KHẢ DỤNG', formatCommas(bankBalance + cashBalance)]
      ].map(r => r.join('\t'));
      return [headers, ...rows].join('\n');
    }

    // Default: Ledger expenses list
    const headers = ['STT', 'Mã hóa đơn', 'Ngày', 'Số lượng', 'Đơn giá (VND)', 'Số tiền (VND)', 'Danh mục chuẩn', 'Tiếng Anh', 'Chi tiết phụ', 'Số công thợ', 'Đơn vị / Thợ nhận', 'Hình thức thanh toán', 'Trạng thái', 'Ghi chú'].join('\t');
    const rows = expenses.map((item, idx) => {
      const uCost = item.unitCost || (item.quantity && item.amount ? Math.round(item.amount / item.quantity) : undefined);
      return [
        idx + 1, item.id, item.date, item.quantity ? `${item.quantity} ${item.unit || ''}` : '',
        formatCommas(uCost), formatCommas(item.amount), CATEGORY_METADATA[item.category]?.label || item.category,
        CATEGORY_METADATA[item.category]?.englishLabel || '', item.subCategory || '', item.manDays || '',
        item.merchant, item.paymentMethod === 'chuyển_khoản' ? 'Chuyển khoản' : 'Tiền mặt',
        item.status === 'đã_xác_minh' ? 'Đã xác minh' : 'Cần kiểm tra', item.note.replace(/\n/g, ' ')
      ].join('\t');
    });
    return [headers, ...rows].join('\n');
  };

  // Option 1: Copy TSV for Google Sheets & Open sheets.new
  const handleCopyForGoogleSheets = () => {
    const tsvData = generateTSVData();
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    setShowPasteGuide(true);
    window.open('https://sheets.new', '_blank');
  };

  // Option 2: Download CSV
  const handleDownloadCSV = () => {
    const tsvData = generateTSVData();
    const blob = new Blob(['\uFEFF' + tsvData.replace(/\t/g, ',')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportContext}_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  // Option 3: Download XLSX
  const handleDownloadXLSX = () => {
    if (exportContext === 'bva_budget') {
      exportBvaToExcel(expenses, projectName);
    } else if (exportContext === 'vendors') {
      exportVendorsToExcel(expenses, projectName);
    } else if (exportContext === 'cash_flow') {
      exportCashFlowToExcel(expenses, projectName);
    } else {
      exportToExcel(expenses, projectName);
    }
    onClose();
  };

  // Option 4: Print / Save to PDF
  const handlePrintPdf = () => {
    window.print();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', borderRadius: '24px', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#34d399' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                {getContextTitle()}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Chọn 1 trong 4 định dạng xuất dữ liệu bên dưới
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ borderRadius: '50%', padding: '8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Paste Instruction Alert Box */}
        {showPasteGuide && (
          <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Info size={18} /> Đã copy dữ liệu vào Clipboard!
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Trang Google Sheets vừa được mở trong tab mới. Hãy nhấp vào ô <strong>A1</strong> và nhấn <strong>Ctrl + V</strong> (hoặc <strong>Cmd + V</strong>) để dán dữ liệu vào ngay!
            </p>
          </div>
        )}

        {/* 4 Options Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Option 1: Copy & Open Google Sheets */}
          <div
            onClick={handleCopyForGoogleSheets}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '16px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} color="var(--chart-blue)" />
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#60a5fa' }}>
                  Copy & Mở Google Sheets (Bấm Ctrl+V Để Dán)
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Copy dữ liệu (đã định dạng phẩy phân cách ngàn) & mở Google Sheets. Bấm <strong>Ctrl+V</strong> để dán!
              </p>
            </div>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#60a5fa' }}>
              {copied ? <Check size={20} /> : <ExternalLink size={20} />}
            </div>
          </div>

          {/* Option 2: Download CSV */}
          <div
            onClick={handleDownloadCSV}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--text-muted)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Tải File CSV Cho Google Drive
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Tải file `.csv` có định dạng dấu phẩy phân cách ngàn để kéo thả vào Google Drive
              </p>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', color: 'var(--text-muted)' }}>
              <Download size={20} />
            </div>
          </div>

          {/* Option 3: Download Microsoft Excel (.xlsx) */}
          <div
            onClick={handleDownloadXLSX}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={20} color="var(--success)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }}>
                  Tải File Microsoft Excel (.xlsx)
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Xuất file Excel chuẩn hóa có tiêu đề, màu sắc & độ rộng cột tự động
              </p>
            </div>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#34d399' }}>
              <Download size={20} />
            </div>
          </div>

          {/* Option 4: Print / Save to PDF */}
          <div
            onClick={handlePrintPdf}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={20} color="var(--warning)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}>
                  In Báo Cáo / Xuất File PDF
                </h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Mở giao diện in ẩn các nút điều khiển, sẵn sàng lưu thành file PDF hoặc in giấy
              </p>
            </div>
            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: '#fbbf24' }}>
              <Printer size={20} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
