# Expense Tracking & BVA Construction Management System

## Project Overview
A web-based Expense Tracking, BVA Budgeting, Cash Flow, and Vendor Management application for construction projects in Vietnam. Built with React (TypeScript), Vite, Lucide React, and Vercel.

## Quick Commands
- **Development Server**: `npm run dev` (Runs locally on `http://localhost:5173/`)
- **Production Build**: `npm run build` (`tsc -b && vite build`)
- **Preview Build**: `npm run preview`
- **Vercel Direct Deploy**: `npx vercel --prod`

## Key Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS / Glassmorphism UI
- **Icons**: `lucide-react`
- **AI Vision OCR**: Google Gemini 1.5 Flash / Pro API (Direct client call + Vercel Serverless `/api/ocr`)
- **Backend / Sync**: LocalStorage + IndexedDB image backup + Supabase cloud DB sync

## Core Architecture & File Map
- `src/types/expense.ts`: Data interfaces (`ExpenseItem`, `ExpenseCategory`, `VendorQuotation`, `CapitalTransaction`, `AuditLogEntry`).
- `src/services/storageService.ts`: LocalStorage management, IndexedDB photo storage, CSV/XLSX export functions, vendor quota calculations.
- `src/services/aiService.ts`: Gemini Vision 1.5/2.0 AI OCR parser with multi-model fallback and construction receipt prompt.
- `src/services/supabaseClient.ts`: Supabase cloud sync client and real-time listeners.
- `src/components/Navbar.tsx`: Main navigation bar with project name, liquidity status counters, and `+ Nhập Báo Giá / HĐ` action button.
- `src/components/ExpenseLedger.tsx`: Tab 1 — Transaction Ledger & Home view with filters, toolbar, and transaction table.
- `src/components/SaturdayReportView.tsx`: Tab 2 — Weekly Saturday Report view.
- `src/components/BudgetView.tsx`: Tab 3 — BVA (Budget vs Actual) construction category budgets & vendor quotation breakdown accordions.
- `src/components/VendorView.tsx`: Tab 4 — Vendor directory grouped into 4 contractor types with contract balance cards.
- `src/components/CashFlowView.tsx`: Tab 5 — Cash flow & liquidity management view tracking Bank vs. Cash on hand.
- `src/components/ExportModal.tsx`: Universal 4-option export modal (Google Sheets TSV copy, CSV download, Excel XLSX download, Print/PDF).
- `src/components/QuotationModal.tsx`: Vendor quotation & contract creation modal.
- `src/components/UploadModal.tsx`: Receipt photo / Zalo screenshot AI Vision uploader & review screen.
- `src/components/SettingsModal.tsx`: System settings modal for PIN security, Gemini API Key, and Supabase cloud sync keys.
- `api/ocr.ts`: Vercel Serverless API proxy for Gemini OCR.

## Critical Rules & Guidelines
1. **Never bump storage keys without a migration path**: Keep data backwards compatible with legacy keys (`build_expenses_data_v7`).
2. **Amount field is authoritative**: Amount is always the primary field on an expense row. Quantity and unit cost may recalculate each other, but never silently overwrite user-entered total amount.
3. **Full Resolution Image for OCR**: Always pass uncompressed raw base64 to `parseInvoiceWithAI` for maximum OCR accuracy.
