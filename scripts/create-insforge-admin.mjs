/**
 * One-time script: create the super administrator in InsForge Auth.
 * Run from project root: node scripts/create-insforge-admin.mjs
 * Requires .env with VITE_INSFORGE_BASE_URL and VITE_INSFORGE_ANON_KEY.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@insforge/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

function loadEnv() {
  const paths = [resolve(projectRoot, '.env'), resolve(process.cwd(), '.env')];
  for (const envPath of paths) {
    try {
      const raw = readFileSync(envPath, 'utf8');
      const env = {};
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
      return env;
    } catch (_) {}
  }
  console.error('Could not read .env from', paths.join(' or '));
  process.exit(1);
}

const env = loadEnv();
const baseUrl = env.VITE_INSFORGE_BASE_URL || '';
const anonKey = env.VITE_INSFORGE_ANON_KEY || '';

if (!baseUrl || !anonKey) {
  console.error('Missing VITE_INSFORGE_BASE_URL or VITE_INSFORGE_ANON_KEY in .env');
  process.exit(1);
}

const email = 'amabotsi@gmail.com';
const password = 'aUGUtus@7010';
const name = 'Super Administrator';

async function main() {
  const client = createClient({ baseUrl, anonKey });

  const { data, error } = await client.auth.signUp({
    email,
    password,
    name,
    metadata: { roleId: 'role_super_admin', name },
  });

  if (error) {
    if (error.message && (error.message.includes('already') || error.message.includes('exists') || error.message.includes('registered'))) {
      console.log('User already exists in InsForge Auth. You can sign in with:', email);
      return;
    }
    console.error('Sign up error:', error.message || error);
    process.exit(1);
  }

  console.log('Super administrator created in InsForge Auth.');
  console.log('Email:', email);
  console.log('Name:', name);
  if (data?.user?.id) console.log('User ID:', data.user.id);
  console.log('\nIf the app uses user_metadata.roleId, set it in the InsForge Dashboard:');
  console.log('  Auth → Users → select this user → Edit metadata → add roleId: "role_super_admin"');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
