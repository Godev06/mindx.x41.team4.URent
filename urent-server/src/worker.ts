import { handleAsNodeRequest } from 'cloudflare:node';
import http from 'http';
import { app } from './app';
import { connectDb } from './config/db';
import { initializeFirebase } from './config/firebase';
import { initRealtime } from './realtime/socket';

let isInitialized = false;

const server = http.createServer(app);
initRealtime(server);

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    if (!isInitialized) {
      // Pass environment variables from Cloudflare to process.env (or use env directly if preferred)
      Object.assign(process.env, env);
      
      initializeFirebase();
      await connectDb();
      isInitialized = true;
    }
    
    // Bridge the Cloudflare fetch Request to the Node.js HTTP server
    return handleAsNodeRequest(server, request);
  },
};
