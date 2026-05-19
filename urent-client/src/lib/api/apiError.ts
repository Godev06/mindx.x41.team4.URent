import axios from "axios";

export class ApiError extends Error {
  statusCode?: number;
  details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

const extractMessageFromPayload = (payload: unknown): string | null => {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (Array.isArray(payload)) {
    const messages = payload
      .map((item) => extractMessageFromPayload(item))
      .filter(Boolean);
    return messages[0] ?? null;
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    const candidates = [
      record.message,
      record.error,
      record.detail,
      record.title,
      record.errors,
    ];

    for (const candidate of candidates) {
      const message = extractMessageFromPayload(candidate);
      if (message) {
        return message;
      }
    }
  }

  return null;
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const message =
      extractMessageFromPayload(error.response?.data) ??
      error.message ??
      "Khong the ket noi den may chu.";

    return new ApiError(message, statusCode, error.response?.data);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("Da co loi khong xac dinh xay ra.");
};
