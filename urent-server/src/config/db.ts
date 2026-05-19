import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env';

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 10000, // fail fast after 10s instead of hanging
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  maxIdleTimeMS: 10000, // Keep idle connections for only 10s
};

export const connectDb = async () => {
  if (env.dnsServers.length > 0) {
    try {
      dns.setServers(env.dnsServers);
    } catch (e) {
      console.warn('dns.setServers is not supported in this environment');
    }
  }

  const primaryUri = env.mongoUri || env.mongoUriFallback;

  try {
    await mongoose.connect(primaryUri, MONGO_OPTIONS);
  } catch (error) {
    const syscall = (error as { syscall?: string }).syscall;
    // Catch any DNS-related error (ENOTFOUND, ECONNREFUSED, SERVFAIL, etc.)
    const isDnsError = syscall === 'querySrv' || syscall === 'queryA' || syscall === 'queryAAAA';

    if (isDnsError && env.mongoUriFallback && env.mongoUri) {
      console.warn('MongoDB SRV DNS lookup failed. Retrying with MONGO_URI_FALLBACK.');
      await mongoose.connect(env.mongoUriFallback, MONGO_OPTIONS);
      return;
    }

    throw error;
  }
};
