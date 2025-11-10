const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wzeoxjjybtfiupzjwrti.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0';
const supabase = createClient(supabaseUrl, supabaseKey);

const SITE_DOMAIN = (process.env.NEXT_PUBLIC_DOMAIN || process.env.SITE_DOMAIN || 'https://www.gangagamesblog.com').replace(/\/$/, '');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function xmlHeader() {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
}

function xmlFooter() {
  return '</urlset>';
}

function urlEntry(loc, lastmod, changefreq = 'monthly', priority = 0.8) {
  return `\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Try to fetch published posts
    let posts = [];
    try {
      const result = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (result && !result.error && Array.isArray(result.data)) {
        posts = result.data;
      } else if (result && result.error) {
        console.error('Error fetching posts for sitemap (continuing with fallback):', result.error);
      }
    } catch (dbErr) {
      console.error('Database error for sitemap (continuing with fallback):', dbErr);
    }

    // Also try to list static post HTML files from Supabase Storage (blog bucket)
    // This ensures posts that exist as static HTML but aren't in the DB still appear in the sitemap
    let storageSlugs = [];
    try {
      const listRes = await supabase.storage
        .from('blog')
        .list('', { limit: 1000 });

      if (listRes && !listRes.error && Array.isArray(listRes.data)) {
        storageSlugs = listRes.data
          .filter(obj => obj && typeof obj.name === 'string' && obj.name.toLowerCase().endsWith('.html'))
          .map(obj => obj.name.replace(/\.html$/i, ''));
      } else if (listRes && listRes.error) {
        console.error('Error listing storage posts for sitemap (continuing):', listRes.error);
      }
    } catch (storageErr) {
      console.error('Storage list error for sitemap (continuing):', storageErr);
    }

    const today = new Date().toISOString().split('T')[0];
    let xml = xmlHeader();

    // Base pages
    xml += urlEntry(`${SITE_DOMAIN}/`, today, 'daily', 1.0);
    xml += urlEntry(`${SITE_DOMAIN}/contact.html`, today, 'monthly', 0.8);
    xml += urlEntry(`${SITE_DOMAIN}/search-result.html`, today, 'weekly', 0.6);

    // Collect category slugs from posts (if any)
    const categorySet = new Set();
    for (const p of posts || []) {
      const rawCategory = p.subcategory || p.main_category || 'uncategorized';
      categorySet.add(slugify(rawCategory));
    }

    // Category pages
    for (const cat of categorySet) {
      xml += urlEntry(`${SITE_DOMAIN}/category/${cat}/`, today, 'weekly', 0.7);
    }

    // Post pages
    for (const p of posts || []) {
      const postSlug = p.slug && String(p.slug).trim().length > 0 ? p.slug : slugify(p.title);
      const cat = slugify(p.subcategory || p.main_category || 'uncategorized');
      const lastmod = (p.updated_at || p.published_at) ? new Date(p.updated_at || p.published_at).toISOString().split('T')[0] : today;
      xml += urlEntry(`${SITE_DOMAIN}/${cat}/${postSlug}/`, lastmod, 'monthly', 0.8);
    }

    // Storage-only post pages (no DB record) — include under /blog/:slug
    // Deduplicate against DB-backed slugs
    try {
      const dbSlugSet = new Set((posts || []).map(p => {
        const s = p.slug && String(p.slug).trim().length > 0 ? p.slug : slugify(p.title);
        return slugify(s);
      }));

      for (const rawSlug of storageSlugs || []) {
        const s = slugify(rawSlug);
        if (!dbSlugSet.has(s)) {
          xml += urlEntry(`${SITE_DOMAIN}/blog/${s}/`, today, 'monthly', 0.6);
        }
      }
    } catch (dedupeErr) {
      console.error('Error adding storage-only posts to sitemap:', dedupeErr);
    }

    xml += `\n${xmlFooter()}`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    // Absolute fallback: return a minimal valid sitemap so Google can always fetch it
    try {
      const today = new Date().toISOString().split('T')[0];
      let xml = xmlHeader();
      xml += urlEntry(`${SITE_DOMAIN}/`, today, 'daily', 1.0);
      xml += urlEntry(`${SITE_DOMAIN}/contact.html`, today, 'monthly', 0.8);
      xml += urlEntry(`${SITE_DOMAIN}/search-result.html`, today, 'weekly', 0.6);
      xml += `\n${xmlFooter()}`;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=600');
      return res.status(200).send(xml);
    } catch (fatal) {
      console.error('Fatal sitemap fallback error:', fatal);
      return res.status(200).send(xmlHeader() + xmlFooter());
    }
  }
};