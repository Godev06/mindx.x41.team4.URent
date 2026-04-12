import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env';

export const connectDb = async () => {
  if (env.dnsServers.length > 0) {
    dns.setServers(env.dnsServers);
  }

  const primaryUri = env.mongoUri || env.mongoUriFallback;

  try {
    await mongoose.connect(primaryUri);
  } catch (error) {
    const code = (error as { code?: string }).code;
    const syscall = (error as { syscall?: string }).syscall;
    const isSrvDnsError = code === 'ECONNREFUSED' && syscall === 'querySrv';

    if (isSrvDnsError && env.mongoUriFallback && env.mongoUri) {
      console.warn('MongoDB SRV DNS lookup failed. Retrying with MONGO_URI_FALLBACK.');
      await mongoose.connect(env.mongoUriFallback);
      return;
    }

    if (isSrvDnsError) {
      console.error('MongoDB SRV DNS lookup failed. Configure DNS_SERVERS or set MONGO_URI_FALLBACK (non-SRV URI).');
    }

    throw error;
  }
};
