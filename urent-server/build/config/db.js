"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const node_dns_1 = __importDefault(require("node:dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDb = async () => {
    if (env_1.env.dnsServers.length > 0) {
        node_dns_1.default.setServers(env_1.env.dnsServers);
    }
    const primaryUri = env_1.env.mongoUri || env_1.env.mongoUriFallback;
    try {
        await mongoose_1.default.connect(primaryUri);
    }
    catch (error) {
        const code = error.code;
        const syscall = error.syscall;
        const isSrvDnsError = code === 'ECONNREFUSED' && syscall === 'querySrv';
        if (isSrvDnsError && env_1.env.mongoUriFallback && env_1.env.mongoUri) {
            console.warn('MongoDB SRV DNS lookup failed. Retrying with MONGO_URI_FALLBACK.');
            await mongoose_1.default.connect(env_1.env.mongoUriFallback);
            return;
        }
        if (isSrvDnsError) {
            console.error('MongoDB SRV DNS lookup failed. Configure DNS_SERVERS or set MONGO_URI_FALLBACK (non-SRV URI).');
        }
        throw error;
    }
};
exports.connectDb = connectDb;
