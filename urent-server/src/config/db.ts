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
  const originalDnsServers = dns.getServers();

  if (env.dnsServers.length > 0) {
    try {
      console.log(`Setting custom DNS servers: ${env.dnsServers.join(', ')}`);
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
    const isDnsError = 
      syscall === 'querySrv' || 
      syscall === 'queryA' || 
      syscall === 'queryAAAA' || 
      (error instanceof Error && error.message.includes('ENOTFOUND'));

    console.warn('❌ MongoDB connection failed on primary attempt:', error instanceof Error ? error.message : error);

    // If we customized DNS and it failed, let's restore original system DNS and try again
    if (env.dnsServers.length > 0) {
      try {
        console.warn('🔄 Restoring original system DNS servers and retrying connection...');
        dns.setServers(originalDnsServers);
      } catch (e) {
        // ignore
      }

      try {
        await mongoose.connect(primaryUri, MONGO_OPTIONS);
        console.log('✅ Connected successfully to primary URI after restoring system DNS!');
        return;
      } catch (retryError) {
        console.error('❌ Retry with system DNS also failed:', retryError instanceof Error ? retryError.message : retryError);
      }
    }

    if (isDnsError && env.mongoUriFallback && env.mongoUri) {
      console.warn('MongoDB SRV DNS lookup failed. Retrying with MONGO_URI_FALLBACK.');
      try {
        // Ensure system DNS is restored for the fallback
        try {
          dns.setServers(originalDnsServers);
        } catch (e) {
          // ignore
        }
        await mongoose.connect(env.mongoUriFallback, MONGO_OPTIONS);
        console.log('✅ Connected successfully using MONGO_URI_FALLBACK after restoring system DNS!');
        return;
      } catch (fallbackError) {
        console.error('❌ Fallback connection also failed:', fallbackError instanceof Error ? fallbackError.message : fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
};
