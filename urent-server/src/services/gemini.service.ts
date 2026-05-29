/**
 * Gemini AI Service
 * Calls Google Gemini REST API (no SDK needed, uses Node 20 native fetch)
 * to analyze product images and suggest rental prices.
 */

import { env } from '../config/env';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_MODEL = 'gemini-2.5-flash';

export interface ProductAiAnalysis {
  name: string;
  category: string;
  price: number;
  priceMin: number;
  priceMax: number;
  priceReason: string;
  condition: string;
  description: string[];
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Fetch image bytes from a URL and convert to base64
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { base64, mimeType };
}

const VALID_CATEGORIES = [
  'Điện tử & Công nghệ',
  'Du lịch & Dã ngoại',
  'Đồ dùng học tập',
  'Thời trang & Đời sống',
];

function normalizeCategory(rawCategory?: string): string {
  if (!rawCategory) return 'Điện tử & Công nghệ';
  const normalized = rawCategory.toLowerCase().trim();
  
  if (
    normalized.includes('học tập') ||
    normalized.includes('sách') ||
    normalized.includes('giáo trình') ||
    normalized.includes('school') ||
    normalized.includes('book') ||
    normalized.includes('vở') ||
    normalized.includes('notebook')
  ) {
    return 'Đồ dùng học tập';
  }
  if (
    normalized.includes('du lịch') ||
    normalized.includes('dã ngoại') ||
    normalized.includes('lều') ||
    normalized.includes('camping') ||
    normalized.includes('travel') ||
    normalized.includes('outdoor') ||
    normalized.includes('xe đạp') ||
    normalized.includes('bicycle')
  ) {
    return 'Du lịch & Dã ngoại';
  }
  if (
    normalized.includes('thời trang') ||
    normalized.includes('đời sống') ||
    normalized.includes('quần áo') ||
    normalized.includes('đồng hồ') ||
    normalized.includes('fashion') ||
    normalized.includes('dress') ||
    normalized.includes('lifestyle') ||
    normalized.includes('clothes')
  ) {
    return 'Thời trang & Đời sống';
  }
  if (
    normalized.includes('điện tử') ||
    normalized.includes('công nghệ') ||
    normalized.includes('laptop') ||
    normalized.includes('phone') ||
    normalized.includes('tech') ||
    normalized.includes('electronics') ||
    normalized.includes('máy tính') ||
    normalized.includes('máy ảnh') ||
    normalized.includes('camera') ||
    normalized.includes('loa') ||
    normalized.includes('speaker') ||
    normalized.includes('headphone') ||
    normalized.includes('tai nghe')
  ) {
    return 'Điện tử & Công nghệ';
  }
  
  return 'Điện tử & Công nghệ'; // Safe default
}

const PROMPT = `Bạn là chuyên gia định giá tài sản tài ba của nền tảng cho thuê đồ dùng URent tại Việt Nam. 
Nhiệm vụ của bạn là phân tích kỹ hình ảnh sản phẩm được cung cấp, nhận diện chính xác và tự suy luận mức giá thuê theo ngày (VND/ngày) tối ưu nhất trên thị trường hiện tại.

### CÔNG THỨC & LOGIC ĐỊNH GIÁ (Dành cho AI):
1. **Ước lượng giá trị hiện tại (V giá trị gốc):** Dựa trên thương hiệu, model và tình trạng ngoại quan (mới/cũ, trầy xước, độ hoàn thiện) nhìn thấy trong ảnh để ước lượng giá trị thị trường của món đồ đó tại Việt Nam ở thời điểm hiện tại.
2. **Tính toán giá thuê/ngày:** 
   - Với đồ công nghệ/điện tử cao cấp: Giá thuê 1 ngày thường dao động khoảng 0.5% - 1.5% giá trị máy.
   - Với đồ thời trang, đồ dã ngoại, sự kiện: Giá thuê 1 ngày thường dao động khoảng 2% - 5% giá trị món đồ.
3. **Tính toán tiền cọc:** Ước tính khoảng 70% - 100% giá trị thực tế của sản phẩm để đảm bảo an toàn cho chủ sở hữu.

### YÊU CẦU ĐẦU RA (OUTPUT FORMAT):
Chỉ trả về duy nhất một chuỗi JSON hợp lệ, không bọc trong thẻ code block markdown, không chứa lời mở đầu, lời kết hay bất kỳ ký tự giải thích nào bên ngoài JSON. Tất cả các trường giá trị tiền tệ phải là SỐ NGUYÊN (không chứa dấu phẩy, không chứa chữ "VND").

Cấu trúc JSON bắt buộc:
{
  "product_analysis": {
    "brand": "Tên thương hiệu (ví dụ: Apple, Sony, Marshall...)",
    "model": "Tên model cụ thể hoặc dòng sản phẩm nhận diện được",
    "market_segment": "Phân khúc sản phẩm (ví dụ: Cao cấp, Phổ thông, Tầm trung)",
    "visual_condition": "Đánh giá độ mới/cũ, ngoại quan của sản phẩm qua hình ảnh"
  },
  "market_valuation": {
    "estimated_current_value": 0,
    "recommended_rent_per_day": 0,
    "min_rent_per_day": 0,
    "max_rent_per_day": 0,
    "suggested_deposit": 0,
    "pricing_logic": "Giải thích ngắn gọn lý do định giá dựa trên phân khúc và tình trạng máy (1 câu)"
  },
  "category": "Điện tử & Công nghệ | Du lịch & Dã ngoại | Đồ dùng học tập | Thời trang & Đời sống",
  "condition": "New | 99% | 95% | Used",
  "description": ["đặc điểm 1", "đặc điểm 2", "đặc điểm 3"],
  "confidence": "high | medium | low"
}`;

const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    product_analysis: {
      type: 'OBJECT',
      properties: {
        brand: {
          type: 'STRING',
          description: 'Tên thương hiệu (ví dụ: Apple, Sony, Marshall...)',
        },
        model: {
          type: 'STRING',
          description: 'Tên model cụ thể hoặc dòng sản phẩm nhận diện được',
        },
        market_segment: {
          type: 'STRING',
          description: 'Phân khúc sản phẩm (ví dụ: Cao cấp, Phổ thông, Tầm trung)',
        },
        visual_condition: {
          type: 'STRING',
          description: 'Đánh giá độ mới/cũ, ngoại quan của sản phẩm qua hình ảnh',
        },
      },
      required: ['brand', 'model', 'market_segment', 'visual_condition'],
    },
    market_valuation: {
      type: 'OBJECT',
      properties: {
        estimated_current_value: {
          type: 'INTEGER',
          description: 'Giá trị ước tính của món đồ hiện tại trên thị trường (VND)',
        },
        recommended_rent_per_day: {
          type: 'INTEGER',
          description: 'Giá thuê khuyên dùng/ngày (VND)',
        },
        min_rent_per_day: {
          type: 'INTEGER',
          description: 'Giá thuê tối thiểu/ngày để chủ đồ không bị lỗ (VND)',
        },
        max_rent_per_day: {
          type: 'INTEGER',
          description: 'Giá thuê tối đa/ngày mà người thuê sẵn sàng chi trả (VND)',
        },
        suggested_deposit: {
          type: 'INTEGER',
          description: 'Số tiền đặt cọc đề xuất (VND)',
        },
        pricing_logic: {
          type: 'STRING',
          description: 'Giải thích ngắn gọn lý do định giá dựa trên phân khúc và tình trạng máy (1 câu)',
        },
      },
      required: [
        'estimated_current_value',
        'recommended_rent_per_day',
        'min_rent_per_day',
        'max_rent_per_day',
        'suggested_deposit',
        'pricing_logic',
      ],
    },
    category: {
      type: 'STRING',
      enum: [
        'Điện tử & Công nghệ',
        'Du lịch & Dã ngoại',
        'Đồ dùng học tập',
        'Thời trang & Đời sống',
      ],
      description: 'Danh mục phân loại sản phẩm',
    },
    condition: {
      type: 'STRING',
      enum: ['New', '99%', '95%', 'Used'],
      description: 'Tình trạng sản phẩm theo chuẩn hệ thống',
    },
    description: {
      type: 'ARRAY',
      items: {
        type: 'STRING',
      },
      description: 'Danh sách 3-5 đặc điểm thông số quan trọng nổi bật của sản phẩm',
    },
    confidence: {
      type: 'STRING',
      enum: ['high', 'medium', 'low'],
      description: 'Mức độ tự tin của phân tích',
    },
  },
  required: [
    'product_analysis',
    'market_valuation',
    'category',
    'condition',
    'description',
    'confidence',
  ],
};

function parseGeminiResponse(rawText: string): ProductAiAnalysis {
  let jsonStr = rawText.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (err: any) {
    console.error('[Gemini JSON Parsing Error] Failed to parse JSON string:', jsonStr);
    console.error('[Gemini JSON Parsing Error] Raw response was:', rawText);
    throw err;
  }

  const brand = parsed.product_analysis?.brand || '';
  const model = parsed.product_analysis?.model || '';
  const name = (brand && model)
    ? `${brand} ${model}`
    : (parsed.name || brand || model || 'Sản phẩm cho thuê');

  const category = normalizeCategory(parsed.category);

  const price = typeof parsed.market_valuation?.recommended_rent_per_day === 'number' && parsed.market_valuation.recommended_rent_per_day > 0
    ? Math.round(parsed.market_valuation.recommended_rent_per_day)
    : (typeof parsed.price === 'number' && parsed.price > 0 ? Math.round(parsed.price) : 100000);

  const priceMin = typeof parsed.market_valuation?.min_rent_per_day === 'number' && parsed.market_valuation.min_rent_per_day > 0
    ? Math.round(parsed.market_valuation.min_rent_per_day)
    : (typeof parsed.priceMin === 'number' && parsed.priceMin > 0 ? Math.round(parsed.priceMin) : Math.round(price * 0.7));

  const priceMax = typeof parsed.market_valuation?.max_rent_per_day === 'number' && parsed.market_valuation.max_rent_per_day > 0
    ? Math.round(parsed.market_valuation.max_rent_per_day)
    : (typeof parsed.priceMax === 'number' && parsed.priceMax > 0 ? Math.round(parsed.priceMax) : Math.round(price * 1.3));

  const priceReason = parsed.market_valuation?.pricing_logic || parsed.priceReason || 'Dựa trên phân tích hình ảnh sản phẩm';

  const condition = ['New', '99%', '95%', 'Used'].includes(parsed.condition ?? '')
    ? (parsed.condition as string)
    : (parsed.product_analysis?.visual_condition?.toLowerCase().includes('mới') || parsed.product_analysis?.visual_condition?.toLowerCase().includes('100%') ? 'New' : '99%');

  const description = Array.isArray(parsed.description) && parsed.description.length > 0
    ? (parsed.description as string[]).filter((d) => typeof d === 'string' && d.trim())
    : (parsed.product_analysis?.visual_condition ? [parsed.product_analysis.visual_condition] : []);

  const confidence = ['high', 'medium', 'low'].includes(parsed.confidence ?? '')
    ? (parsed.confidence as 'high' | 'medium' | 'low')
    : 'medium';

  return {
    name,
    category,
    price,
    priceMin,
    priceMax,
    priceReason,
    condition,
    description,
    confidence,
  };
}

/**
 * Analyze a product image using Gemini Vision and return rental price suggestion
 */
export async function analyzeProductImage(imageUrl: string): Promise<ProductAiAnalysis> {
  const apiKey = env.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Fetch image and convert to base64
  const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
          {
            text: PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 32,
      topP: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  };

  const apiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', errText);
    throw new Error(`Gemini API returned ${response.status}: ${errText}`);
  }

  const result = await response.json() as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini response');
  }

  return parseGeminiResponse(rawText);
}

/**
 * Analyze a product image using Gemini Vision (base64 data directly) and return suggestions
 */
export async function analyzeProductImageBase64(base64: string, mimeType: string): Promise<ProductAiAnalysis> {
  const apiKey = env.geminiApiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
          {
            text: PROMPT,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topK: 32,
      topP: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: GEMINI_RESPONSE_SCHEMA,
    },
  };

  const apiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', errText);
    throw new Error(`Gemini API returned ${response.status}: ${errText}`);
  }

  const result = await response.json() as any;
  console.log('[Gemini Response Object]:', JSON.stringify(result, null, 2));

  const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty Gemini response');
  }

  return parseGeminiResponse(rawText);
}

