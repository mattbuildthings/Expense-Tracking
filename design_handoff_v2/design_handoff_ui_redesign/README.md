# Handoff: Expense Tracker UI/UX Redesign

## Overview
A visual redesign of all 5 tabs of the Expense Tracking & BVA Construction Management app (Ledger, Saturday Report, BVA Budget, Vendors, Cash Flow), plus the top navigation shell. Goals: a cleaner visual system, a light theme optimized for outdoor/sunlight readability with a dark theme toggle, and a real mobile navigation pattern (bottom tab bar) to replace the old wrapping desktop tab row.

## About the Design Files
The bundled file `Ledger Redesign.dc.html` is a **design reference built in HTML/React**, not production code to copy directly. It's a functioning prototype (with sample/mock data) showing layout, styling, and interaction — open it in a browser to see and click through it. The task is to **recreate this design inside the existing Vite + React + TypeScript codebase**, using the existing component structure (`src/components/*.tsx`), existing services (`storageService.ts`, `aiService.ts`, `supabaseClient.ts`), and existing data types (`src/types/expense.ts`) — not to port the HTML/JS wholesale.

## Fidelity
**High-fidelity.** Colors, spacing, typography, and layout are intended to be final. Implement pixel-accurately using the tokens below. Sample data in the prototype should be replaced with the app's real data via the existing hooks/services in `App.tsx`.

## Global Changes

### 1. Light/dark theme toggle
The app currently only has a dark theme (`src/index.css` `:root`). Add a light theme optimized for outdoor/sunlight legibility — high contrast, no translucent glass/blur, darker accent colors for AA contrast on white. Persist the choice (e.g. localStorage) and add a toggle button (sun/moon icon) in the navbar.

**Light theme tokens** (new):
```
--bg-main-light: #f3f5f8
--bg-card-light: #ffffff
--bg-card-alt-light: #f8fafc
--bg-input-light: #ffffff
--border-color-light: #dfe4ea
--border-strong-light: #c7cfd9
--text-main-light: #0f172a
--text-muted-light: #475569
--text-dim-light: #64748b
--primary-light: #2563eb
--primary-hover-light: #1d4ed8
--success-light: #047857
--warning-light: #b45309
--danger-light: #dc2626
```
Category/chart accent colors also get darkened variants for light mode (see Design Tokens below) — same hues, ~AA-contrast-safe shades on white.

**Dark theme** keeps existing `src/index.css` tokens (`--bg-main: #0b0f19`, `--primary: #3b82f6`, `--success: #34d399` etc.) — no change needed there.

### 2. Mobile navigation: bottom tab bar
Below 860px viewport width, replace the wrapping top tab row with a fixed bottom tab bar (5 icons + short labels: Sổ Chi, Báo Cáo, BVA, Nhà CC, Dòng Tiền), 62px tall, sticky to viewport bottom, icons only (no text truncation issues). Desktop (≥860px) keeps a horizontal top tab row, restyled (see Navbar section).

### 3. Icons: drop emoji, use line icons
All emoji in labels and badges (📋 🎯 👷 💰 🏦 💵 ⚠️ 🟢 etc.) are replaced with `lucide-react` icons already imported in most files (`AlertTriangle`, `CheckCircle2`, `Landmark`, `Wallet`, etc.) — just remove the emoji character adjacent to the icon component, since the icon is already rendered. Vietnamese text content is unchanged (verbatim).

### 4. Two-size type scale
Every font size in the app was normalized to exactly two values: a **heading** size (`0.95rem` / ~15px) for titles, stat values, and emphasized numbers, and a **body** size (`0.75rem` / ~12px) for labels, meta text, badges, and buttons. No other font sizes should appear anywhere in the implementation — pick heading vs. body per element based on its role, not its old size.

### 5. Three-color semantic palette
Button and status colors were consolidated down to three semantic colors plus neutral gray — drop the old amber/indigo/cyan usages entirely:
- **Primary (blue)** — main actions, active tab/nav state, links, all former indigo/cyan accents (secondary buttons, quote amounts, contract values, budget inputs).
- **Success (green)** — positive amounts, verified/paid/signed status, deposits.
- **Danger (red)** — delete actions, over-budget, low-cash warning, the lock-app button, pending labor payout.
- **Neutral gray** (`textDim` / `borderStrong`) — informational "needs review / unverified" states (e.g. the pending-verification badge, the FF&E category accent) that aren't urgent enough for red.
- The `warning` token and `chartCyan`/`chartAmber` tokens were removed from the theme entirely.
- The 9-category color-coding in the ledger table/badges (indigo, violet, emerald, blue, teal, cyan, amber, pink, slate — see Design Tokens) is **unchanged** — that's a deliberate category identity system, not decorative color bloat, and should stay as-is.

### 6. Compact mobile header
On mobile (<860px), the sticky top header is now deliberately minimal so it doesn't crowd out content below the fold:
- Logo shrinks from 42px to 28px; header padding drops from `14px 20px` to `8px 12px`.
- The AI badge, subtitle, and the total-cost/pending-review metric box are hidden on mobile entirely (that data is already visible in the BVA overview panel below).
- The 5 header action buttons go icon-only on mobile (labels hidden, `title` attribute retained for accessibility) and sit in a single non-wrapping, horizontally-scrollable row instead of wrapping to multiple lines.
- Result: the fixed header occupies roughly ¼ or less of the viewport height on a typical phone, leaving the remaining space for scrollable content.

## Screens / Views

### Ledger (`ExpenseLedger.tsx` + `Navbar.tsx` + `App.tsx` shell)
- **Header**: logo (rounded gradient square, hard-hat icon) + project name + subtitle "AI Quản Lý Chi Phí Công Trình". Right side: two-stat metric box (Tổng Chi Phí / Cần Xác Minh, desktop only) + theme toggle button.
- **Action row**: primary button "Thêm Ảnh / Hóa Đơn" (gradient blue), secondary buttons "Tạo Hóa Đơn", "Nhập Báo Giá / HĐ" (indigo tint), icon-only buttons for history/settings/lock.
- **Nav tabs**: Chi Phí, Báo Cáo, Ngân Sách, Nhà Cung Cấp & Thợ, Dòng Tiền & Quỹ — desktop horizontal tabs (active tab = solid accent color pill, per-tab accent: ledger blue, report green, budget indigo, vendors teal, cash flow violet); mobile bottom bar with same accents on active icon+label.
- **BVA overview panel**: 3 stat cards (Tổng Chi Phí Thực Tế / Dự Toán Ngân Sách / Ngân Sách Còn Lại) in a tinted panel, + 3 cash-position pill rows (bank / cash / total available).
- **Category breakdown**: 5 mini-cards with colored left border + small icon, matching the 4 sample categories shown + "Cần Rà Soát" pending count card.
- **Filter toolbar**: search input on its own full-width row; below it, status `<select>`, "Bộ Lọc..." toggle (expands date/amount range inputs), reset icon button, export button (green tint) — all in a second row. Category filter chip grid (9 categories + "Tất cả") below that.
- **Selection bar**: appears when rows are checked — "Xác Minh" (green) / "Xóa Đã Chọn" (red) actions.
- **List**: card list on mobile, full data table on desktop (checkbox, thumbnail, date, qty, unit cost, amount, category badge, merchant, payment method, status badge, row actions).

### Báo Cáo / Saturday Report (`SaturdayReportView.tsx`)
- Tinted banner (green/blue gradient tint) with period-label pill + title + 4 period-toggle buttons (Tuần / Tháng / Quý / Toàn Bộ Dự Án).
- Conditional over-budget alert card (red, 2px border) listing categories where actual > budget.
- Conditional "flagged for review" card (amber border) — list of `status === 'cần_kiểm_tra'` items, clickable to open detail.
- AI executive summary card (left border accent, sparkle icon) — short paragraph.
- 3 stat cards: total spend, top category by spend + %, total man-days recorded.
- Accordion list, one row per category: colored dot + label + over-budget badge, "Dự toán: X · Còn lại: Y" meta line, right-aligned actual amount + "Đã dùng N% dự toán", progress bar (green <85%, amber 85–100%, red >100%), chevron toggle. Expanded panel lists that category's transactions.

### BVA Budget (`BudgetView.tsx`)
- Same banner pattern (indigo/blue tint), "BVA Cost Control" pill, title, "Chỉnh Sửa Dự Toán" button that toggles into edit mode → becomes "Lưu Hạn Mức Mới".
- Saved-success banner (green, transient) after saving.
- Same over-budget alert card pattern as Report.
- 3 KPI cards: total budget, total actual, total remaining (colored by over/under).
- Accordion per category (same visual language as Report), but:
  - Right side shows an editable budget input when in edit mode (unless the category has signed vendor quotations, in which case budget is contract-derived and not editable).
  - Expanded panel has two sub-sections: **quotations/contracts** (vendor name, status pill "Hợp Đồng Đã Ký"/"Báo Giá Dự Thảo", value/paid/remaining) above **logged transactions**.

### Nhà Cung Cấp / Vendors (`VendorView.tsx`)
- Banner (green/blue tint) + "Xuất Nhà Cung Cấp" export button.
- Filter row: "Tất Cả (N)" + 4 vendor-type filters (Thợ Thi Công / Cung Cấp VLXD / Cung Cấp Thiết Bị Nội Thất / Cung Cấp Dịch Vụ Khác), each with its own accent color.
- 2 KPI cards: total paid, total man-days.
- Search input (plain, icon-left).
- Responsive card grid (`minmax(300px,1fr)`), one card per vendor (grouped by merchant name): type badge, transaction count, vendor name, contract box (if signed quotation exists: value/paid/remaining) or plain total-paid, man-days line if applicable, expand footer toggling a transaction history list.

### Dòng Tiền / Cash Flow (`CashFlowView.tsx`)
- Banner (indigo/green tint) with wallet icon + title + 2 primary actions ("Nạp Vốn Mới" / "Rút Tiền Mặt" — open a modal in production; see Interactions).
- 4 KPI cards: bank balance, cash-on-hand balance, total liquid funds (status text), burn-rate weeks remaining.
- 2-column grid: (a) bank-vs-cash spend ratio with two horizontal progress bars, (b) labor payout forecast box + conditional low-cash warning (<15,000,000 VND).
- Capital transaction log: list of deposit/withdrawal entries with icon, type label, date, note, signed amount (+ green for deposit, blue for withdrawal), delete action.

## Interactions & Behavior
- **Theme toggle**: instant switch, no transition animation needed; persist in localStorage.
- **Responsive breakpoint**: 860px — below it, mobile card/list layouts + bottom tab bar; at/above it, desktop table + top tabs. Recreate as a CSS breakpoint (media query) in production rather than a JS resize listener (the prototype uses JS only because inline-style-only constraints in that tool).
- **Accordion rows** (Report & Budget): click category label or chevron to expand/collapse; only one open at a time is NOT required — the prototype allows any number open simultaneously, each tracked independently by category key.
- **Budget edit mode**: entering edit mode reveals inputs for categories without signed quotations; "Lưu Hạn Mức Mới" persists and shows a 2s success banner, then exits edit mode.
- **Vendor card expand**: click card to toggle transaction history; clicking a transaction row inside must stop propagation so it opens the detail modal instead of collapsing the card.
- **Toasts**: the prototype shows a small top-center toast for not-yet-wired actions (upload, settings, etc.) — in production these should trigger their real modals/flows instead.
- **Selection + batch actions**: checkbox selection on the ledger table drives a floating action bar (verify/delete selected).

## State Management
Per view, track:
- `theme: 'light' | 'dark'`
- Ledger: `searchTerm`, `statusFilter`, `categoryFilter`, `showAdvancedFilters`, `selectedIds`, `currentPage` (pagination exists in the real app; the prototype omits it for its small sample set — keep pagination in production)
- Report: `selectedPeriod`, `expandedCategories` (map of category → bool)
- Budget: `isEditing`, `budgets` (draft map), `savedSuccess`, `expandedCategories`
- Vendors: `activeFilterType`, `searchTerm`, `selectedVendorName`
- Cash Flow: modal open/closed + form fields for new capital transactions (amount, date, type, note)

Data fetching/derivation should continue to flow through the existing `storageService.ts` functions (`getExpenses`, `generateMultiPeriodReport`, `getCategoryBudgets`, `getVendorQuotations`, `getCapitalTransactions`, `formatVND`, etc.) — the redesign changes presentation only, not data flow.

## Design Tokens

### Light theme
| Token | Value |
|---|---|
| Background | `#f3f5f8` |
| Card | `#ffffff` |
| Card (alt/tinted) | `#eef1f6` |
| Input background | `#ffffff` |
| Border | `#d5dbe3` |
| Border (strong) | `#b8c2ce` |
| Text main | `#0f172a` |
| Text muted | `#475569` |
| Text dim | `#64748b` |
| Primary | `#2563eb` (hover `#1d4ed8`) |
| Success | `#047857` |
| Danger | `#dc2626` |

### Dark theme
| Token | Value |
|---|---|
| Background | `#0b0f19` |
| Card | `rgba(23,32,54,0.9)` |
| Card (alt/tinted) | `rgba(255,255,255,0.06)` |
| Input background | `#131b2e` |
| Border | `rgba(255,255,255,0.14)` |
| Border (strong) | `rgba(255,255,255,0.24)` |
| Text main | `#f8fafc` |
| Text muted | `#94a3b8` |
| Text dim | `#64748b` |
| Primary | `#3b82f6` (hover `#2563eb`) |
| Success | `#34d399` |
| Danger | `#f87171` |

There is no `warning`, `chartCyan`, or `chartAmber` token — those were removed; see "Three-color semantic palette" above for how those cases now map to primary/danger/neutral.

### Category accent colors (light mode text / dark mode text)
| Category | Base hue | Light text | Dark text |
|---|---|---|---|
| Pháp lý | Indigo | `#4338ca` | `#818cf8` |
| Tư vấn & Thiết kế | Violet | `#6d28d9` | `#a78bfa` |
| Phần Thô — Nhân Công | Emerald | `#047857` | `#34d399` |
| Phần Thô — Vật Tư | Blue | `#1d4ed8` | `#60a5fa` |
| Hoàn Thiện — Nhân Công | Teal | `#0f766e` | `#2dd4bf` |
| Hoàn Thiện — Vật Tư | Cyan | `#0e7490` | `#22d3ee` |
| Thiết Bị Nội Thất | Amber | `#b45309` | `#fbbf24` |
| Quản Lý Dự Án | Pink | `#be185d` | `#f472b6` |
| Chi Phí Khác | Slate | `#475569` | `#cbd5e1` |

### Typography
Font: `'Plus Jakarta Sans'` (already loaded in `src/index.css`), weights 400–900. Exactly two font sizes app-wide: **heading** `0.95rem` (~15px, weight 800) for titles/stat values/emphasized amounts, and **body** `0.75rem` (~12px, weight 600–700) for labels, meta text, badges, and buttons. Section labels (uppercase, letter-spacing 0.04–0.05em) use the body size.

### Radius & spacing
Card radius: 16px (small cards 10–14px). Pill/badge radius: 999px. Standard card padding: 18–24px. Grid gaps: 8–20px depending on density.

### Shadows
Light theme: avoid heavy shadows/blur (outdoor legibility) — rely on 1px borders for separation. Dark theme keeps existing soft glow shadows from `index.css`.

## Assets
No new image assets. Icons: replace emoji with the `lucide-react` icons already imported per file (see each component's existing `import { ... } from 'lucide-react'` line) — add `Sun`/`Moon` for the new theme toggle.

## Screenshots
See `screenshots/` — `ledger-light.png`, `report-light.png`, `budget-light.png`, `vendors-light.png`, `cashflow-light.png`, and `ledger-dark.png` (dark theme sample).

## Files
- `Ledger Redesign.dc.html` — interactive design reference (open in any browser). Covers all 5 tabs plus the navbar/theme-toggle shell.
- Corresponding real source to modify: `src/components/ExpenseLedger.tsx`, `src/components/Navbar.tsx`, `src/components/SaturdayReportView.tsx`, `src/components/BudgetView.tsx`, `src/components/VendorView.tsx`, `src/components/CashFlowView.tsx`, `src/App.tsx`, `src/index.css`, `src/App.css`.
