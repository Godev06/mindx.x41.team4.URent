import type { AuthSession, AuthUser, MutationResult } from "../types";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === "object" && value !== null;
};

const getRecord = (value: unknown): UnknownRecord | null => {
  return isRecord(value) ? value : null;
};

export const unwrapApiData = (value: unknown): unknown => {
  const record = getRecord(value);

  if (!record) {
    return value;
  }

  if (record.data !== undefined) {
    return record.data;
  }

  return value;
};

export const extractMessage = (
  value: unknown,
  fallback = "Yeu cau da duoc xu ly.",
): string => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  const record = getRecord(value);

  if (!record) {
    return fallback;
  }

  const candidateKeys = ["message", "error", "detail", "title"];
  for (const key of candidateKeys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return fallback;
};

export const extractToken = (value: unknown): string | null => {
  const record = getRecord(value);

  if (!record) {
    return null;
  }

  const candidateKeys = ["token", "accessToken", "access_token", "jwt"];
  for (const key of candidateKeys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return extractToken(record.data);
};

export const mapAuthUser = (value: unknown): AuthUser | null => {
  const baseRecord = getRecord(unwrapApiData(value));
  const nestedUser = baseRecord?.user ?? baseRecord?.profile ?? baseRecord?.account;
  const userRecord = getRecord(nestedUser) ?? baseRecord;

  if (!userRecord) {
    return null;
  }

  const email =
    typeof userRecord.email === "string" ? userRecord.email.trim() : "";

  if (!email) {
    return null;
  }

  const displayNameCandidates = [
    userRecord.displayName,
    userRecord.name,
    userRecord.fullName,
    userRecord.username,
  ];
  const avatarCandidates = [userRecord.avatarUrl, userRecord.avatar, userRecord.photoUrl];

  return {
    id: String(userRecord.id ?? userRecord._id ?? userRecord.userId ?? email),
    email,
    displayName:
      displayNameCandidates.find(
        (candidate) => typeof candidate === "string" && candidate.trim(),
      )?.toString() ?? email,
    bio: typeof userRecord.bio === "string" ? userRecord.bio : null,
    phone: typeof userRecord.phone === "string" ? userRecord.phone : null,
    avatarUrl:
      avatarCandidates.find(
        (candidate) => typeof candidate === "string" && candidate.trim(),
      )?.toString() ?? null,
    createdAt:
      typeof userRecord.createdAt === "string"
        ? userRecord.createdAt
        : typeof userRecord.created_at === "string"
          ? userRecord.created_at
          : null,
  };
};

export const mapMutationResult = (
  value: unknown,
  fallback: string,
): MutationResult => {
  const record = getRecord(unwrapApiData(value)) ?? getRecord(value);

  return {
    message: extractMessage(value, fallback),
    requiresTwoFactor:
      typeof record?.requiresTwoFactor === "boolean"
        ? record.requiresTwoFactor
        : undefined,
  };
};

export const mapAuthSession = (
  value: unknown,
  fallback: string,
): AuthSession | null => {
  const token = extractToken(value);

  if (!token) {
    return null;
  }

  return {
    token,
    user: mapAuthUser(value),
    message: extractMessage(value, fallback),
  };
};
