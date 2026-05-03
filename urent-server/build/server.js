"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const firebase_1 = require("./config/firebase");
const socket_1 = require("./realtime/socket");
const start = async () => {
    (0, firebase_1.initializeFirebase)();
    await (0, db_1.connectDb)();
    const server = http_1.default.createServer(app_1.app);
    (0, socket_1.initRealtime)(server);
    server.listen(env_1.env.port, () => {
        const e = '\x1b';
        const reset = `${e}[0m`;
        const bold = `${e}[1m`;
        const dim = `${e}[2m`;
        const cyan = `${e}[96m`;
        const yellow = `${e}[93m`;
        const blue = `${e}[94m`;
        const green = `${e}[92m`;
        console.log('');
        console.log(`${bold}${cyan}  URent Server${reset}`);
        console.log(`${dim}  ──────────────────────────────────────────${reset}`);
        console.log(`  ${green}${bold}API   ${reset}  ${blue}${bold}http://localhost:${env_1.env.port}${reset}`);
        console.log(`  ${yellow}${bold}Docs  ${reset}  ${blue}${bold}http://localhost:${env_1.env.port}/api-docs${reset}`);
        console.log(`${dim}  ──────────────────────────────────────────${reset}`);
        console.log('');
    });
};
start().catch((error) => {
    console.error(error);
    process.exit(1);
});
