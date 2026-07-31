import React, { useState } from 'react';
import { X, FileSpreadsheet, ExternalLink, Check, Download, Info } from 'lucide-react';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem } from '../types/expense';
import { exportToExcel } from '../services/storageService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ExpenseItem[];
  projectName: string;
}

// Formats number with commas for spreadsheet output (e.g. 18500000 -> "18,500,000")
function formatCommas(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return '';
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
  projectName
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [showPasteGuide, setShowPasteGuide] = useState(false);

  const handleExportExcel = () => {
    exportToExcel(expenses, projectName);
    onClose();
  };

  // Generate Tab-Separated Data with thousand separators for Google Sheets
  const generateGoogleSheetsTSV = (): string => {
    const headers = [
      'STT',
      'Mã hóa đơn',
      'Ngày',
      'Số lượng',
      'Đơn giá (VND)',
      'Số tiền (VND)',
      'Danh mục chuẩn',
      'Tiếng Anh',
      'Chi tiết phụ',
      'Số công thợ',
      'Đơn vị / Thợ nhận',
      'Hình thức thanh toán',
      'Trạng thái',
      'Ghi chú chi tiết'
    ].join('\t');

    const rows = expenses.map((item, idx) => {
      const uCost = item.unitCost || (item.quantity && item.amount ? Math.round(item.amount / item.quantity) : undefined);
      return [
        idx + 1,
        item.id,
        item.date,
        item.quantity ? `${item.quantity} ${item.unit || ''}` : '',
        formatCommas(uCost),
        formatCommas(item.amount),
        CATEGORY_METADATA[item.category]?.label || item.category,
        CATEGORY_METADATA[item.category]?.englishLabel || '',
        item.subCategory || '',
        item.manDays || '',
        item.merchant,
        item.paymentMethod === 'chuyển_khoản' ? 'Chuyển khoản' : 'Tiền mặt',
        item.status === 'đã_xác_minh' ? 'Đã xác minh' : 'Cần kiểm tra',
        item.note.replace(/\n/g, ' ')
      ].join('\t');
    });

    return [headers, ...rows].join('\n');
  };

  const handleCopyForGoogleSheets = () => {
    const tsvData = generateGoogleSheetsTSV();
    navigator.clipboard.writeText(tsvData);
    setCopied(true);
    setShowPasteGuide(true);
    // Open a brand new Google Sheet tab in browser
    window.open('https://sheets.new', '_blank');
  };

  const handleDownloadCSV = () => {
    const tsvData = generateGoogleSheetsTSV();
    // UTF-8 BOM (\uFEFF) ensures Vietnamese accents display perfectly in Google Drive / Excel CSV
    const blob = new Blob(['\uFEFF' + tsvData.replace(/\t/g, ',')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chi_Phi_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_GoogleSheets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                Xuất Dữ Liệu Chi Phí ({expenses.length} Giao Dịch)
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chọn định dạng xuất sang Google Sheets hoặc Microsoft Excel
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
            <p style={{ fontSize: '0.88rem', fontWeight: 800, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Info size={18} /> Đã copy thành công {expenses.length} giao dịch vào Clipboard!
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Trang Google Sheets vừa được mở trong tab mới. Hãy nhấp vào ô <strong>A1</strong> và nhấn <strong>Ctrl + V</strong> (hoặc <strong>Cmd + V</strong>) để dán dữ liệu vào ngay!
            </p>
          </div>
        )}

        {/* Options Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Option 1: Google Sheets Copy & Launch */}
          <div
            onClick={handleCopyForGoogleSheets}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '16px',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🔵</span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#60a5fa' }}>
                  Copy & Mở Google Sheets (Bấm Ctrl+V Để Dán)
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Copy {expenses.length} giao dịch (đã định dạng dấu phẩy tiền) & mở Google Sheets. Bấm <strong>Ctrl+V</strong> để dán!
              </p>
            </div>
            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#60a5fa' }}>
              {copied ? <Check size={20} /> : <ExternalLink size={20} />}
            </div>
          </div>

          {/* Option 2: Download CSV for Google Drive */}
          <div
            onClick={handleDownloadCSV}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Tải File CSV Cho Google Drive
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Tải file `.csv` có định dạng dấu phẩy phân cách ngàn để kéo thả vào Google Drive
              </p>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', color: 'var(--text-muted)' }}>
              <Download size={20} />
            </div>
          </div>

          {/* Option 3: Microsoft Excel (.xlsx) */}
          <div
            onClick={handleExportExcel}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🟢</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#34d399' }}>
                  Tải File Microsoft Excel (.xlsx)
                </h3>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '28px' }}>
                Xuất file Excel có màu sắc và cột phân cách ngàn chuẩn hóa
              </p>
            </div>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#34d399' }}>
              <Download size={20} />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
