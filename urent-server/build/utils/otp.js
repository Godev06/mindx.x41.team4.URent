"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
exports.generateOtp = generateOtp;
