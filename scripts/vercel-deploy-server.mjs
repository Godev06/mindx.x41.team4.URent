#!/usr/bin/env node
/**
 * Deploy urent-server to Vercel (separate API project).
 * Usage: node scripts/vercel-deploy-server.mjs [--prod] [--sync-env]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER_DIR = path.join(ROOT, 'urent-server');
const PROJECT_NAME = process.env.VERCEL_API_PROJECT || 'mindx-urent-api';
const isProd = process.argv.includes('--prod');
const syncEnv = process.argv.includes('--sync-env');

function run(cmd, args, opts = {}) {
  const cwd = opts.cwd ?? SERVER_DIR;
  console.log(`\n> ${cmd} ${args.join(' ')}\n`);
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...opts.env },
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

function runCapture(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd ?? SERVER_DIR,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// 1. Login check
const whoami = runCapture('npx', ['vercel', 'whoami'], { cwd: ROOT });
if (whoami.status !== 0) {
  console.error('Chưa đăng nhập Vercel. Chạy: npx vercel login');
  process.exit(1);
}
console.log(`Vercel user: ${whoami.stdout.trim()}`);

const inspect = runCapture('npx', ['vercel', 'project', 'inspect', PROJECT_NAME], { cwd: ROOT });
if (inspect.stdout.includes('Root Directory\t\t.')) {
  console.warn(
    `\n⚠️  Project "${PROJECT_NAME}" đang dùng Root Directory = "." (repo root).\n` +
      '   Vào Vercel → Settings → Root Directory → đặt: urent-server\n' +
      '   https://vercel.com/godev06s-projects/mindx-urent-api/settings\n'
  );
}

// 2. Ensure API project exists
const projects = runCapture('npx', ['vercel', 'project', 'ls'], { cwd: ROOT });
if (!projects.stdout.includes(PROJECT_NAME)) {
  console.log(`Tạo project mới: ${PROJECT_NAME}`);
  const created = runCapture('npx', ['vercel', 'project', 'add', PROJECT_NAME], { cwd: ROOT });
  if (created.status !== 0) {
    console.warn('Không tạo được project (có thể đã tồn tại). Tiếp tục link...');
  }
} else {
  console.log(`Dùng project có sẵn: ${PROJECT_NAME}`);
}

// 3. Link urent-server → API project (never frontend project)
const vercelDir = path.join(SERVER_DIR, '.vercel');
if (fs.existsSync(vercelDir)) {
  const linkFile = path.join(vercelDir, 'project.json');
  if (fs.existsSync(linkFile)) {
    const link = JSON.parse(fs.readFileSync(linkFile, 'utf8'));
    if (link.projectName === 'mindx-x41-team4-u-rent') {
      fs.rmSync(vercelDir, { recursive: true, force: true });
      console.log('Đã xóa link nhầm tới project frontend.');
    }
  }
}

run('npx', ['vercel', 'link', '--yes', '--project', PROJECT_NAME], { cwd: SERVER_DIR });

// 4. Optional: sync .env → Vercel Preview (skip secrets in logs)
if (syncEnv) {
  const envPath = path.join(SERVER_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn('Không có urent-server/.env — bỏ qua --sync-env');
  } else {
    const envTarget = isProd ? 'production' : 'preview';
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    const skip = new Set(['PORT', 'NODE_ENV']);
    for (const line of lines) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!m || line.trimStart().startsWith('#')) continue;
      const [, key, raw] = m;
      if (skip.has(key)) continue;
      let value = raw.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      console.log(`  env add ${key} (${envTarget})`);
      const input = spawnSync('npx', ['vercel', 'env', 'add', key, envTarget, '--force'], {
        cwd: SERVER_DIR,
        input: value,
        encoding: 'utf8',
        shell: process.platform === 'win32',
        stdio: ['pipe', 'inherit', 'inherit'],
      });
      if (input.status !== 0) {
        console.warn(`  ⚠ Không thêm được ${key} (có thể đã tồn tại)`);
      }
    }
  }
}

// 5. Build check locally
run('npm', ['run', 'vercel-build'], { cwd: SERVER_DIR });

// 6. Deploy
const deployArgs = ['vercel', 'deploy', '--yes'];
if (isProd) deployArgs.push('--prod');
run('npx', deployArgs, { cwd: SERVER_DIR });

console.log('\n✅ Deploy server xong.');
console.log('Tiếp theo: cập nhật VITE_API_BASE_URL trên project frontend → redeploy client.');
console.log(`   npm run vercel:client${isProd ? ':prod' : ''}`);
