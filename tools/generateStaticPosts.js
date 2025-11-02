#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use service role key to bypass RLS
const supabaseUrl = 'https://wzeoxjjybtfiupzjwrti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMzMDg3NCwiZXhwIjoyMDc1OTA2ODc0fQ.ptLlprTH19ujrOJmw4deaT-jt4YQTNQtzEpbMBVBfH0';
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function generateStaticHTML() {
  console.log('🚀 Starting static HTML generation...\n');
  
  // Read template
  const templatePath = path.join(__dirname, '..', 'public', 'article-template.html');
  const template = fs.readFileSync(templatePath, 'utf8');
  console.log('✅ Template loaded\n');
  
  // Fetch posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`✅ Found ${posts.length} posts\n`);
  
  let success = 0;
  let failed = 0;
  const siteDomain = (process.env.NEXT_PUBLIC_DOMAIN || process.env.SITE_DOMAIN || 'https://gangagamesblog.com').replace(/\/$/, '');
  
  for (const post of posts) {
    try {
      // Generate slug locally if missing (do not depend on DB column)
      const postSlug = post.slug && String(post.slug).trim().length > 0 ? post.slug : slugify(post.title);
      
      // Prepare data
      const rawCategory = post.subcategory || post.main_category || 'uncategorized';
      const category = slugify(rawCategory);
      const html = template
        .replace(/\{\{TITLE\}\}/g, post.meta_title || post.title)
        .replace(/\{\{DESCRIPTION\}\}/g, post.meta_description || post.excerpt || '')
        .replace(/\{\{OG_IMAGE\}\}/g, post.og_image || post.image_url || '')
        .replace(/\{\{CANONICAL_URL\}\}/g, `${siteDomain}/${category}/${postSlug}`)
        .replace(/\{\{CATEGORY_SLUG\}\}/g, category)
        .replace(/\{\{CATEGORY_NAME\}\}/g, category)
        .replace(/\{\{PUBLISH_DATE\}\}/g, post.published_at ? new Date(post.published_at).toLocaleDateString() : '')
        .replace(/\{\{FEATURED_IMAGE\}\}/g, post.image_url || '')
        .replace(/\{\{CONTENT\}\}/g, post.content_html || '')
        .replace(/\{\{TAGS\}\}/g, '')
        .replace(/\{\{RELATED_POSTS\}\}/g, '')
        .replace(/\{\{SIDEBAR_POSTS\}\}/g, '');
      
      // Upload
      const { error: uploadError } = await supabase.storage
        .from('blog')
        .upload(`${postSlug}.html`, Buffer.from(html, 'utf8'), {
          contentType: 'text/html',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      console.log(`✅ ${postSlug}.html`);
      success++;
    } catch (err) {
      console.log(`❌ ${post.title}:`, err.message);
      failed++;
    }
  }
  
  console.log(`\n📊 Done! Success: ${success}, Failed: ${failed}`);
}

generateStaticHTML();
