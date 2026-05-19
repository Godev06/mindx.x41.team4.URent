import mongoose from 'mongoose';

export interface DecodedCursor {
  createdAt: Date;
  id: mongoose.Types.ObjectId;
}

const encodePlain = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
const decodePlain = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

export const encodeCursor = (createdAt: Date, id: mongoose.Types.ObjectId | string) => {
  return encodePlain(`${createdAt.toISOString()}|${String(id)}`);
};

export const decodeCursor = (cursor?: string | null): DecodedCursor | null => {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = decodePlain(cursor);
    const [createdAtRaw, idRaw] = decoded.split('|');

    if (!createdAtRaw || !idRaw || !mongoose.Types.ObjectId.isValid(idRaw)) {
      return null;
    }

    const createdAt = new Date(createdAtRaw);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }

    return { createdAt, id: new mongoose.Types.ObjectId(idRaw) };
  } catch {
    return null;
  }
};
