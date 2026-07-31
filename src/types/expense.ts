export type ExpenseCategory =
  | 'pháp_lý'                // Pháp lý (Legal & Permitting)
  | 'tư_vấn_thiết_kế'        // Tư vấn & Thiết kế (Consultancy & Design)
  | 'phần_thô_nhân_công'     // Phần Thô & Kết Cấu — Nhân Công (Shell & Structure — Labor)
  | 'phần_thô_vật_tư'        // Vật Tư Phần Thô & Kết Cấu (Shell & Structure — Materials)
  | 'hoàn_thiện_nhân_công'   // Hoàn Thiện — Nhân Công (Finishes — Labor)
  | 'hoàn_thiện_vật_tư'      // Vật Tư Hoàn Thiện (Finishes — Materials)
  | 'nội_thất_thiết_bị'      // Thiết Bị Nội Thất (FF&E & Equipment)
  | 'quản_lý_dự_án'          // Quản Lý Dự Án (Project Management & Site Soft Costs)
  | 'chi_phí_khác';           // Chi Phí Khác (Sundry & Miscellaneous)

export type PaymentMethod = 'chuyển_khoản' | 'tiền_mặt';

export type VerificationStatus = 'đã_xác_minh' | 'cần_kiểm_tra';

export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly' | 'all';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Total amount in VND
  quantity?: number;
  unit?: string;
  unitCost?: number;
  category: ExpenseCategory;
  subCategory?: string;
  merchant: string;
  note: string;
  manDays?: number;
  manHours?: number;
  paymentMethod: PaymentMethod;
  imageUrl?: string;
  imageType?: 'receipt' | 'bank_transfer' | 'handwritten';
  status: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  confidenceScore: number;
  aiReasoning?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  expenseId: string;
  expenseSnapshot: ExpenseItem;
  description: string;
}

export interface FilterOptions {
  searchTerm: string;
  category: string; // 'all' or ExpenseCategory
  status: string; // 'all' | 'đã_xác_minh' | 'cần_kiểm_tra'
  paymentMethod: string; // 'all' | 'chuyển_khoản' | 'tiền_mặt'
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  minAmount?: number;
  maxAmount?: number;
  minQuantity?: number;
  maxQuantity?: number;
  subCategorySearch?: string;
  merchantSearch?: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  label: string;
  icon: string;
  totalAmount: number;
  count: number;
  percentage: number;
  totalManDays?: number;
}

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  label: string; // e.g. "Tháng 7/2026"
  totalAmount: number;
  itemCount: number;
  manDays: number;
}

export interface MultiPeriodReport {
  periodType: ReportPeriod;
  periodLabel: string; // e.g. "Toàn Bộ Dự Án 12 Tháng (2026)"
  startDate: string;
  endDate: string;
  totalAmount: number;
  itemCount: number;
  pendingCount: number;
  totalManDaysRecorded: number;
  categoryBreakdown: CategorySummary[];
  monthlyBreakdown: MonthlySummary[];
  topExpenses: ExpenseItem[];
  flaggedExpenses: ExpenseItem[];
  aiExecutiveSummary: string;
}

export interface WeeklyReport {
  weekLabel: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  itemCount: number;
  pendingCount: number;
  totalManDaysRecorded: number;
  categoryBreakdown: CategorySummary[];
  topExpenses: ExpenseItem[];
  flaggedExpenses: ExpenseItem[];
  aiExecutiveSummary: string;
}

export const CATEGORY_METADATA: Record<ExpenseCategory, { label: string; englishLabel: string; iconName: string; color: string; bg: string; examples: string[] }> = {
  pháp_lý: {
    label: 'Pháp lý',
    englishLabel: 'Legal & Permitting',
    iconName: 'Scale',
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)',
    examples: ['GPXD', 'Thẩm duyệt PCCC', 'Đăng ký môi trường', 'Phí thanh tra', 'Thông báo giải phóng mặt bằng']
  },
  tư_vấn_thiết_kế: {
    label: 'Tư vấn & Thiết kế',
    englishLabel: 'Consultancy & Design',
    iconName: 'Compass',
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    examples: ['Thiết kế kiến trúc/kết cấu/ME/nội thất', 'Khoan khảo sát địa chất', 'Tư vấn giám sát (TVGS)']
  },
  phần_thô_nhân_công: {
    label: 'Phần Thô — Nhân Công',
    englishLabel: 'Shell & Structure — Labor',
    iconName: 'HardHat',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    examples: ['Thợ ép cọc/móng', 'Thợ làm khung kết cấu', 'Thợ xây tô', 'Thợ chống thấm']
  },
  phần_thô_vật_tư: {
    label: 'Phần Thô — Vật Tư',
    englishLabel: 'Shell & Structure — Materials',
    iconName: 'Boxes',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.15)',
    examples: ['Sắt thép/Rebar', 'Bê tông tươi', 'Gạch', 'Cát', 'Xi măng', 'Cốp pha', 'Hóa chất chống thấm']
  },
  hoàn_thiện_nhân_công: {
    label: 'Hoàn Thiện — Nhân Công',
    englishLabel: 'Finishes — Labor',
    iconName: 'Users',
    color: '#14b8a6',
    bg: 'rgba(20, 184, 166, 0.15)',
    examples: ['Thợ ốp lát gạch', 'Thợ sơn nước', 'Thợ đóng trần thạch cao', 'Thợ điện nước ME', 'Thợ lắp cửa/kính']
  },
  hoàn_thiện_vật_tư: {
    label: 'Hoàn Thiện — Vật Tư',
    englishLabel: 'Finishes — Materials',
    iconName: 'Paintbrush',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    examples: ['Gạch ốp lát', 'Sơn nước & bột trét', 'Tấm thạch cao', 'Thiết bị vệ sinh', 'Dây điện & công tắc', 'Ống nước']
  },
  nội_thất_thiết_bị: {
    label: 'Thiết Bị Nội Thất (FF&E)',
    englishLabel: 'FF&E & Equipment',
    iconName: 'Armchair',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    examples: ['Tủ kệ âm tường', 'Bàn ghế sofa', 'Giường nệm', 'Thiết bị bếp/bar', 'Máy lạnh/HVAC', 'Bình nước nóng', 'Khóa thông minh']
  },
  quản_lý_dự_án: {
    label: 'Quản Lý Dự Án',
    englishLabel: 'Project Management & Site Costs',
    iconName: 'Briefcase',
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    examples: ['Lán trại văn phòng site', 'Điện nước tạm thi công', 'Lương bảo vệ site', 'Bảo hiểm CAR', 'Đồ bảo hộ lao động']
  },
  chi_phí_khác: {
    label: 'Chi Phí Khác',
    englishLabel: 'Sundry & Miscellaneous',
    iconName: 'HelpCircle',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    examples: ['Tiếp khách công trình', 'Quan hệ hàng xóm/địa phương', 'Chi phí vận chuyển nhỏ', 'Phát sinh vặt']
  }
};
