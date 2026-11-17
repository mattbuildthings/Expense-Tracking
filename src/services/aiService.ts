import type { ExpenseCategory, PaymentMethod } from '../types/expense';

export interface ParseResult {
  amount: number;
  quantity?: number;
  unit?: string;
  unitCost?: number;
  category: ExpenseCategory;
  subCategory?: string;
  manDays?: number;
  merchant: string;
  note: string;
  paymentMethod: PaymentMethod;
  date: string;
  confidenceScore: number;
  aiReasoning: string;
  imageType: 'receipt' | 'bank_transfer' | 'handwritten';
}

// NOTE: the OCR prompt used to be duplicated here as OCR_PROMPT, for the
// browser-side Gemini call that has now been removed. The live copy is in
// api/ocr.ts, which is the only place that talks to Gemini. Keeping a second
// copy here would be the same duplicated-config trap that AGENTS.md #1 in the
// Siteop repo was written about -- two copies drift, one gets fixed, the other
// is missed. If the prompt needs to move somewhere shared during the merge,
// move it; do not copy it back.

/**
 * Sends a receipt image to the server-side OCR route and returns the parsed
 * expense, or THROWS.
 *
 * This function has exactly one success path and no fallbacks. That is
 * deliberate -- see the two things that used to be here:
 *
 * 1. A browser-side Gemini call. It read a key from localStorage
 *    ('gemini_api_key') and POSTed straight to generativelanguage.googleapis.com
 *    from the page. It ran FIRST, so for any user with a stale key saved it
 *    shadowed the server route entirely -- and it hardcoded
 *    ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'], all three of
 *    which Google has now retired (the oldest model still served is
 *    gemini-2.5-*). So those users got failures while the correctly configured
 *    server route sat unused. Keys also belong server-side: GEMINI_API_KEY is
 *    set in Vercel and api/ocr.ts no longer accepts a caller-supplied key.
 *
 * 2. simulateLocalParsing(). When every path above failed it returned a
 *    HARDCODED expense -- 1,610,000 VND from "ĐẠI LÝ XI MĂNG MINH ĐỨC", or
 *    4,500,000 VND from "Cửa hàng VLXD Hồng Phát" if the filename looked like
 *    a bank transfer -- carrying confidenceScore 94/95 and an aiReasoning
 *    string claiming extraction had succeeded. Nothing marked it as fake.
 *    In a bookkeeping app that is the worst possible failure mode: a plausible
 *    invented amount against a real-sounding vendor, silently entering the
 *    ledger. A visible error is always better than a confident fabrication.
 *
 * So: if OCR cannot run, this throws and the caller shows the message. Never
 * reintroduce a fallback that returns an expense nobody extracted.
 */
export async function parseInvoiceWithAI(
  imageBase64: string,
  fileName: string
): Promise<ParseResult> {
  let res: Response;

  try {
    res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, fileName })
    });
  } catch {
    // Network-level failure: offline, DNS, connection reset.
    throw new Error(
      'Không thể kết nối máy chủ OCR. Kiểm tra kết nối mạng rồi thử lại.'
    );
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `OCR thất bại (HTTP ${res.status}).`);
  }

  const parsed = await res.json().catch(() => null);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Máy chủ OCR trả về dữ liệu không hợp lệ.');
  }

  return formatParsedResult(parsed);
}

function formatParsedResult(parsed: any): ParseResult {
  return {
    amount: Number(parsed.amount) || 0,
    quantity: parsed.quantity ? Number(parsed.quantity) : undefined,
    unit: parsed.unit || undefined,
    unitCost: parsed.unitCost ? Number(parsed.unitCost) : undefined,
    category: sanitizeCategory(parsed.category),
    subCategory: parsed.subCategory || undefined,
    manDays: parsed.manDays ? Number(parsed.manDays) : undefined,
    merchant: parsed.merchant || 'Không xác định',
    note: parsed.note || 'Chi phí công trình',
    paymentMethod: parsed.paymentMethod === 'tiền_mặt' ? 'tiền_mặt' : 'chuyển_khoản',
    date: parsed.date || new Date().toISOString().split('T')[0],
    confidenceScore: Math.min(100, Math.max(10, Number(parsed.confidenceScore) || 95)),
    aiReasoning: parsed.aiReasoning || 'Gemini AI Vision đã nhận diện hóa đơn thành công',
    imageType: parsed.imageType || 'receipt'
  };
}

function sanitizeCategory(cat: string): ExpenseCategory {
  const valid: ExpenseCategory[] = [
    'pháp_lý',
    'tư_vấn_thiết_kế',
    'phần_thô_nhân_công',
    'phần_thô_vật_tư',
    'hoàn_thiện_nhân_công',
    'hoàn_thiện_vật_tư',
    'nội_thất_thiết_bị',
    'quản_lý_dự_án',
    'chi_phí_khác'
  ];
  if (valid.includes(cat as ExpenseCategory)) return cat as ExpenseCategory;
  if (cat === 'vật_liệu' || cat === 'vật_liệu_thô' || cat === 'xi_măng' || cat === 'gạch' || cat === 'sắt_thép') return 'phần_thô_vật_tư';
  if (cat === 'vật_liệu_hoàn_thiện' || cat === 'sơn') return 'hoàn_thiện_vật_tư';
  if (cat === 'nhân_công' || cat === 'thợ_xây') return 'phần_thô_nhân_công';
  return 'chi_phí_khác';
}
