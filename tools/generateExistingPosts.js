#!/usr/bin/env node

/**
 * Script to generate static HTML for all existing published posts
 * 
 * Usage:
 *   node tools/generateExistingPosts.js
 *   npm run generate-static
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting static HTML generation for existing posts...\n');

try {
  // Change to admin directory
  const adminDir = path.join(__dirname, '..', 'admin');
  process.chdir(adminDir);

  // Check if TypeScript is available
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
  } catch (error) {
    console.log('📦 Installing TypeScript...');
    execSync('npm install typescript @types/node --save-dev', { stdio: 'inherit' });
  }

  // Compile and run the TypeScript script
  console.log('🔨 Compiling TypeScript...');
  execSync('npx tsc admin/src/scripts/generateExistingPosts.ts --outDir admin/dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports', { stdio: 'inherit' });

  console.log('🏃 Running generation script...');
  execSync('node admin/dist/scripts/generateExistingPosts.js', { stdio: 'inherit' });

  console.log('\n✅ Static HTML generation completed successfully!');

} catch (error) {
  console.error('\n❌ Error running static HTML generation:', error.message);
  process.exit(1);
}
