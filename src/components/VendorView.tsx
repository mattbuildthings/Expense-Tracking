import React, { useState } from 'react';
import { Users, HardHat, Boxes, Armchair, Briefcase, Search, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import type { ExpenseItem, ExpenseCategory } from '../types/expense';
import { formatVND, removeVietnameseTones, exportVendorsToExcel } from '../services/storageService';

export type VendorType = 'thợ_thi_công' | 'cung_cấp_vlxd' | 'cung_cấp_thiết_bị_nội_thất' | 'cung_cấp_dịch_vụ_khác';

export const VENDOR_TYPES_METADATA: Record<VendorType, { label: string; icon: any; color: string; bg: string }> = {
  thợ_thi_công: {
    label: 'Thợ Thi Công',
    icon: HardHat,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)'
  },
  cung_cấp_vlxd: {
    label: 'Cung Cấp VLXD',
    icon: Boxes,
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)'
  },
  cung_cấp_thiết_bị_nội_thất: {
    label: 'Cung Cấp Thiết Bị Nội Thất',
    icon: Armchair,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)'
  },
  cung_cấp_dịch_vụ_khác: {
    label: 'Cung Cấp Dịch Vụ Khác',
    icon: Briefcase,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)'
  }
};

export interface VendorSummary {
  name: string;
  type: VendorType;
  totalPaid: number;
  transactionCount: number;
  totalManDays: number;
  categories: Set<ExpenseCategory>;
  transactions: ExpenseItem[];
  phone?: string;
  bankAccount?: string;
}

interface VendorViewProps {
  projectName: string;
  allExpenses: ExpenseItem[];
  onSelectExpense: (item: ExpenseItem) => void;
}

export function autoClassifyVendorType(category: ExpenseCategory): VendorType {
  if (category === 'phần_thô_nhân_công' || category === 'hoàn_thiện_nhân_công') {
    return 'thợ_thi_công';
  }
  if (category === 'phần_thô_vật_tư' || category === 'hoàn_thiện_vật_tư') {
    return 'cung_cấp_vlxd';
  }
  if (category === 'nội_thất_thiết_bị') {
    return 'cung_cấp_thiết_bị_nội_thất';
  }
  return 'cung_cấp_dịch_vụ_khác';
}

export const VendorView: React.FC<VendorViewProps> = ({
  projectName,
  allExpenses,
  onSelectExpense
}) => {
  const [activeFilterType, setActiveFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendorName, setSelectedVendorName] = useState<string | null>(null);

  // Group all expenses by merchant name
  const vendorsMap = new Map<string, VendorSummary>();

  allExpenses.forEach(item => {
    const rawName = (item.merchant || 'Nhà cung cấp khác').trim();
    if (!rawName) return;

    const existing = vendorsMap.get(rawName);
    const itemType = autoClassifyVendorType(item.category);

    if (!existing) {
      const newSummary: VendorSummary = {
        name: rawName,
        type: itemType,
        totalPaid: item.amount,
        transactionCount: 1,
        totalManDays: item.manDays || 0,
        categories: new Set([item.category]),
        transactions: [item]
      };
      vendorsMap.set(rawName, newSummary);
    } else {
      existing.totalPaid += item.amount;
      existing.transactionCount += 1;
      existing.totalManDays += (item.manDays || 0);
      existing.categories.add(item.category);
      existing.transactions.push(item);

      // Prefer Thợ Thi Công or VLXD if mixed
      if (itemType === 'thợ_thi_công') existing.type = 'thợ_thi_công';
    }
  });

  const vendorsList = Array.from(vendorsMap.values()).sort((a, b) => b.totalPaid - a.totalPaid);

  // Filter vendors
  const filteredVendors = vendorsList.filter(v => {
    if (activeFilterType !== 'all' && v.type !== activeFilterType) return false;
    if (searchTerm) {
      const termNorm = removeVietnameseTones(searchTerm);
      const nameNorm = removeVietnameseTones(v.name);
      if (!nameNorm.includes(termNorm)) return false;
    }
    return true;
  });

  // Calculate totals for active filter
  const totalPaidInFilter = filteredVendors.reduce((sum, v) => sum + v.totalPaid, 0);
  const totalVendorsCount = filteredVendors.length;
  const totalManDaysInFilter = filteredVendors.reduce((sum, v) => sum + v.totalManDays, 0);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
      
      {/* Top Banner Card */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.12) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', padding: '6px 12px', fontSize: '0.85rem' }}>
                <Users size={14} /> Danh Mục Đối Tác
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Dự án {projectName}
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>
              👷 Danh Sách Thợ Thi Công & Nhà Cung Cấp
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Quản lý tổng tiền đã chi trả, số công thợ & bảng kê quyết toán theo 4 nhóm đối tác chuẩn
            </p>
          </div>

          <div className="no-print">
            <button
              className="btn btn-secondary"
              onClick={() => exportVendorsToExcel(allExpenses, projectName)}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
              title="Xuất danh sách nhà cung cấp & tổ thợ ra Excel"
            >
              <FileSpreadsheet size={18} />
              <span>Xuất Nhà Cung Cấp (Excel)</span>
            </button>
          </div>
        </div>

        {/* 4 Group Filter Tabs Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          
          <button
            onClick={() => setActiveFilterType('all')}
            className={`btn btn-sm ${activeFilterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Tất Cả ({vendorsList.length})
          </button>

          <button
            onClick={() => setActiveFilterType('thợ_thi_công')}
            className={`btn btn-sm ${activeFilterType === 'thợ_thi_công' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ background: activeFilterType === 'thợ_thi_công' ? '#10b981' : undefined }}
          >
            👷 Thợ Thi Công
          </button>

          <button
            onClick={() => setActiveFilterType('cung_cấp_vlxd')}
            className={`btn btn-sm ${activeFilterType === 'cung_cấp_vlxd' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ background: activeFilterType === 'cung_cấp_vlxd' ? '#3b82f6' : undefined }}
          >
            🏗️ Cung Cấp VLXD
          </button>

          <button
            onClick={() => setActiveFilterType('cung_cấp_thiết_bị_nội_thất')}
            className={`btn btn-sm ${activeFilterType === 'cung_cấp_thiết_bị_nội_thất' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ background: activeFilterType === 'cung_cấp_thiết_bị_nội_thất' ? '#f59e0b' : undefined }}
          >
            🛋️ Cung Cấp Thiết Bị Nội Thất
          </button>

          <button
            onClick={() => setActiveFilterType('cung_cấp_dịch_vụ_khác')}
            className={`btn btn-sm ${activeFilterType === 'cung_cấp_dịch_vụ_khác' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ background: activeFilterType === 'cung_cấp_dịch_vụ_khác' ? '#8b5cf6' : undefined }}
          >
            📋 Cung Cấp Dịch Vụ Khác
          </button>

        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Tiền Đã Thanh Toán</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginTop: '6px' }}>
            {formatVND(totalPaidInFilter)}
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Qua {totalVendorsCount} nhà cung cấp / tổ thợ</p>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #60a5fa' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tổng Số Công Thợ</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa', marginTop: '6px' }}>
            👷 {totalManDaysInFilter} Công Thợ
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>Phần thô & Hoàn thiện</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={18} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên tổ thợ, đơn vị cung cấp (VD: Anh Hùng, Sắt Hồng Phát)..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f8fafc',
            fontSize: '0.95rem',
            fontWeight: 600
          }}
        />
      </div>

      {/* Main Vendor Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredVendors.map(vendor => {
          const typeMeta = VENDOR_TYPES_METADATA[vendor.type] || VENDOR_TYPES_METADATA['cung_cấp_dịch_vụ_khác'];
          const IconComp = typeMeta.icon;
          const isSelected = selectedVendorName === vendor.name;

          return (
            <div
              key={vendor.name}
              onClick={() => setSelectedVendorName(isSelected ? null : vendor.name)}
              className="glass-card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                border: isSelected ? `2px solid ${typeMeta.color}` : '1px solid var(--border-color)',
                borderRadius: '16px',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              {/* Header Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span className="badge" style={{ background: typeMeta.bg, color: typeMeta.color, fontSize: '0.75rem', fontWeight: 800 }}>
                  <IconComp size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  {typeMeta.label}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                  {vendor.transactionCount} hóa đơn
                </span>
              </div>

              {/* Vendor Name */}
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                {vendor.name}
              </h3>

              {/* Total Paid */}
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
                {formatVND(vendor.totalPaid)}
              </p>

              {/* Man days info if applicable */}
              {vendor.totalManDays > 0 && (
                <p style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: 700, marginBottom: '8px' }}>
                  👷 Tổng {vendor.totalManDays} công thợ đã ghi nhận
                </p>
              )}

              {/* Expand Hint Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {isSelected ? 'Đóng chi tiết' : 'Xem lịch sử giao dịch'}
                </span>
                {isSelected ? <ChevronUp size={16} color={typeMeta.color} /> : <ChevronDown size={16} color="var(--text-dim)" />}
              </div>

              {/* Expanded Vendor Transaction History */}
              {isSelected && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', marginBottom: '4px' }}>
                    🧾 Lịch Sử Chi Trả Cho {vendor.name}:
                  </h4>
                  {vendor.transactions.map(tx => (
                    <div
                      key={tx.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectExpense(tx);
                      }}
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>{formatVND(tx.amount)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• {tx.date}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {tx.note} {tx.subCategory ? `(↳ ${tx.subCategory})` : ''}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>
                        Sửa ➔
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
