import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../src/app';
import { connectDb } from '../src/config/db';
import { initializeFirebase } from '../src/config/firebase';

let isDbConnected = false;

const ensureDbConnected = async () => {
  if (isDbConnected) return;
  initializeFirebase();
  await connectDb();
  isDbConnected = true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureDbConnected();
  return app(req, res);
}
