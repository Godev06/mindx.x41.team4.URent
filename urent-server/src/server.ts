import 'dotenv/config';
import dns from 'node:dns';
import { app } from './app';
import { initializeFirebase } from './config/firebase';

dns.setDefaultResultOrder('ipv4first');
initializeFirebase();

export default app;
