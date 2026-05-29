/**
 * Client-side Gemini AI Service (Refactored)
 * Routes requests to secure backend proxy to keep API key hidden
 * and utilizes Gemini Structured Outputs for 100% reliable JSON mapping.
 */

import { getStoredAuthToken } from "../api/tokenStorage";

export interface GeminiProductAnalysis {
  name: string;
  category: string;
  price: number;
  priceMin: number;
  priceMax: number;
  priceReason: string;
  condition: string;
  description: string[];
  confidence: "high" | "medium" | "low";
}

const VALID_CATEGORIES = [
  "Điện tử & Công nghệ",
  "Du lịch & Dã ngoại",
  "Đồ dùng học tập",
  "Thời trang & Đời sống",
];

const ANALYSIS_PROMPT = `Bạn là chuyên gia định giá tài sản tài ba của nền tảng cho thuê đồ dùng URent tại Việt Nam. 
Nhiệm vụ của bạn là phân tích kỹ hình ảnh sản phẩm được cung cấp, nhận diện chính xác và tự suy luận mức giá thuê theo ngày (VND/ngày) tối ưu nhất trên thị trường hiện tại.

### CÔNG THỨC & LOGIC ĐỊNH GIÁ (Dành cho AI):
1. **Ước lượng giá trị hiện tại (V giá trị gốc):** Dựa trên thương hiệu, model và tình trạng ngoại quan (mới/cũ, trầy xước, độ hoàn thiện) nhìn thấy trong ảnh để ước lượng giá trị thị trường của món đồ đó tại Việt Nam ở thời điểm hiện tại.
2. **Tính toán giá thuê/ngày:** 
   - Với đồ công nghệ/điện tử cao cấp: Giá thuê 1 ngày thường dao động khoảng 0.5% - 1.5% giá trị máy.
   - Với đồ thời trang, đồ dã ngoại, sự kiện: Giá thuê 1 ngày thường dao động khoảng 2% - 5% giá trị món đồ.
3. **Tính toán tiền cọc:** Ước tính khoảng 70% - 100% giá trị thực tế của sản phẩm để đảm bảo an toàn cho chủ sở hữu.

### YÊU CẦU ĐẦU RA (OUTPUT FORMAT):
Chỉ trả về duy nhất một chuỗi JSON hợp lệ, không bọc trong tag code \`\`\`json \`\`\`, không chứa lời mở đầu, lời kết hay bất kỳ ký tự giải thích nào bên ngoài JSON. Tất cả các trường giá trị tiền tệ phải là SỐ NGUYÊN (không chứa dấu phẩy, không chứa chữ "VND").

Cấu trúc JSON bắt buộc:
{
  "product_analysis": {
    "brand": "Tên thương hiệu (ví dụ: Apple, Sony, Marshall...)",
    "model": "Tên model cụ thể hoặc dòng sản phẩm nhận diện được",
    "market_segment": "Phân khúc sản phẩm (ví dụ: Cao cấp, Phổ thông, Tầm trung)",
    "visual_condition": "Đánh giá độ mới/cũ, ngoại quan của sản phẩm qua hình ảnh"
  },
  "market_valuation": {
    "estimated_current_value": 0, // Giá trị ước tính của món đồ hiện tại trên thị trường (VND)
    "recommended_rent_per_day": 0, // Giá thuê khuyên dùng/ngày (VND)
    "min_rent_per_day": 0, // Giá thuê tối thiểu/ngày để chủ đồ không bị lỗ (VND)
    "max_rent_per_day": 0, // Giá thuê tối đa/ngày mà người thuê sẵn sàng chi trả (VND)
    "suggested_deposit": 0, // Số tiền đặt cọc đề xuất (VND)
    "pricing_logic": "Giải thích ngắn gọn lý do định giá dựa trên phân khúc và tình trạng máy (1 câu)"
  }
}`;

/**
 * Convert an image URL to base64 (for Cloudinary URLs and other external URLs)
 */
async function imageUrlToBase64(
  url: string
): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Cannot fetch image: ${response.status}`);
  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a File object to base64 (works for local blob files without CORS issues)
 */
export async function fileToBase64(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  const mimeType = file.type || "image/jpeg";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- PERSISTENT SESSION CACHE & SMART FUZZY NORMALIZATION ---
const CACHE_PREFIX = "urent_ai_cache_";

function getCachedAnalysis(key: string): GeminiProductAnalysis | null {
  try {
    const cached = sessionStorage.getItem(CACHE_PREFIX + key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedAnalysis(key: string, data: GeminiProductAnalysis): void {
  try {
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to write to sessionStorage:", e);
  }
}

export function normalizeCategory(rawCategory?: string): string {
  if (!rawCategory) return "Điện tử & Công nghệ";
  const normalized = rawCategory.toLowerCase().trim();

  if (
    normalized.includes("học tập") ||
    normalized.includes("sách") ||
    normalized.includes("giáo trình") ||
    normalized.includes("school") ||
    normalized.includes("book") ||
    normalized.includes("vở") ||
    normalized.includes("notebook")
  ) {
    return "Đồ dùng học tập";
  }
  if (
    normalized.includes("du lịch") ||
    normalized.includes("dã ngoại") ||
    normalized.includes("lều") ||
    normalized.includes("camping") ||
    normalized.includes("travel") ||
    normalized.includes("outdoor") ||
    normalized.includes("xe đạp") ||
    normalized.includes("bicycle")
  ) {
    return "Du lịch & Dã ngoại";
  }
  if (
    normalized.includes("thời trang") ||
    normalized.includes("đời sống") ||
    normalized.includes("quần áo") ||
    normalized.includes("đồng hồ") ||
    normalized.includes("fashion") ||
    normalized.includes("dress") ||
    normalized.includes("lifestyle") ||
    normalized.includes("clothes")
  ) {
    return "Thời trang & Đời sống";
  }
  if (
    normalized.includes("điện tử") ||
    normalized.includes("công nghệ") ||
    normalized.includes("laptop") ||
    normalized.includes("phone") ||
    normalized.includes("tech") ||
    normalized.includes("electronics") ||
    normalized.includes("máy tính") ||
    normalized.includes("máy ảnh") ||
    normalized.includes("camera") ||
    normalized.includes("loa") ||
    normalized.includes("speaker") ||
    normalized.includes("headphone") ||
    normalized.includes("tai nghe")
  ) {
    return "Điện tử & Công nghệ";
  }

  return "Điện tử & Công nghệ"; // Safe default
}

/**
 * Resize and compress image using HTML Canvas to reduce base64 payload size,
 * speed up API response times, and minimize bandwidth.
 */
export async function resizeAndCompressImage(
  imageSource: File | string,
  maxDimension = 768,
  quality = 0.85
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // Handle CORS for URLs

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Keep aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2D canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Force output to jpeg for superior compression size
      const mimeType = "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, quality);
      const base64 = dataUrl.split(",")[1];

      resolve({ base64, mimeType });
    };

    img.onerror = (err) => {
      reject(new Error(`Failed to load image for resizing: ${err}`));
    };

    if (imageSource instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    } else {
      img.src = imageSource;
    }
  });
}

/**
 * Build and send the Gemini vision request with given image data to the backend proxy
 */
async function callGeminiVisionAPI(
  base64: string,
  mimeType: string,
  apiKey?: string, // Kept optional for backward compatibility
  signal?: AbortSignal
): Promise<GeminiProductAnalysis> {
  const requestBody = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mimeType, data: base64 } },
          { text: ANALYSIS_PROMPT },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          product_analysis: {
            type: "OBJECT",
            properties: {
              brand: {
                type: "STRING",
                description: "Tên thương hiệu (ví dụ: Apple, Sony, Marshall...)"
              },
              model: {
                type: "STRING",
                description: "Tên model cụ thể hoặc dòng sản phẩm nhận diện được"
              },
              market_segment: {
                type: "STRING",
                description: "Phân khúc sản phẩm (ví dụ: Cao cấp, Phổ thông, Tầm trung)"
              },
              visual_condition: {
                type: "STRING",
                description: "Đánh giá độ mới/cũ, ngoại quan của sản phẩm qua hình ảnh"
              }
            },
            required: ["brand", "model", "market_segment", "visual_condition"]
          },
          market_valuation: {
            type: "OBJECT",
            properties: {
              estimated_current_value: {
                type: "INTEGER",
                description: "Giá trị ước tính của món đồ hiện tại trên thị trường (VND)"
              },
              recommended_rent_per_day: {
                type: "INTEGER",
                description: "Giá thuê khuyên dùng/ngày (VND)"
              },
              min_rent_per_day: {
                type: "INTEGER",
                description: "Giá thuê tối thiểu/ngày để chủ đồ không bị lỗ (VND)"
              },
              max_rent_per_day: {
                type: "INTEGER",
                description: "Giá thuê tối đa/ngày mà người thuê sẵn sàng chi trả (VND)"
              },
              suggested_deposit: {
                type: "INTEGER",
                description: "Số tiền đặt cọc đề xuất (VND)"
              },
              pricing_logic: {
                type: "STRING",
                description: "Giải thích ngắn gọn lý do định giá dựa trên phân khúc và tình trạng máy (1 câu)"
              }
            },
            required: [
              "estimated_current_value",
              "recommended_rent_per_day",
              "min_rent_per_day",
              "max_rent_per_day",
              "suggested_deposit",
              "pricing_logic"
            ]
          },
          category: {
            type: "STRING",
            enum: [
              "Điện tử & Công nghệ",
              "Du lịch & Dã ngoại",
              "Đồ dùng học tập",
              "Thời trang & Đời sống"
            ],
            description: "Danh mục phân loại sản phẩm"
          },
          condition: {
            type: "STRING",
            enum: ["New", "99%", "95%", "Used"],
            description: "Tình trạng sản phẩm theo chuẩn hệ thống"
          },
          description: {
            type: "ARRAY",
            items: {
              type: "STRING"
            },
            description: "Danh sách 3-5 đặc điểm thông số quan trọng nổi bật của sản phẩm"
          },
          confidence: {
            type: "STRING",
            enum: ["high", "medium", "low"],
            description: "Mức độ tự tin của phân tích"
          }
        },
        required: [
          "product_analysis",
          "market_valuation",
          "category",
          "condition",
          "description",
          "confidence"
        ]
      }
    },
  };

  const apiBaseUrl =
    (import.meta as any).env?.VITE_API_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL ||
    "";
  const apiUrl = `${apiBaseUrl.replace(/\/$/, "")}/api/urent-ai/analyze`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Attach auth token if user is signed in
  const token = getStoredAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // If apiKey is optionally passed (fallback or custom dev override), send it to the backend as a header
  if (apiKey) {
    headers["x-gemini-api-key"] = apiKey;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[Gemini Proxy] Route error:", errText);
    if (response.status === 400) throw new Error("INVALID_KEY");
    if (response.status === 429) throw new Error(`QUOTA_EXCEEDED: ${errText}`);
    if (response.status === 403) throw new Error("FORBIDDEN");
    throw new Error(`API_ERROR_${response.status}`);
  }

  const result = await response.json();

  // Support both wrapped structures (e.g. { success: true, data: {...} }) and standard direct payloads
  let parsed: any = {};
  if (result && result.candidates) {
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("EMPTY_RESPONSE");
    parsed = JSON.parse(rawText.trim());
  } else if (result && result.success && result.data) {
    parsed = result.data;
  } else if (result && result.data) {
    parsed = result.data;
  } else {
    parsed = result;
  }

  // Extract from the new nested structure or fall back to top-level properties
  const brand = parsed.product_analysis?.brand || "";
  const model = parsed.product_analysis?.model || "";
  const name = (brand && model)
    ? `${brand} ${model}`
    : (parsed.name || brand || model || "Sản phẩm cho thuê");

  const category = normalizeCategory(parsed.category);

  // Map prices from market_valuation or top-level properties
  const price = typeof parsed.market_valuation?.recommended_rent_per_day === "number" && parsed.market_valuation.recommended_rent_per_day > 0
    ? Math.round(parsed.market_valuation.recommended_rent_per_day)
    : (typeof parsed.price === "number" && parsed.price > 0 ? Math.round(parsed.price) : 100000);

  const priceMin = typeof parsed.market_valuation?.min_rent_per_day === "number" && parsed.market_valuation.min_rent_per_day > 0
    ? Math.round(parsed.market_valuation.min_rent_per_day)
    : (typeof parsed.priceMin === "number" && parsed.priceMin > 0 ? Math.round(parsed.priceMin) : Math.round(price * 0.7));

  const priceMax = typeof parsed.market_valuation?.max_rent_per_day === "number" && parsed.market_valuation.max_rent_per_day > 0
    ? Math.round(parsed.market_valuation.max_rent_per_day)
    : (typeof parsed.priceMax === "number" && parsed.priceMax > 0 ? Math.round(parsed.priceMax) : Math.round(price * 1.3));

  const priceReason = parsed.market_valuation?.pricing_logic || parsed.priceReason || "Dựa trên phân tích hình ảnh sản phẩm.";

  const condition = ["New", "99%", "95%", "Used"].includes(parsed.condition ?? "")
    ? (parsed.condition as string)
    : (parsed.product_analysis?.visual_condition?.toLowerCase().includes("mới") || parsed.product_analysis?.visual_condition?.toLowerCase().includes("100%") ? "New" : "99%");

  const description = Array.isArray(parsed.description) && parsed.description.length > 0
    ? (parsed.description as string[]).filter((d) => typeof d === "string" && d.trim())
    : (parsed.product_analysis?.visual_condition ? [parsed.product_analysis.visual_condition] : []);

  const confidence = (["high", "medium", "low"] as const).includes(
    parsed.confidence as "high" | "medium" | "low"
  )
    ? (parsed.confidence as "high" | "medium" | "low")
    : "medium";

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
 * Analyze product image using Gemini Vision API (from a local File object)
 * Routes securely through the backend proxy.
 */
export async function analyzeProductWithGeminiFile(
  file: File,
  apiKey?: string, // Kept optional for backward compatibility
  signal?: AbortSignal
): Promise<GeminiProductAnalysis> {
  const cacheKey = `file:${file.name}-${file.size}-${file.lastModified}`;
  const cached = getCachedAnalysis(cacheKey);
  if (cached) {
    console.log("[Gemini Cache] Hit for file:", file.name);
    return cached;
  }

  // Attempt image resizing/compression first to minimize payload
  let base64 = "";
  let mimeType = "image/jpeg";
  try {
    const resized = await resizeAndCompressImage(file, 768, 0.85);
    base64 = resized.base64;
    mimeType = resized.mimeType;
    console.log(`[Gemini Payload] Compressed file: ~${Math.round((base64.length * 3) / 4 / 1024)} KB`);
  } catch (err) {
    console.warn("[Gemini Payload] Compression failed, using original file:", err);
    const original = await fileToBase64(file);
    base64 = original.base64;
    mimeType = original.mimeType;
  }

  const result = await callGeminiVisionAPI(base64, mimeType, apiKey, signal);
  setCachedAnalysis(cacheKey, result);
  return result;
}

/**
 * Analyze product image using Gemini Vision API
 * Routes securely through the backend proxy.
 */
export async function analyzeProductWithGemini(
  imageUrl: string,
  apiKey?: string, // Kept optional for backward compatibility
  signal?: AbortSignal
): Promise<GeminiProductAnalysis> {
  const cacheKey = `url:${imageUrl}`;
  const cached = getCachedAnalysis(cacheKey);
  if (cached) {
    console.log("[Gemini Cache] Hit for URL:", imageUrl);
    return cached;
  }

  // Attempt image resizing/compression first to minimize payload
  let base64 = "";
  let mimeType = "image/jpeg";
  try {
    const resized = await resizeAndCompressImage(imageUrl, 768, 0.85);
    base64 = resized.base64;
    mimeType = resized.mimeType;
    console.log(`[Gemini Payload] Compressed external URL image: ~${Math.round((base64.length * 3) / 4 / 1024)} KB`);
  } catch (err) {
    console.warn("[Gemini Payload] Compression failed/CORS block, fetching original URL:", err);
    const original = await imageUrlToBase64(imageUrl);
    base64 = original.base64;
    mimeType = original.mimeType;
  }

  const result = await callGeminiVisionAPI(base64, mimeType, apiKey, signal);
  setCachedAnalysis(cacheKey, result);
  return result;
}

export interface QuotaErrorDetails {
  type: "minute" | "day" | "unknown";
  message: string;
  resetTimeMessage: string;
}

export function parseQuotaError(errorMsg: string, lang: "vi" | "en"): QuotaErrorDetails {
  const isVi = lang === "vi";
  
  // Try to parse the JSON if it's from Gemini API
  let details = "";
  try {
    const jsonStart = errorMsg.indexOf("{");
    if (jsonStart !== -1) {
      const jsonStr = errorMsg.substring(jsonStart);
      const parsed = JSON.parse(jsonStr);
      details = parsed.error?.message || parsed.message || "";
    }
  } catch {
    // Fallback to raw string search
  }
  
  if (!details) {
    details = errorMsg;
  }

  const detailsLower = details.toLowerCase();
  
  // Check if it's a daily quota limit
  if (
    detailsLower.includes("day") || 
    detailsLower.includes("daily") || 
    detailsLower.includes("per day") ||
    detailsLower.includes("rpd") ||
    (detailsLower.includes("limit_exceeded") && detailsLower.includes("day"))
  ) {
    return {
      type: "day",
      message: details,
      resetTimeMessage: isVi 
        ? "Hạn ngạch ngày của AI (Gemini) đã hết. Hạn ngạch sẽ tự động được làm mới sau 24 giờ (thường vào 14:00 chiều mai theo giờ Việt Nam)." 
        : "Daily AI quota (Gemini) has been exhausted. Quota will automatically refresh in 24 hours (usually around 14:00 tomorrow VN time)."
    };
  }
  
  // Check if it's a minute-based rate limit
  if (
    detailsLower.includes("minute") || 
    detailsLower.includes("rpm") || 
    detailsLower.includes("tpm") ||
    detailsLower.includes("queries per minute") ||
    detailsLower.includes("requests per minute") ||
    detailsLower.includes("too many requests") ||
    detailsLower.includes("resource_exhausted")
  ) {
    return {
      type: "minute",
      message: details,
      resetTimeMessage: isVi 
        ? "Giới hạn theo phút của AI (Gemini) đã hết. Vui lòng đợi từ 1-2 phút rồi thử lại." 
        : "Minute-based AI limit (RPM/TPM) reached. Please wait 1-2 minutes and try again."
    };
  }
  
  // Fallback
  return {
    type: "unknown",
    message: details,
    resetTimeMessage: isVi 
      ? "Hạn ngạch AI (Gemini) tạm thời hết hoặc không hoạt động. Vui lòng đợi 1-2 phút hoặc thử lại sau." 
      : "Gemini AI quota is temporarily exhausted or unavailable. Please wait 1-2 minutes or try again later."
  };
}
