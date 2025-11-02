#!/usr/bin/env node

/**
 * Test script for static HTML generation system
 * 
 * Usage:
 *   node tools/testStaticGeneration.js
 */

const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Static HTML Generation System...\n');

async function runTests() {
  try {
    // Test 1: Check if template file exists
    console.log('1️⃣ Checking article template...');
    const fs = require('fs');
    const templatePath = path.join(__dirname, '..', 'public', 'article-template.html');
    
    if (fs.existsSync(templatePath)) {
      console.log('✅ Article template found');
    } else {
      console.log('❌ Article template not found at:', templatePath);
      return;
    }

    // Test 2: Check if Vercel config exists
    console.log('\n2️⃣ Checking Vercel configuration...');
    const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
    
    if (fs.existsSync(vercelConfigPath)) {
      console.log('✅ Vercel configuration found');
    } else {
      console.log('❌ Vercel configuration not found');
      return;
    }

    // Test 3: Check if API function exists
    console.log('\n3️⃣ Checking API function...');
    const apiFunctionPath = path.join(__dirname, '..', 'api', 'blog', '[slug].js');
    
    if (fs.existsSync(apiFunctionPath)) {
      console.log('✅ API function found');
    } else {
      console.log('❌ API function not found');
      return;
    }

    // Test 4: Check if admin panel files exist
    console.log('\n4️⃣ Checking admin panel integration...');
    const adminDir = path.join(__dirname, '..', 'admin');
    const htmlGeneratorPath = path.join(adminDir, 'src', 'lib', 'htmlGenerator.ts');
    const sitemapGeneratorPath = path.join(adminDir, 'src', 'lib', 'sitemapGenerator.ts');
    const integrationPath = path.join(adminDir, 'src', 'lib', 'staticHtmlIntegration.ts');
    
    const adminFiles = [
      { name: 'HTML Generator', path: htmlGeneratorPath },
      { name: 'Sitemap Generator', path: sitemapGeneratorPath },
      { name: 'Static HTML Integration', path: integrationPath }
    ];

    let allAdminFilesExist = true;
    adminFiles.forEach(file => {
      if (fs.existsSync(file.path)) {
        console.log(`✅ ${file.name} found`);
      } else {
        console.log(`❌ ${file.name} not found`);
        allAdminFilesExist = false;
      }
    });

    if (!allAdminFilesExist) {
      console.log('\n❌ Some admin panel files are missing');
      return;
    }

    // Test 5: Check environment variables
    console.log('\n5️⃣ Checking environment variables...');
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    let allEnvVarsExist = true;
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar} is set`);
      } else {
        console.log(`❌ ${envVar} is not set`);
        allEnvVarsExist = false;
      }
    });

    if (!allEnvVarsExist) {
      console.log('\n⚠️ Some environment variables are missing. Make sure to set them in your Vercel project and admin panel.');
    }

    // Test 6: Test TypeScript compilation
    console.log('\n6️⃣ Testing TypeScript compilation...');
    try {
      process.chdir(adminDir);
      execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
      console.log('✅ TypeScript compilation successful');
    } catch (error) {
      console.log('❌ TypeScript compilation failed');
      console.log('Error:', error.message);
      return;
    }

    // Test 7: Test template placeholders
    console.log('\n7️⃣ Testing template placeholders...');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const requiredPlaceholders = [
      '{{TITLE}}',
      '{{DESCRIPTION}}',
      '{{CONTENT}}',
      '{{CATEGORY_SLUG}}',
      '{{CATEGORY_NAME}}',
      '{{PUBLISH_DATE}}',
      '{{FEATURED_IMAGE}}'
    ];

    let allPlaceholdersExist = true;
    requiredPlaceholders.forEach(placeholder => {
      if (templateContent.includes(placeholder)) {
        console.log(`✅ ${placeholder} found in template`);
      } else {
        console.log(`❌ ${placeholder} not found in template`);
        allPlaceholdersExist = false;
      }
    });

    if (!allPlaceholdersExist) {
      console.log('\n❌ Some required placeholders are missing from the template');
      return;
    }

    // Summary
    console.log('\n🎉 All tests passed! Your static HTML generation system is ready.');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy to Vercel: vercel --prod');
    console.log('2. Generate static HTML for existing posts: npm run generate-static');
    console.log('3. Test with a new post in your admin panel');
    console.log('4. Visit your post URL to see the static HTML in action');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
