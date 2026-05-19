import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to run commands
function run(cmd, inherit = true, cwd = __dirname) {
  try {
    return execSync(cmd, { stdio: inherit ? 'inherit' : 'pipe', encoding: 'utf8', cwd });
  } catch (err) {
    if (!inherit) return null;
    throw err;
  }
}

console.log('🚀 Starting Vercel Environment Sync...');

// 1. Install Vercel CLI if not installed
try {
  run('npx vercel --version', false);
  console.log('✅ Vercel CLI is available.');
} catch (e) {
  console.log('⏳ Installing Vercel CLI globally...');
  run('npm install -g vercel');
}

// 2. Login to Vercel
console.log('🔑 Logging into Vercel (Interactive)...');
try {
  run('npx vercel login');
} catch (e) {
  console.log('❌ Vercel login failed or aborted.');
  process.exit(1);
}

const syncEnvForProject = (projectDir) => {
  console.log(`\n📂 Processing project: ${projectDir}`);
  const envPath = path.join(__dirname, projectDir, '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log(`⚠️ No .env file found in ${projectDir}. Skipping.`);
    return { uploaded: [], skipped: [] };
  }

  // Ensure project is linked
  console.log('🔗 Linking Vercel project (Please follow prompts if it asks)...');
  try {
    run('npx vercel link --yes', true, path.join(__dirname, projectDir));
  } catch (e) {
    console.log('⚠️ Project link might have required interaction. Trying again interactively...');
    try {
      run('npx vercel link', true, path.join(__dirname, projectDir));
    } catch(err) {
      console.error('❌ Failed to link project. Please link it manually first.');
    }
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      envVars[match[1]] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    }
  });

  const uploaded = [];
  const skipped = [];

  // Get existing envs
  console.log('🔍 Fetching existing Vercel environments...');
  let existingEnvsStr = '';
  try {
    existingEnvsStr = run('npx vercel env ls', false, path.join(__dirname, projectDir)) || '';
  } catch (e) {
    console.log('⚠️ Could not fetch existing env vars. Proceeding anyway.');
  }

  const existingKeys = existingEnvsStr.split('\n')
    .map(line => line.trim().split(/\s+/)[0])
    .filter(key => key && !['name', 'Environment'].includes(key));

  for (const [key, value] of Object.entries(envVars)) {
    if (existingKeys.includes(key)) {
      console.log(`⏭️  Skipping ${key} (already exists)`);
      skipped.push(key);
      continue;
    }
    console.log(`⬆️  Uploading ${key}...`);
    try {
      // Create a temporary file to avoid command line escaping issues
      const tmpFile = path.join(__dirname, projectDir, '.env.tmp.txt');
      fs.writeFileSync(tmpFile, value);
      
      // Push to all environments
      run(`npx vercel env add ${key} production < .env.tmp.txt`, true, path.join(__dirname, projectDir));
      run(`npx vercel env add ${key} preview < .env.tmp.txt`, true, path.join(__dirname, projectDir));
      run(`npx vercel env add ${key} development < .env.tmp.txt`, true, path.join(__dirname, projectDir));
      
      fs.unlinkSync(tmpFile);
      uploaded.push(key);
    } catch (e) {
      console.error(`❌ Failed to upload ${key}`);
    }
  }

  // Redeploy
  console.log('🚀 Redeploying without cache...');
  try {
    run('npx vercel --force', true, path.join(__dirname, projectDir));
    console.log('✅ Deployment triggered successfully.');
  } catch (e) {
    console.error('❌ Deployment failed.');
  }
  
  return { uploaded, skipped };
};

const serverStats = syncEnvForProject('urent-server');
const clientStats = syncEnvForProject('urent-client');

console.log('\n=======================================');
console.log('🎉 SYNC COMPLETE');
console.log('=======================================');
console.log('Server Variables Uploaded:', serverStats.uploaded.length > 0 ? serverStats.uploaded.join(', ') : 'None');
console.log('Server Variables Skipped:', serverStats.skipped.length > 0 ? serverStats.skipped.join(', ') : 'None');
console.log('Client Variables Uploaded:', clientStats.uploaded.length > 0 ? clientStats.uploaded.join(', ') : 'None');
console.log('Client Variables Skipped:', clientStats.skipped.length > 0 ? clientStats.skipped.join(', ') : 'None');
console.log('=======================================');
