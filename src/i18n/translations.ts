// Bilingual UI-chrome translations (English / Vietnamese).
// Scope: static interface text only — labels, buttons, headings, status text.
// User-entered data (merchant names, notes, project name) is never translated.

export const translations = {
  en: {
    // Navbar
    'nav.subtitle': 'AI Construction Expense Manager',
    'nav.totalCost': 'Total Cost',
    'nav.needsReview': 'Needs Review',
    'nav.themeToLight': 'Switch to light theme',
    'nav.themeToDark': 'Switch to dark theme',
    'nav.langToggle': 'Switch to Vietnamese',
    'nav.langToggleFromVi': 'Switch to English',
    'nav.addPhoto': 'Add Photo / Receipt',
    'nav.createInvoice': 'Create Invoice',
    'nav.createInvoiceTitle': 'Create a manual invoice when no receipt photo is available',
    'nav.importQuote': 'Import Quote / Contract',
    'nav.importQuoteTitle': "Import a vendor's quotation or detailed contract",
    'nav.history': 'History & Trash',
    'nav.historyTitle': 'Transaction history & trash recovery',
    'nav.settings': 'Settings',
    'nav.settingsTitle': 'Gemini AI key & project name settings',
    'nav.lockAppTitle': 'Lock the app immediately',
    'nav.tab.ledger': 'Expenses',
    'nav.tab.ledgerShort': 'Ledger',
    'nav.tab.ledgerTitle': 'Expense Ledger',
    'nav.tab.report': 'Report',
    'nav.tab.budget': 'Budget',
    'nav.tab.budgetShort': 'BVA',
    'nav.tab.budgetTitle': 'Budget vs. Actual (BVA)',
    'nav.tab.vendors': 'Vendors & Crews',
    'nav.tab.vendorsShort': 'Vendors',
    'nav.tab.vendorsTitle': 'Vendors & Work Crews',
    'nav.tab.cashflow': 'Cash Flow & Funds',
    'nav.tab.cashflowShort': 'Cash Flow'
  },
  vi: {
    // Navbar
    'nav.subtitle': 'AI Quản Lý Chi Phí Công Trình',
    'nav.totalCost': 'Tổng Chi Phí',
    'nav.needsReview': 'Cần Xác Minh',
    'nav.themeToLight': 'Chuyển sang giao diện sáng',
    'nav.themeToDark': 'Chuyển sang giao diện tối',
    'nav.langToggle': 'Chuyển sang Tiếng Việt',
    'nav.langToggleFromVi': 'Chuyển sang Tiếng Anh',
    'nav.addPhoto': 'Thêm Ảnh / Hóa Đơn',
    'nav.createInvoice': 'Tạo Hóa Đơn',
    'nav.createInvoiceTitle': 'Tạo hóa đơn thủ công khi không có ảnh đính kèm',
    'nav.importQuote': 'Nhập Báo Giá / HĐ',
    'nav.importQuoteTitle': 'Nhập báo giá hoặc hợp đồng chi tiết với nhà cung cấp',
    'nav.history': 'Lịch Sử & Thùng Rác',
    'nav.historyTitle': 'Lịch sử giao dịch & Thùng rác khôi phục',
    'nav.settings': 'Cài Đặt',
    'nav.settingsTitle': 'Cài đặt chìa khóa AI Gemini & Tên công trình',
    'nav.lockAppTitle': 'Khóa ứng dụng ngay lập tức',
    'nav.tab.ledger': 'Chi Phí',
    'nav.tab.ledgerShort': 'Sổ Chi',
    'nav.tab.ledgerTitle': 'Sổ Ghi Chép Chi Phí (Ledger)',
    'nav.tab.report': 'Báo Cáo',
    'nav.tab.budget': 'Ngân Sách',
    'nav.tab.budgetShort': 'BVA',
    'nav.tab.budgetTitle': 'Dự Toán Ngân Sách (BVA)',
    'nav.tab.vendors': 'Nhà Cung Cấp & Thợ',
    'nav.tab.vendorsShort': 'Nhà CC',
    'nav.tab.vendorsTitle': 'Nhà Cung Cấp & Tổ Thợ',
    'nav.tab.cashflow': 'Dòng Tiền & Quỹ',
    'nav.tab.cashflowShort': 'Dòng Tiền'
  }
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)['en'];
