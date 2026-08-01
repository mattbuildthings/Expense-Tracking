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

  if (!apiKey || !apiKey.trim()) {
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

    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    let lastError = '';

    for (const model of models) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
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
          lastError = `Gemini API (${model}) Error ${geminiRes.status}: ${errText}`;
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
