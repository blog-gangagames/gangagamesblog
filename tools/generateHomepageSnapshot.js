#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Reuse service role credentials like generateStaticPosts.js for reliable reads
const supabaseUrl = 'https://wzeoxjjybtfiupzjwrti.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDMzMDg3NCwiZXhwIjoyMDc1OTA2ODc0fQ.ptLlprTH19ujrOJmw4deaT-jt4YQTNQtzEpbMBVBfH0';
const supabase = createClient(supabaseUrl, supabaseKey);

function log(msg) { console.log(msg); }

function slugifyTitle(title) {
  if (!title) return '';
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function fetchHomepagePosts(limit = 30) {
  const fields = 'id,title,image_url,created_at,published_at,status,main_category,subcategory';
  const { data, error } = await supabase
    .from('posts')
    .select(fields)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

function formatSnapshot(posts) {
  // Keep only fields homepage uses; ensure predictable ordering
  return posts.map(p => ({
    id: p.id,
    title: p.title,
    image_url: p.image_url || '',
    created_at: p.created_at || null,
    published_at: p.published_at || null,
    status: p.status || 'published',
    main_category: p.main_category || '',
    subcategory: p.subcategory || '',
    slug: slugifyTitle(p.title || ''),
  }));
}

function injectInlineSnapshot(indexPath, jsonArray) {
  const html = fs.readFileSync(indexPath, 'utf8');
  const pretty = JSON.stringify(jsonArray, null, 2);
  const startTag = '<script type="application/json" id="home-snapshot">';
  const endTag = '</script>';
  const startIdx = html.indexOf(startTag);
  if (startIdx === -1) {
    throw new Error('home-snapshot script tag not found in index.html');
  }
  const afterStart = startIdx + startTag.length;
  const endIdx = html.indexOf(endTag, afterStart);
  if (endIdx === -1) {
    throw new Error('home-snapshot end tag not found in index.html');
  }
  const before = html.slice(0, afterStart);
  const after = html.slice(endIdx);
  const newHtml = `${before}\n${pretty}\n${after}`;
  fs.writeFileSync(indexPath, newHtml, 'utf8');
}

function writeLocalSnapshot(publicDir, jsonArray) {
  const outPath = path.join(publicDir, 'homepage.inline.json');
  fs.writeFileSync(outPath, JSON.stringify(jsonArray, null, 2), 'utf8');
  return outPath;
}

async function main() {
  try {
    log('🚀 Generating inline homepage snapshot...');
    const posts = await fetchHomepagePosts(30);
    log(`✅ Fetched ${posts.length} published posts`);
    const snapshot = formatSnapshot(posts);

    const publicDir = path.join(__dirname, '..', 'public');
    const indexPath = path.join(publicDir, 'index.html');

    // Safe write of local JSON copy for debugging/auditing
    const outPath = writeLocalSnapshot(publicDir, snapshot);
    log(`📝 Wrote local snapshot: ${path.relative(process.cwd(), outPath)}`);

    // Inject inline snapshot into index.html
    injectInlineSnapshot(indexPath, snapshot);
    log(`✨ Injected inline snapshot into ${path.relative(process.cwd(), indexPath)}`);

    log('🎉 Done. First paint will be instant on new visits.');
  } catch (err) {
    console.error('❌ Snapshot generation failed:', err.message);
    process.exit(1);
  }
}

main();