import type { VercelRequest, VercelResponse } from '@vercel/node';
import { app } from '../urent-server/src/app';
import { connectDb } from '../urent-server/src/config/db';
import { initializeFirebase } from '../urent-server/src/config/firebase';

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
