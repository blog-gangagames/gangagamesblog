import { createClient } from '@supabase/supabase-js';

// Supabase configuration - use the same config as the rest of the admin panel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  (typeof window !== 'undefined' ? window.localStorage?.getItem("VITE_SUPABASE_URL") || (window as any).SUPABASE_URL : undefined) || 
  'https://wzeoxjjybtfiupzjwrti.supabase.co';

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (typeof window !== 'undefined' ? window.localStorage?.getItem("VITE_SUPABASE_ANON_KEY") || (window as any).SUPABASE_ANON_KEY : undefined) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sitemap entry interface
interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Generate sitemap XML
export async function generateSitemapXML(): Promise<string> {
  try {
    console.log('Generating sitemap.xml...');

    // Get all published posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        published_at,
        updated_at,
        category
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (postsError) {
      console.error('Error fetching posts for sitemap:', postsError);
      throw new Error('Failed to fetch posts for sitemap');
    }

    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (categoriesError) {
      console.error('Error fetching categories for sitemap:', categoriesError);
      throw new Error('Failed to fetch categories for sitemap');
    }

    // Create sitemap entries
    const sitemapEntries: SitemapEntry[] = [];

    // Add homepage
    sitemapEntries.push({
      url: 'https://yourdomain.com/',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0
    });

    // Add contact page
    sitemapEntries.push({
      url: 'https://yourdomain.com/contact',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.8
    });

    // Add category pages
    if (categories) {
      categories.forEach(category => {
        sitemapEntries.push({
          url: `https://yourdomain.com/${category.slug}/`,
          lastmod: category.updated_at ? new Date(category.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.9
        });
      });
    }

    // Add post pages
    if (posts) {
      posts.forEach(post => {
        sitemapEntries.push({
          url: `https://yourdomain.com/${post.category.slug}/${post.slug}/`,
          lastmod: post.updated_at ? new Date(post.updated_at).toISOString().split('T')[0] : new Date(post.published_at).toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: 0.8
        });
      });
    }

    // Generate XML
    const sitemapXML = generateXML(sitemapEntries);
    
    console.log(`Generated sitemap with ${sitemapEntries.length} entries`);
    return sitemapXML;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw new Error('Failed to generate sitemap');
  }
}

// Generate XML from sitemap entries
function generateXML(entries: SitemapEntry[]): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
  const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const urlsetClose = '</urlset>';

  const urlEntries = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

  return `${xmlHeader}
${urlsetOpen}${urlEntries}
${urlsetClose}`;
}

// Upload sitemap to Supabase bucket
export async function uploadSitemap(sitemapXML: string): Promise<void> {
  try {
    console.log('Uploading sitemap.xml to Supabase...');

    // Convert XML to blob
    const blob = new Blob([sitemapXML], { type: 'application/xml' });
    const file = new File([blob], 'sitemap.xml', { type: 'application/xml' });

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('blog')
      .upload('sitemap.xml', file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading sitemap to Supabase:', error);
      throw new Error('Failed to upload sitemap to Supabase');
    }

    console.log('Successfully uploaded sitemap.xml to Supabase storage');
  } catch (error) {
    console.error('Error uploading sitemap:', error);
    throw new Error('Failed to upload sitemap');
  }
}

// Generate and upload sitemap
export async function generateAndUploadSitemap(): Promise<void> {
  try {
    console.log('Generating and uploading sitemap...');
    
    // Generate sitemap XML
    const sitemapXML = await generateSitemapXML();
    
    // Upload to Supabase
    await uploadSitemap(sitemapXML);
    
    console.log('Successfully generated and uploaded sitemap.xml');
  } catch (error) {
    console.error('Error generating and uploading sitemap:', error);
    throw error;
  }
}

// Get sitemap from Supabase (for serving)
export async function getSitemap(): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('blog')
      .download('sitemap.xml');

    if (error) {
      console.error('Error fetching sitemap from Supabase:', error);
      return null;
    }

    const text = await data.text();
    return text;
  } catch (error) {
    console.error('Error getting sitemap:', error);
    return null;
  }
}
