#!/usr/bin/env node
/**
 * Deploy urent-client to Vercel (frontend project).
 * Usage: node scripts/vercel-deploy-client.mjs [--prod]
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(ROOT, 'urent-client');
const PROJECT_NAME = process.env.VERCEL_CLIENT_PROJECT || 'mindx-x41-team4-u-rent';
const isProd = process.argv.includes('--prod');

function run(cmd, args, opts = {}) {
  const cwd = opts.cwd ?? CLIENT_DIR;
  console.log(`\n> ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function runCapture(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return { status: r.status ?? 1, stdout: r.stdout ?? '' };
}

const whoami = runCapture('npx', ['vercel', 'whoami']);
if (whoami.status !== 0) {
  console.error('Chưa đăng nhập Vercel. Chạy: npx vercel login');
  process.exit(1);
}

run('npx', ['vercel', 'link', '--yes', '--project', PROJECT_NAME], { cwd: CLIENT_DIR });
run('npm', ['run', 'build'], { cwd: CLIENT_DIR });

const deployArgs = ['vercel', 'deploy', '--yes'];
if (isProd) deployArgs.push('--prod');
run('npx', deployArgs, { cwd: CLIENT_DIR });

console.log('\n✅ Deploy client xong.');
