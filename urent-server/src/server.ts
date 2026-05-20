import 'dotenv/config';
import dns from 'node:dns';
import { app } from './app';
import { initializeFirebase } from './config/firebase';

dns.setDefaultResultOrder('ipv4first');
initializeFirebase();

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`\n🚀 [ SERVER ] Backend đang chạy tại http://localhost:${PORT}\n`);
    });
  }

export default app;
