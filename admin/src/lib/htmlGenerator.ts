import { createClient } from '@supabase/supabase-js';

// Supabase configuration - use the same config as the rest of the admin panel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  (typeof window !== 'undefined' ? window.localStorage?.getItem("VITE_SUPABASE_URL") || (window as any).SUPABASE_URL : undefined) || 
  'https://wzeoxjjybtfiupzjwrti.supabase.co';

const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (typeof window !== 'undefined' ? window.localStorage?.getItem("VITE_SUPABASE_ANON_KEY") || (window as any).SUPABASE_ANON_KEY : undefined) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Post interface
interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featured_image: string;
  category: {
    name: string;
    slug: string;
  };
  tags: string[];
  published_at: string;
  author: {
    name: string;
    avatar?: string;
  };
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
}

// Generate static HTML for a post
export async function generatePostHTML(post: Post): Promise<string> {
  try {
    // Read the template file
    const templatePath = process.cwd() + '/public/article-template.html';
    const fs = require('fs');
    const template = fs.readFileSync(templatePath, 'utf8');

    // Generate canonical URL
    const canonicalUrl = `https://yourdomain.com/${post.category.slug}/${post.slug}`;

    // Generate related posts (simplified - you can enhance this)
    const relatedPosts = await generateRelatedPosts(post.category.slug, post.id);
    const sidebarPosts = await generateSidebarPosts();

    // Replace placeholders in template
    const html = template
      .replace(/\{\{TITLE\}\}/g, post.meta_title || post.title)
      .replace(/\{\{DESCRIPTION\}\}/g, post.meta_description || post.excerpt)
      .replace(/\{\{OG_IMAGE\}\}/g, post.og_image || post.featured_image)
      .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
      .replace(/\{\{CATEGORY_SLUG\}\}/g, post.category.slug)
      .replace(/\{\{CATEGORY_NAME\}\}/g, post.category.name)
      .replace(/\{\{PUBLISH_DATE\}\}/g, new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }))
      .replace(/\{\{FEATURED_IMAGE\}\}/g, post.featured_image)
      .replace(/\{\{CONTENT\}\}/g, post.content)
      .replace(/\{\{TAGS\}\}/g, generateTagsHTML(post.tags))
      .replace(/\{\{RELATED_POSTS\}\}/g, relatedPosts)
      .replace(/\{\{SIDEBAR_POSTS\}\}/g, sidebarPosts);

    return html;
  } catch (error) {
    console.error('Error generating post HTML:', error);
    throw new Error('Failed to generate post HTML');
  }
}

// Upload HTML to Supabase bucket
export async function uploadPostHTML(slug: string, html: string): Promise<void> {
  try {
    const fileName = `${slug}.html`;
    
    // Convert HTML to blob
    const blob = new Blob([html], { type: 'text/html' });
    const file = new File([blob], fileName, { type: 'text/html' });

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('blog')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading HTML to Supabase:', error);
      throw new Error('Failed to upload HTML to Supabase');
    }

    console.log(`Successfully uploaded ${fileName} to Supabase storage`);
  } catch (error) {
    console.error('Error uploading post HTML:', error);
    throw new Error('Failed to upload post HTML');
  }
}

// Generate and upload post HTML
export async function generateAndUploadPostHTML(post: Post): Promise<void> {
  try {
    console.log(`Generating static HTML for post: ${post.title}`);
    
    // Generate HTML
    const html = await generatePostHTML(post);
    
    // Upload to Supabase
    await uploadPostHTML(post.slug, html);
    
    console.log(`Successfully generated and uploaded static HTML for: ${post.slug}`);
  } catch (error) {
    console.error('Error generating and uploading post HTML:', error);
    throw error;
  }
}

// Delete post HTML from Supabase
export async function deletePostHTML(slug: string): Promise<void> {
  try {
    const fileName = `${slug}.html`;
    
    const { error } = await supabase.storage
      .from('blog')
      .remove([fileName]);

    if (error) {
      console.error('Error deleting HTML from Supabase:', error);
      throw new Error('Failed to delete HTML from Supabase');
    }

    console.log(`Successfully deleted ${fileName} from Supabase storage`);
  } catch (error) {
    console.error('Error deleting post HTML:', error);
    throw new Error('Failed to delete post HTML');
  }
}

// Helper function to generate tags HTML
function generateTagsHTML(tags: string[]): string {
  if (!tags || tags.length === 0) return '';
  
  const tagLinks = tags.map(tag => 
    `<a href="/tag/${tag.toLowerCase().replace(/\s+/g, '-')}/" class="badge badge-primary mr-2">${tag}</a>`
  ).join('');
  
  return `
    <div class="post-tags mt-3">
      <strong>Tags:</strong> ${tagLinks}
    </div>
  `;
}

// Helper function to generate related posts
async function generateRelatedPosts(categorySlug: string, excludeId: string): Promise<string> {
  try {
    // Fetch related posts from the same category
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        featured_image,
        published_at,
        excerpt
      `)
      .eq('category.slug', categorySlug)
      .neq('id', excludeId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Error fetching related posts:', error);
      return '';
    }

    if (!posts || posts.length === 0) return '';

    const relatedPostsHTML = posts.map(post => `
      <div class="card mb-3">
        <div class="row no-gutters">
          <div class="col-md-4">
            <img src="${post.featured_image}" class="card-img" alt="${post.title}" style="height: 120px; object-fit: cover;">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h6 class="card-title">
                <a href="/${categorySlug}/${post.slug}/" class="text-decoration-none">${post.title}</a>
              </h6>
              <p class="card-text small text-muted">${post.excerpt}</p>
              <small class="text-muted">${new Date(post.published_at).toLocaleDateString()}</small>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    return relatedPostsHTML;
  } catch (error) {
    console.error('Error generating related posts:', error);
    return '';
  }
}

// Helper function to generate sidebar posts
async function generateSidebarPosts(): Promise<string> {
  try {
    // Fetch recent posts for sidebar
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        featured_image,
        published_at,
        category
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching sidebar posts:', error);
      return '';
    }

    if (!posts || posts.length === 0) return '';

    const sidebarPostsHTML = posts.map(post => `
      <div class="card mb-3">
        <img src="${post.featured_image}" class="card-img-top" alt="${post.title}" style="height: 150px; object-fit: cover;">
        <div class="card-body p-2">
          <h6 class="card-title small">
            <a href="/${post.category.slug}/${post.slug}/" class="text-decoration-none">${post.title}</a>
          </h6>
          <small class="text-muted">${new Date(post.published_at).toLocaleDateString()}</small>
        </div>
      </div>
    `).join('');

    return sidebarPostsHTML;
  } catch (error) {
    console.error('Error generating sidebar posts:', error);
    return '';
  }
}
