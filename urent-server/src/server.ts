import http from 'http';
import { app } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { initializeFirebase } from './config/firebase';
import { initRealtime } from './realtime/socket';

const start = async () => {
  initializeFirebase();
  await connectDb();
  const server = http.createServer(app);
  initRealtime(server);

  server.listen(env.port, () => {
    const e = '\x1b';
    const reset  = `${e}[0m`;
    const bold   = `${e}[1m`;
    const dim    = `${e}[2m`;
    const cyan   = `${e}[96m`;
    const yellow = `${e}[93m`;
    const blue   = `${e}[94m`;
    const green  = `${e}[92m`;

    console.log('');
    console.log(`${bold}${cyan}  URent Server${reset}`);
    console.log(`${dim}  ──────────────────────────────────────────${reset}`);
    console.log(`  ${green}${bold}API   ${reset}  ${blue}${bold}http://localhost:${env.port}${reset}`);
    console.log(`  ${yellow}${bold}Docs  ${reset}  ${blue}${bold}http://localhost:${env.port}/api-docs${reset}`);
    console.log(`${dim}  ──────────────────────────────────────────${reset}`);
    console.log('');
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
