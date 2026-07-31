import * as XLSX from 'xlsx';
import { CATEGORY_METADATA } from '../types/expense';
import type { ExpenseItem, WeeklyReport, AuditLogEntry, FilterOptions, MultiPeriodReport, ReportPeriod, MonthlySummary } from '../types/expense';
import { getSupabaseClient } from './supabaseClient';

const STORAGE_KEY = 'build_expenses_data_v7';
const AUDIT_LOG_KEY = 'build_expenses_audit_logs_v2';
const PROJECT_NAME_KEY = 'build_project_name';
const LEGACY_PIN_CODE_KEY = 'build_expenses_pin_code';
const PIN_HASH_KEY = 'build_expenses_pin_hash';
const PIN_ENABLED_KEY = 'build_expenses_pin_enabled';
const PIN_SALT = 'construction_expense_pin_salt_v1_2026';

export const INITIAL_PROJECT_NAME = 'Quản Lý Chi Phí';

// Vietnamese Diacritic Accent Normalizer (e.g. "Minh Ngọc" -> "minh ngoc")
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

// SHA-256 Salted Hashing for PIN Passcode
export async function hashPinCode(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${PIN_SALT}:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredPinHash(): string | null {
  // Purge legacy plaintext PIN key if present in localStorage
  if (localStorage.getItem(LEGACY_PIN_CODE_KEY)) {
    localStorage.removeItem(LEGACY_PIN_CODE_KEY);
  }
  // NO '1234' FALLBACK! Returns null if no stored PIN hash exists.
  return localStorage.getItem(PIN_HASH_KEY);
}

export async function savePinCode(pin: string): Promise<void> {
  if (!pin || pin.trim() === '') return;
  const hash = await hashPinCode(pin.trim());
  localStorage.setItem(PIN_HASH_KEY, hash);
  localStorage.removeItem(LEGACY_PIN_CODE_KEY);
}

export async function verifyPinCode(enteredPin: string): Promise<boolean> {
  const storedHash = getStoredPinHash();
  if (!storedHash) return false;
  const enteredHash = await hashPinCode(enteredPin.trim());
  return storedHash === enteredHash;
}

export function isPinEnabled(): boolean {
  const val = localStorage.getItem(PIN_ENABLED_KEY);
  return val === 'true';
}

export function setPinEnabled(enabled: boolean): void {
  localStorage.setItem(PIN_ENABLED_KEY, enabled ? 'true' : 'false');
}

// IndexedDB Helper for local image backup
const DB_NAME = 'ConstructionExpensePhotosDB';
const STORE_NAME = 'photos';

function openPhotoDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePhotoToIndexedDB(id: string, base64Data: string): Promise<void> {
  try {
    const db = await openPhotoDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(base64Data, id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save image to IndexedDB:', err);
  }
}

// Upload receipt photo to Supabase Storage Bucket 'receipts'
export async function uploadPhotoToSupabase(fileBase64OrBlob: string, filename: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    let blob: Blob;
    if (fileBase64OrBlob.startsWith('data:')) {
      const response = await fetch(fileBase64OrBlob);
      blob = await response.blob();
    } else {
      blob = new Blob([fileBase64OrBlob], { type: 'image/jpeg' });
    }

    const path = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error } = await supabase.storage
      .from('receipts')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      console.warn('Supabase storage upload error:', error);
      return null;
    }

    const { data: publicData } = supabase.storage.from('receipts').getPublicUrl(path);
    return publicData.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to Supabase Storage:', err);
    return null;
  }
}

const INITIAL_EXPENSES: ExpenseItem[] = [];

function mapRowToExpense(row: any): ExpenseItem {
  return {
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    quantity: row.quantity !== null ? Number(row.quantity) : undefined,
    unit: row.unit || undefined,
    unitCost: row.unit_cost !== null ? Number(row.unit_cost) : undefined,
    category: row.category,
    subCategory: row.sub_category || undefined,
    merchant: row.merchant,
    note: row.note,
    manDays: row.man_days !== null ? Number(row.man_days) : undefined,
    paymentMethod: row.payment_method,
    imageUrl: row.image_url || undefined,
    imageType: row.image_type || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || undefined,
    confidenceScore: Number(row.confidence_score || 95),
    aiReasoning: row.ai_reasoning || undefined
  };
}

function mapExpenseToRow(item: ExpenseItem) {
  return {
    id: item.id,
    date: item.date,
    amount: item.amount,
    quantity: item.quantity !== undefined ? item.quantity : null,
    unit: item.unit || null,
    unit_cost: item.unitCost !== undefined ? item.unitCost : null,
    category: item.category,
    sub_category: item.subCategory || null,
    merchant: item.merchant,
    note: item.note,
    man_days: item.manDays !== undefined ? item.manDays : null,
    payment_method: item.paymentMethod,
    image_url: item.imageUrl || null,
    image_type: item.imageType || null,
    status: item.status,
    confidence_score: item.confidenceScore || 95,
    ai_reasoning: item.aiReasoning || null,
    created_at: item.createdAt || new Date().toISOString(),
    updated_at: item.updatedAt || new Date().toISOString(),
    deleted_at: item.deletedAt || null
  };
}

export async function fetchExpensesFromSupabase(): Promise<ExpenseItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error);
      return null;
    }

    const items = (data || []).map(mapRowToExpense);
    saveExpensesLocally(items);
    return items.filter(i => !i.deletedAt);
  } catch (err) {
    console.error('Failed to fetch from Supabase:', err);
    return null;
  }
}

export function saveExpensesLocally(expenses: ExpenseItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

// Backward-compatible data migration helper (Preserves data_v1 through v7)
function migrateAllLegacyKeys(): ExpenseItem[] {
  const legacyKeys = [
    'build_expenses_data_v7',
    'build_expenses_data_v6',
    'build_expenses_data_v5',
    'build_expenses_data_v4',
    'build_expenses_data_v3',
    'build_expenses_data_v2',
    'build_expenses_data_v1',
    'build_expenses_data'
  ];

  const itemsMap = new Map<string, ExpenseItem>();

  for (const key of legacyKeys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed: ExpenseItem[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (item && item.id && !itemsMap.has(item.id)) {
              itemsMap.set(item.id, item);
            }
          });
        }
      } catch (err) {
        console.warn(`Failed to parse legacy key ${key}:`, err);
      }
    }
  }

  const merged = Array.from(itemsMap.values());
  if (merged.length > 0) {
    saveExpensesLocally(merged);
  }
  return merged;
}

function migrateAllLegacyAuditLogs(): AuditLogEntry[] {
  const legacyAuditKeys = [
    'build_expenses_audit_logs_v2',
    'build_expenses_audit_logs_v1',
    'build_expenses_audit_logs'
  ];

  const logsMap = new Map<string, AuditLogEntry>();

  for (const key of legacyAuditKeys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed: AuditLogEntry[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach(log => {
            if (log && log.id && !logsMap.has(log.id)) {
              logsMap.set(log.id, log);
            }
          });
        }
      } catch (err) {
        console.warn(`Failed to parse legacy audit key ${key}:`, err);
      }
    }
  }

  const merged = Array.from(logsMap.values());
  if (merged.length > 0) {
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(merged));
  }
  return merged;
}

export function getAllExpensesIncludingDeleted(): ExpenseItem[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return migrateAllLegacyKeys();
  }
  try {
    const parsed: ExpenseItem[] = JSON.parse(data);
    if (parsed.length === 0) {
      return migrateAllLegacyKeys();
    }
    return parsed;
  } catch (err) {
    return migrateAllLegacyKeys();
  }
}

export function getExpenses(): ExpenseItem[] {
  const all = getAllExpensesIncludingDeleted();
  return all.filter(item => !item.deletedAt);
}

export function getDeletedExpenses(): ExpenseItem[] {
  const all = getAllExpensesIncludingDeleted();
  return all.filter(item => Boolean(item.deletedAt));
}

export function getAuditLogs(): AuditLogEntry[] {
  const logs = localStorage.getItem(AUDIT_LOG_KEY);
  if (!logs) {
    return migrateAllLegacyAuditLogs();
  }
  try {
    const parsed: AuditLogEntry[] = JSON.parse(logs);
    if (parsed.length === 0) {
      return migrateAllLegacyAuditLogs();
    }
    return parsed;
  } catch (err) {
    return migrateAllLegacyAuditLogs();
  }
}

export function addAuditLog(
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE',
  expenseSnapshot: ExpenseItem,
  description: string
): void {
  const logs = getAuditLogs();
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    action,
    expenseId: expenseSnapshot.id,
    expenseSnapshot,
    description
  };
  const updated = [entry, ...logs].slice(0, 200);
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('audit_logs').insert({
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      expense_id: entry.expenseId,
      expense_snapshot: entry.expenseSnapshot,
      description: entry.description
    }).then();
  }
}

export function addExpense(expense: ExpenseItem): ExpenseItem[] {
  const all = getAllExpensesIncludingDeleted();
  const updated = [expense, ...all];
  saveExpensesLocally(updated);
  addAuditLog('CREATE', expense, `Đã thêm chi phí mới: ${formatVND(expense.amount)} - ${expense.merchant}`);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('expenses').insert(mapExpenseToRow(expense)).then(({ error }) => {
      if (error) console.warn('Failed to insert expense into Supabase:', error);
    });
  }

  return getExpenses();
}

export function updateExpense(id: string, updates: Partial<ExpenseItem>): ExpenseItem[] {
  const all = getAllExpensesIncludingDeleted();
  let updatedItem: ExpenseItem | null = null;

  const updated = all.map(item => {
    if (item.id === id) {
      updatedItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
      addAuditLog('UPDATE', updatedItem, `Đã cập nhật chi phí ${updatedItem.id}: ${formatVND(updatedItem.amount)} - ${updatedItem.merchant}`);
      return updatedItem;
    }
    return item;
  });

  saveExpensesLocally(updated);

  if (updatedItem) {
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('expenses').update(mapExpenseToRow(updatedItem)).eq('id', id).then(({ error }) => {
        if (error) console.warn('Failed to update expense in Supabase:', error);
      });
    }
  }

  return getExpenses();
}

export function deleteExpense(id: string): ExpenseItem[] {
  const all = getAllExpensesIncludingDeleted();
  const target = all.find(i => i.id === id);
  if (!target) return getExpenses();

  const now = new Date().toISOString();
  const updated = all.map(item => (item.id === id ? { ...item, deletedAt: now, updatedAt: now } : item));
  saveExpensesLocally(updated);
  addAuditLog('DELETE', target, `Đã xóa chi phí ${target.id}: ${formatVND(target.amount)} - ${target.merchant} (Có thể khôi phục)`);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('expenses').update({ deleted_at: now, updated_at: now }).eq('id', id).then();
  }

  return getExpenses();
}

export function restoreExpense(id: string): ExpenseItem[] {
  const all = getAllExpensesIncludingDeleted();
  const target = all.find(i => i.id === id);
  if (!target) return getExpenses();

  const now = new Date().toISOString();
  const updated = all.map(item => {
    if (item.id === id) {
      const { deletedAt, ...rest } = item;
      return { ...rest, updatedAt: now };
    }
    return item;
  });
  saveExpensesLocally(updated);
  addAuditLog('RESTORE', target, `Đã khôi phục chi phí ${target.id}: ${formatVND(target.amount)} - ${target.merchant}`);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('expenses').update({ deleted_at: null, updated_at: now }).eq('id', id).then();
  }

  return getExpenses();
}

// Permanent Purge from Recycle Bin
export function permanentlyDeleteExpense(id: string): ExpenseItem[] {
  const all = getAllExpensesIncludingDeleted();
  const updated = all.filter(item => item.id !== id);
  saveExpensesLocally(updated);

  const supabase = getSupabaseClient();
  if (supabase) {
    supabase.from('expenses').delete().eq('id', id).then();
  }

  return getExpenses();
}

export function deleteBatchExpenses(ids: string[]): ExpenseItem[] {
  ids.forEach(id => deleteExpense(id));
  return getExpenses();
}

export function subscribeToSupabaseChanges(onUpdate: () => void) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('expenses_realtime_sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
      fetchExpensesFromSupabase().then(() => {
        onUpdate();
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Diacritic-insensitive and amount-matching precision filter engine
export function filterExpenses(expenses: ExpenseItem[], filters: FilterOptions): ExpenseItem[] {
  return expenses.filter(item => {
    // Basic text search with diacritic (NFD accent) removal + amount matching
    if (filters.searchTerm) {
      const rawTerm = filters.searchTerm.trim();
      const termNorm = removeVietnameseTones(rawTerm);
      const cleanDigits = rawTerm.replace(/[^0-9]/g, '');

      // 1. Match merchant, note, subcategory, ID with/without accents
      const matchMerchant = removeVietnameseTones(item.merchant).includes(termNorm);
      const matchNote = removeVietnameseTones(item.note).includes(termNorm);
      const matchSubCat = item.subCategory ? removeVietnameseTones(item.subCategory).includes(termNorm) : false;
      const matchId = removeVietnameseTones(item.id).includes(termNorm);

      // 2. Match exact numerical amount (e.g., typing "18500000" matches 18,500,000đ)
      const matchAmount = cleanDigits ? item.amount.toString().includes(cleanDigits) : false;

      if (!matchMerchant && !matchNote && !matchSubCat && !matchId && !matchAmount) {
        return false;
      }
    }

    if (filters.category && filters.category !== 'all' && item.category !== filters.category) {
      return false;
    }

    if (filters.status && filters.status !== 'all' && item.status !== filters.status) {
      return false;
    }

    if (filters.paymentMethod && filters.paymentMethod !== 'all' && item.paymentMethod !== filters.paymentMethod) {
      return false;
    }

    if (filters.startDate && item.date < filters.startDate) return false;
    if (filters.endDate && item.date > filters.endDate) return false;

    if (filters.minAmount !== undefined && item.amount < filters.minAmount) return false;
    if (filters.maxAmount !== undefined && item.amount > filters.maxAmount) return false;

    if (filters.minQuantity !== undefined && (item.quantity === undefined || item.quantity < filters.minQuantity)) return false;
    if (filters.maxQuantity !== undefined && (item.quantity === undefined || item.quantity > filters.maxQuantity)) return false;

    if (filters.subCategorySearch) {
      const subNorm = removeVietnameseTones(filters.subCategorySearch);
      if (!item.subCategory || !removeVietnameseTones(item.subCategory).includes(subNorm)) return false;
    }

    if (filters.merchantSearch) {
      const vNorm = removeVietnameseTones(filters.merchantSearch);
      if (!removeVietnameseTones(item.merchant).includes(vNorm)) return false;
    }

    return true;
  });
}

export function generateMultiPeriodReport(expenses: ExpenseItem[], period: ReportPeriod): MultiPeriodReport {
  let filtered = [...expenses];
  let periodLabel = 'Toàn Bộ Dự Án 12 Tháng (2026)';
  const now = new Date();

  if (period === 'weekly') {
    periodLabel = 'Báo Cáo Tuần Này';
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    filtered = expenses.filter(i => i.date >= weekAgoStr);
  } else if (period === 'monthly') {
    const monthKey = now.toISOString().slice(0, 7);
    periodLabel = `Báo Cáo Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
    filtered = expenses.filter(i => i.date.startsWith(monthKey));
  } else if (period === 'quarterly') {
    periodLabel = 'Báo Cáo Quý Này (3 Tháng Gần Nhất)';
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const tStr = threeMonthsAgo.toISOString().split('T')[0];
    filtered = expenses.filter(i => i.date >= tStr);
  }

  const totalAmount = filtered.reduce((sum, item) => sum + item.amount, 0);
  const itemCount = filtered.length;
  const pendingCount = filtered.filter(i => i.status === 'cần_kiểm_tra').length;
  const totalManDaysRecorded = filtered.reduce((sum, item) => sum + (item.manDays || 0), 0);

  const categoryTotals: Record<string, { amount: number; count: number; manDays: number }> = {};
  filtered.forEach(item => {
    if (!categoryTotals[item.category]) {
      categoryTotals[item.category] = { amount: 0, count: 0, manDays: 0 };
    }
    categoryTotals[item.category].amount += item.amount;
    categoryTotals[item.category].count += 1;
    categoryTotals[item.category].manDays += (item.manDays || 0);
  });

  const categoryBreakdown = Object.entries(CATEGORY_METADATA).map(([key, meta]) => {
    const stat = categoryTotals[key] || { amount: 0, count: 0, manDays: 0 };
    const percentage = totalAmount > 0 ? Math.round((stat.amount / totalAmount) * 100) : 0;
    return {
      category: key as any,
      label: meta.label,
      icon: meta.iconName,
      totalAmount: stat.amount,
      count: stat.count,
      percentage,
      totalManDays: stat.manDays
    };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  const monthlyMap: Record<string, { amount: number; count: number; manDays: number }> = {};
  expenses.forEach(item => {
    const mKey = item.date.slice(0, 7);
    if (!monthlyMap[mKey]) {
      monthlyMap[mKey] = { amount: 0, count: 0, manDays: 0 };
    }
    monthlyMap[mKey].amount += item.amount;
    monthlyMap[mKey].count += 1;
    monthlyMap[mKey].manDays += (item.manDays || 0);
  });

  const monthlyBreakdown: MonthlySummary[] = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mKey, data]) => {
      const [y, m] = mKey.split('-');
      return {
        monthKey: mKey,
        label: `Tháng ${m}/${y}`,
        totalAmount: data.amount,
        itemCount: data.count,
        manDays: data.manDays
      };
    });

  const topExpenses = [...filtered].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const flaggedExpenses = filtered.filter(i => i.status === 'cần_kiểm_tra' || i.confidenceScore < 85);

  let aiExecutiveSummary = `Báo cáo chi phí (${periodLabel}): Tổng chi tiêu là ${formatVND(totalAmount)} qua ${itemCount} giao dịch. `;
  if (totalManDaysRecorded > 0) {
    aiExecutiveSummary += `Đã ghi nhận tổng cộng ${totalManDaysRecorded} công thợ thi công. `;
  }
  if (categoryBreakdown.length > 0 && categoryBreakdown[0].totalAmount > 0) {
    aiExecutiveSummary += `Hạng mục chiếm tỷ trọng lớn nhất là "${categoryBreakdown[0].label}" (${categoryBreakdown[0].percentage}%). `;
  }
  if (pendingCount > 0) {
    aiExecutiveSummary += `Hiện có ${pendingCount} hóa đơn cần rà soát lại.`;
  } else {
    aiExecutiveSummary += `Tất cả hóa đơn trong kỳ báo cáo này đã được xác minh chính xác.`;
  }

  return {
    periodType: period,
    periodLabel,
    startDate: filtered.length > 0 ? filtered[filtered.length - 1].date : '',
    endDate: filtered.length > 0 ? filtered[0].date : '',
    totalAmount,
    itemCount,
    pendingCount,
    totalManDaysRecorded,
    categoryBreakdown,
    monthlyBreakdown,
    topExpenses,
    flaggedExpenses,
    aiExecutiveSummary
  };
}

export function getProjectName(): string {
  return localStorage.getItem(PROJECT_NAME_KEY) || INITIAL_PROJECT_NAME;
}

export function saveProjectName(name: string): void {
  localStorage.setItem(PROJECT_NAME_KEY, name);
}

export function resetToSampleData(): ExpenseItem[] {
  saveExpensesLocally(INITIAL_EXPENSES);
  localStorage.removeItem(AUDIT_LOG_KEY);
  localStorage.setItem(PROJECT_NAME_KEY, INITIAL_PROJECT_NAME);
  return INITIAL_EXPENSES.filter(i => !i.deletedAt);
}

export function generateSaturdayReport(expenses: ExpenseItem[]): WeeklyReport {
  const rep = generateMultiPeriodReport(expenses, 'weekly');
  return {
    weekLabel: 'Báo Cáo Tuần Này',
    startDate: rep.startDate,
    endDate: rep.endDate,
    totalAmount: rep.totalAmount,
    itemCount: rep.itemCount,
    pendingCount: rep.pendingCount,
    totalManDaysRecorded: rep.totalManDaysRecorded,
    categoryBreakdown: rep.categoryBreakdown,
    topExpenses: rep.topExpenses,
    flaggedExpenses: rep.flaggedExpenses,
    aiExecutiveSummary: rep.aiExecutiveSummary
  };
}

function formatCommasForExcel(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) return '';
  const hasDecimal = num % 1 !== 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: 2
  }).format(num);
}

export function exportToExcel(expenses: ExpenseItem[], projectName: string): void {
  const formattedData = expenses.map((item, index) => {
    const uCost = item.unitCost || (item.quantity && item.amount ? Math.round(item.amount / item.quantity) : undefined);
    return {
      'STT': index + 1,
      'Mã hóa đơn': item.id,
      'Ngày': item.date,
      'Số lượng (Quantity)': item.quantity ? `${item.quantity} ${item.unit || ''}` : '',
      'Đơn giá (Unit Cost)': formatCommasForExcel(uCost),
      'Số tiền (Total Paid)': formatCommasForExcel(item.amount),
      'Danh mục chuẩn (Major Category)': CATEGORY_METADATA[item.category]?.label || item.category,
      'Tiếng Anh (English)': CATEGORY_METADATA[item.category]?.englishLabel || '',
      'Chi tiết phụ (Subcategory)': item.subCategory || '',
      'Số công thợ (Man-days)': item.manDays || '',
      'Nhà cung cấp / Đơn vị / Thợ': item.merchant,
      'Hình thức thanh toán': item.paymentMethod === 'chuyển_khoản' ? 'Chuyển khoản' : 'Tiền mặt',
      'Trạng thái': item.status === 'đã_xác_minh' ? 'Đã xác minh' : 'Cần kiểm tra lại',
      'Độ tin cậy AI (%)': item.confidenceScore,
      'Ghi chú chi tiết': item.note
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 32 },
    { wch: 30 },
    { wch: 25 },
    { wch: 16 },
    { wch: 30 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 45 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Chi Phí Công Trình');

  const fileName = `Chi_Phi_${projectName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function formatVND(amount: number): string {
  const hasDecimal = amount % 1 !== 0;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: hasDecimal ? 2 : 0,
    maximumFractionDigits: 2
  }).format(amount);
}
