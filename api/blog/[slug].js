const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://wzeoxjjybtfiupzjwrti.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0';
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({ error: 'Slug parameter is required' });
    }

    console.log(`Fetching static HTML for slug: ${slug}`);

    // Try multiple slug formats in case of variations
    const slugVariations = [
      slug,
      slug.toLowerCase(),
      slug.replace(/-/g, '_'),
      slug.replace(/_/g, '-'),
    ];

    let data = null;
    let error = null;
    let triedSlug = null;

    // Try each variation until one works
    for (const slugVar of slugVariations) {
      const result = await supabase.storage
        .from('blog')
        .download(`${slugVar}.html`);
      
      if (!result.error && result.data) {
        data = result.data;
        triedSlug = slugVar;
        break;
      }
      
      // If this wasn't "not found", it's a real error - break
      if (result.error && !result.error.message?.includes('Object not found')) {
        error = result.error;
        break;
      }
    }

    if (!data && !error) {
      // File not found in storage - try to find post in database
      error = { message: 'Object not found', code: 'NOT_FOUND' };
      
      try {
        // Try to find post by slug (exact match or slugified title)
        const { data: posts, error: dbError } = await supabase
          .from('posts')
          .select('id, title, slug')
          .eq('status', 'published')
          .limit(50);
        
        if (!dbError && posts && posts.length > 0) {
          // Find matching post by comparing slugified titles
          const slugify = (str) => String(str || '').toLowerCase()
            .replace(/['"]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          
          const targetSlug = slugify(slug);
          const matchingPost = posts.find(p => {
            const postSlug = slugify(p.slug || p.title);
            return postSlug === targetSlug;
          });
          
          if (matchingPost) {
            // Post exists in DB but no static HTML - redirect to article-detail page
            // The article-detail page will load content from DB seamlessly
            const redirectUrl = `/article-detail-v1.html?slug=${encodeURIComponent(slug)}${matchingPost.id ? '&id=' + encodeURIComponent(matchingPost.id) : ''}`;
            res.setHeader('Location', redirectUrl);
            res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
            return res.status(307).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Loading article...</title>
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
</head>
<body><p>Loading article...</p></body>
</html>`);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback lookup failed:', fallbackError);
      }
    }

    if (error || !data) {
      console.error('Error fetching HTML from Supabase:', error || 'No data found');
      
      // If file not found, try to serve article-detail shell instead of 404
      // This ensures no 404 errors when clicking from homepage
      if (error && error.message && error.message.includes('Object not found')) {
        try {
          // Try to find post in database first
          const { data: posts, error: dbError } = await supabase
            .from('posts')
            .select('id, title, slug')
            .eq('status', 'published')
            .limit(50);
          
          if (!dbError && posts && posts.length > 0) {
            const slugify = (str) => String(str || '').toLowerCase()
              .replace(/['"]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            
            const targetSlug = slugify(slug);
            const matchingPost = posts.find(p => {
              const postSlug = slugify(p.slug || p.title);
              return postSlug === targetSlug;
            });
            
            if (matchingPost) {
              // Redirect to article-detail page which will load content from DB
              const redirectUrl = `/article-detail-v1.html?slug=${encodeURIComponent(slug)}${matchingPost.id ? '&id=' + encodeURIComponent(matchingPost.id) : ''}`;
              res.setHeader('Location', redirectUrl);
              res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
              return res.status(307).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Loading article...</title>
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
</head>
<body><p>Loading article...</p></body>
</html>`);
            }
          }
          
          // If post not found in DB, redirect to article-detail page anyway
          // It will try to load from DB and handle gracefully
          const redirectUrl = `/article-detail-v1.html?slug=${encodeURIComponent(slug)}`;
          res.setHeader('Location', redirectUrl);
          res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
          return res.status(307).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Loading article...</title>
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
</head>
<body><p>Loading article...</p></body>
</html>`);
        } catch (fallbackError) {
          console.error('Fallback to article shell failed:', fallbackError);
          // Even if DB lookup fails, still redirect to article-detail page
          // It will handle the error gracefully client-side
          const redirectUrl = `/article-detail-v1.html?slug=${encodeURIComponent(slug)}`;
          res.setHeader('Location', redirectUrl);
          res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
          return res.status(307).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Loading article...</title>
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
</head>
<body><p>Loading article...</p></body>
</html>`);
        }
        
        // This should never be reached, but as absolute last resort, redirect instead of 404
        const redirectUrl = `/article-detail-v1.html?slug=${encodeURIComponent(slug)}`;
        res.setHeader('Location', redirectUrl);
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
        return res.status(307).send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Loading article...</title>
  <script>window.location.href = ${JSON.stringify(redirectUrl)};</script>
</head>
<body><p>Loading article...</p></body>
</html>`);
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch post',
        message: 'Internal server error'
      });
    }

    // Convert blob to text
    const htmlContent = await data.text();
    console.log(`Successfully fetched HTML for slug: ${triedSlug || slug}`);

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache for 1 hour
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Inject or replace canonical if needed
    try {
      const baseDomain = (process.env.NEXT_PUBLIC_DOMAIN || process.env.SITE_DOMAIN || 'https://www.gangagamesblog.com').replace(/\/$/, '');
      const effectiveSlug = String(triedSlug || slug).toLowerCase();
      const canonicalUrl = `${baseDomain}/blog/${effectiveSlug}/`;
      let finalHtml = htmlContent;
      if (finalHtml.indexOf('{{CANONICAL_URL}}') !== -1) {
        finalHtml = finalHtml.replace(/{{CANONICAL_URL}}/g, canonicalUrl);
      } else if (!/rel=['"]canonical['"]/i.test(finalHtml)) {
        finalHtml = finalHtml.replace(/<\/head>/i, `<link rel="canonical" href="${canonicalUrl}">\n<meta property="og:url" content="${canonicalUrl}">\n</head>`);
      }
      // Return the HTML content
      return res.status(200).send(finalHtml);
    } catch(_) {
      // Fallback to original content if injection fails
      return res.status(200).send(htmlContent);
    }

  } catch (error) {
    console.error('Error in blog API handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
}
