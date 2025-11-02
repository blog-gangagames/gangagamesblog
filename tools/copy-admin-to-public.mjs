import { cpSync, rmSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const adminDist = resolve(repoRoot, 'admin', 'dist');
const targetDir = resolve(repoRoot, 'public', 'admin');

if (!existsSync(adminDist)) {
  throw new Error(`Admin dist not found at ${adminDist}. Did you run the admin build?`);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(adminDist, targetDir, { recursive: true });
console.log(`Copied admin dist to ${targetDir}`);


