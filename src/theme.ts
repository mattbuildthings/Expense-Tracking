import type { ExpenseCategory } from './types/expense';

/**
 * Maps each expense category to its CSS custom-property accent color.
 * The variable itself resolves to a light- or dark-mode-appropriate
 * shade automatically via the `html[data-theme="..."]` blocks in index.css.
 */
const CATEGORY_ACCENT_VAR: Record<ExpenseCategory, string> = {
  pháp_lý: 'var(--cat-legal)',
  tư_vấn_thiết_kế: 'var(--cat-design)',
  phần_thô_nhân_công: 'var(--cat-shell-labor)',
  phần_thô_vật_tư: 'var(--cat-shell-material)',
  hoàn_thiện_nhân_công: 'var(--cat-finish-labor)',
  hoàn_thiện_vật_tư: 'var(--cat-finish-material)',
  nội_thất_thiết_bị: 'var(--cat-furniture)',
  quản_lý_dự_án: 'var(--cat-management)',
  chi_phí_khác: 'var(--cat-other)'
};

export function categoryAccent(category: ExpenseCategory): string {
  return CATEGORY_ACCENT_VAR[category] || 'var(--text-muted)';
}

/** Progress-bar fill color by budget-usage thresholds (matches design spec). */
export function budgetBarColor(spent: number, target: number): string {
  if (target > 0 && spent > target) return 'var(--danger)';
  const pct = target > 0 ? (spent / target) * 100 : 0;
  if (pct >= 85) return 'var(--accent-amber)';
  return 'var(--success)';
}
