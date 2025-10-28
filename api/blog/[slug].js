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

    // Fetch HTML from Supabase storage
    const { data, error } = await supabase.storage
      .from('blog')
      .download(`${slug}.html`);

    if (error) {
      console.error('Error fetching HTML from Supabase:', error);
      
      // If file not found, return 404
      if (error.message.includes('Object not found')) {
        return res.status(404).json({ 
          error: 'Post not found',
          message: `No static HTML found for slug: ${slug}`
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch post',
        message: 'Internal server error'
      });
    }

    // Convert blob to text
    const htmlContent = await data.text();

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // Cache for 1 hour
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Return the HTML content
    return res.status(200).send(htmlContent);

  } catch (error) {
    console.error('Error in blog API handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  }
}
