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

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY environment variable is missing on serverless environment.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { imageBase64 } = body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body.' });
    }

    const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Bạn là trợ lý kế toán chuyên đọc hóa đơn và ảnh chụp chuyển khoản cho công trình xây dựng tại Việt Nam.
Hãy phân tích hình ảnh này và trả về kết quả định dạng JSON chuẩn (không chứa markdown backticks):

{
  "amount": 18500000,
  "quantity": 50,
  "unit": "cây",
  "unitCost": 370000,
  "category": "phần_thô_vật_tư",
  "subCategory": "Sắt thép Phi 16",
  "manDays": 5,
  "merchant": "Tên nhà cung cấp / Cửa hàng / Ngân hàng / Đội thợ nhận",
  "note": "Mô tả ngắn nội dung chi tiêu",
  "paymentMethod": "chuyển_khoản",
  "date": "2026-07-30",
  "confidenceScore": 95,
  "aiReasoning": "Lý do AI phân loại",
  "imageType": "bank_transfer"
}
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
