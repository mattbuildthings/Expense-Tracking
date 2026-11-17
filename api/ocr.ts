declare const process: { env: Record<string, string | undefined> };

/**
 * Ceiling on the inline image accepted, in base64 characters. ~14M base64
 * characters is ~10MB of image bytes, which is the Gemini inline-data limit.
 * Nothing bounded this before, so a caller could post an arbitrarily large
 * body and bill the processing to this project's key.
 */
const MAX_IMAGE_BASE64_CHARS = 14_000_000;

export default async function handler(req: any, res: any) {
  // NO CORS HEADERS.
  //
  // This route previously sent `Access-Control-Allow-Origin: *` together with
  // `Allow-Credentials: true`, and accepted a caller-supplied `userApiKey`
  // from the request body. Between them, any website could POST here and have
  // OCR billed to this project's Gemini key. The browser app calls this route
  // same-origin, which needs no CORS headers at all, so the fix is to send
  // none. Do not add a wildcard origin back.

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { imageBase64 } = body || {};

  // Server-side key ONLY. A key arriving in the request body is never trusted:
  // honouring one turns this route into an open relay for third-party keys and
  // makes abuse untraceable.
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    return res.status(500).json({
      error: 'Server is not configured for OCR (GEMINI_API_KEY is not set).'
    });
  }

  if (typeof imageBase64 === 'string' && imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    return res.status(413).json({ error: 'Image too large to process.' });
  }

  try {
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body.' });
    }

    const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Bạn là hệ thống AI OCR phân tích hóa đơn và chứng từ xây dựng tại Việt Nam.
Hãy đọc thật kỹ hình ảnh hóa đơn/screenshot/biên nhận này và trả về duy nhất 1 JSON object chuẩn (không bọc trong markdown codeblock, không ghi thêm lời dẫn):

{
  "amount": 1610000,
  "quantity": 1,
  "unit": "bao",
  "unitCost": 185000,
  "category": "phần_thô_vật_tư",
  "subCategory": "Xi Măng Holcim & Gạch Ống",
  "manDays": 0,
  "merchant": "ĐẠI LÝ XI MĂNG MINH ĐỨC",
  "note": "Hóa đơn GTGT vật liệu: Xi Măng Holcim, Gạch Ống, D8 142",
  "paymentMethod": "tiền_mặt",
  "date": "2017-07-27",
  "confidenceScore": 98,
  "aiReasoning": "Trích xuất thành công hóa đơn ĐẠI LÝ XI MĂNG MINH ĐỨC",
  "imageType": "receipt"
}

QUY TẮC TRÍCH XUẤT BẮT BUỘC:
1. "merchant" (Tên nhà cung cấp / Cửa hàng / Đơn vị): Lấy đúng tên đơn vị ở phần tiêu đề đầu hóa đơn (VD: "ĐẠI LÝ XI MĂNG MINH ĐỨC", "CTY CP SẮT THÉP NAM VIỆT", "Cửa hàng VLXD Hồng Phát"). Tuyệt đối KHÔNG trả về "Nhà cung cấp / Cửa hàng" hay "L, Phát sinh công trình"!
2. "amount" (Tổng tiền): Lấy số tiền ở dòng "TỔNG CỘNG", "TỔNG TIỀN", "Tổng tiền xây chất" hoặc số tổng cuối cùng ở góc dưới bảng. Lấy số nguyên (ví dụ: 1.610.000 -> 1610000, hoặc sum các dòng 238000).
3. "category" (Hạng mục công trình): Phải chọn duy nhất 1 trong 9 mã sau:
   - "phần_thô_vật_tư": Xi măng, Gạch ống, Sắt thép, Cát, Đá, Bê tông, Cốp pha.
   - "hoàn_thiện_vật_tư": Sơn, Gạch ốp lát, Thạch cao, Điện nước, Cửa, Vật tư hoàn thiện.
   - "nội_thất_thiết_bị": Máy lạnh, Tủ kệ, Rèm cửa, Đèn, Thiết bị bếp.
   - "phần_thô_nhân_công": Lương thợ hồ, Tạm ứng thợ móng, Thợ coffa.
   - "hoàn_thiện_nhân_công": Thợ sơn, Thợ gạch, Thợ điện nước.
   - "tư_vấn_thiết_kế": Bản vẽ thiết kế, Phối cảnh.
   - "pháp_lý": GPXD, Ép cọc kiểm định, Đo đạc địa chính.
   - "quản_lý_dự_án": Giám sát, Bảo vệ.
   - "chi_phí_khác": Cơm trưa, Xăng xe, Tiếp khách.
4. "date": Lấy ngày trên hóa đơn theo định dạng YYYY-MM-DD (VD: 2017-07-27 hoặc 2026-08-01).
5. "note": Liệt kê tên các mặt hàng trong bảng (VD: Xi Măng Holcim, Gạch Ống, D8 142).
`;

    // ONE place defines the model, and it defaults to a `-latest` alias.
    //
    // This list used to be hardcoded as
    //   ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
    // Every one of those is a dated snapshot, and `gemini-1.5-flash` is the
    // specific model whose sunset returned 404s and took three Siteop routes
    // down in production for days (see Siteop AGENTS.md #1). Dated snapshots
    // get retired on Google's schedule, not yours -- `gemini-3.6-flash`
    // retires 19 Nov 2026.
    //
    // Override with the GEMINI_MODEL env var to pin a specific model (e.g. to
    // move onto Gemini 4 Hydrogen once you have confirmed its exact API id
    // against your own key -- see scripts/list-gemini-models.sh). Do not write
    // a model string literal inline here again.
    const models = [process.env.GEMINI_MODEL?.trim() || 'gemini-flash-latest'];
    let lastError = '';

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                      }
                    }
                  ]
                }
              ]
            })
          }
        );
        clearTimeout(timeoutId);

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          let errMessage = errText;
          try {
            const parsedErr = JSON.parse(errText);
            errMessage = parsedErr?.error?.message || errText;
          } catch (_) {}

          lastError = `Gemini API (${model}) ${geminiRes.status}: ${errMessage}`;

          if (geminiRes.status === 400 || geminiRes.status === 401 || geminiRes.status === 403) {
            return res.status(geminiRes.status).json({ error: `Google Gemini API Key: ${errMessage}` });
          }
          continue;
        }

        const data = await geminiRes.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return res.status(200).json(parsed);
        }
      } catch (err: any) {
        lastError = err.message || 'Fetch error';
      }
    }

    return res.status(500).json({ error: lastError || 'Gemini Vision AI failed to process image.' });

  } catch (err: any) {
    console.error('Serverless OCR error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
