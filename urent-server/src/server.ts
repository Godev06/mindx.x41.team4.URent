import http from 'http';
import { app } from './app';
import { connectDb } from './config/db';
import { env } from './config/env';
import { initRealtime } from './realtime/socket';

const start = async () => {
  await connectDb();
  const server = http.createServer(app);
  initRealtime(server);

  server.listen(env.port, () => {
    console.log(`Backend running at http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
