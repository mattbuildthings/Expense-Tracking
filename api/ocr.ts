declare const process: { env: Record<string, string | undefined> };

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { imageBase64, userApiKey } = body || {};

  const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({
      error: 'GEMINI_API_KEY is missing. Please provide an API key in Cài Đặt Settings.'
    });
  }

  try {
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body.' });
    }

    const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Bạn là hệ thống AI OCR đọc hóa đơn và chứng từ xây dựng chuyên nghiệp tại Việt Nam.
Hãy đọc thật kỹ hình ảnh hóa đơn/screenshot/biên nhận này và trả về duy nhất 1 JSON object chuẩn (không bọc trong markdown codeblock, không ghi thêm lời dẫn):

{
  "amount": 1610000,
  "quantity": 10,
  "unit": "cây",
  "unitCost": 180000,
  "category": "phần_thô_vật_tư",
  "subCategory": "Thép Phi 10 & Phi 12",
  "manDays": 0,
  "merchant": "CTY CP SẮT THÉP NAM VIỆT",
  "note": "Hóa đơn GTGT vật liệu xây dựng: Thép Phi 10 (10 cây), Thép Phi 12 (12 cây), Cát Vàng (1 khối)",
  "paymentMethod": "tiền_mặt",
  "date": "2017-09-29",
  "confidenceScore": 98,
  "aiReasoning": "Trích xuất thành công hóa đơn GTGT CTY CP Sắt Thép Nam Việt",
  "imageType": "receipt"
}

Quy tắc trích xuất dữ liệu:
1. "merchant" (Tên nhà cung cấp / Cửa hàng / Đơn vị): Lấy tên công ty, tên đơn vị phát hành ở phần tiêu đề hóa đơn (ví dụ: "CTY CP SẮT THÉP NAM VIỆT", "Cửa hàng VLXD Hồng Phát", "Tổ thợ xây anh Hùng"). Tuyệt đối KHÔNG trả về "Nhà cung cấp / Cửa hàng" chung chung!
2. "amount" (Tổng tiền thanh toán): Tìm số tiền ở dòng "TỔNG TIỀN", "TỔNG CỘNG", "TỔNG TIỀN XÂY CHẤT" hoặc tổng cộng cuối cùng của hóa đơn. Loại bỏ dấu chấm/phẩy phân cách ngàn để lấy số nguyên (ví dụ: 1.610.000 -> 1610000).
3. "category" (Hạng mục công trình): Phải chọn duy nhất 1 trong 9 mã sau:
   - "phần_thô_vật_tư": Sắt thép, Xi măng, Cát, Đá, Bê tông, Cốp pha, Gạch ống.
   - "hoàn_thiện_vật_tư": Sơn, Gạch ốp lát, Thạch cao, Điện nước, Cửa, Vật tư hoàn thiện.
   - "nội_thất_thiết_bị": Máy lạnh, Tủ kệ, Rèm cửa, Đèn, Thiết bị bếp.
   - "phần_thô_nhân_công": Lương thợ hồ, Tạm ứng thợ móng, Thợ coffa.
   - "hoàn_thiện_nhân_công": Thợ sơn, Thợ gạch, Thợ điện nước.
   - "tư_vấn_thiết_kế": Bản vẽ thiết kế, Phối cảnh.
   - "pháp_lý": GPXD, Ép cọc kiểm định, Đo đạc địa chính.
   - "quản_lý_dự_án": Giám sát, Bảo vệ.
   - "chi_phí_khác": Cơm trưa, Xăng xe, Tiếp khách.
4. "date": Lấy ngày ghi trên hóa đơn (định dạng YYYY-MM-DD, ví dụ: 2017-09-29 hoặc 2026-08-01).
5. "note": Liệt kê các mặt hàng chính hoặc mô tả vắn tắt hóa đơn.
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(geminiRes.status).json({
        error: `Gemini API Error (${geminiRes.status}): ${errText}`
      });
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse JSON from Gemini response.' });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err: any) {
    console.error('Serverless OCR error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
