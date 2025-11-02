import { createClient } from '@supabase/supabase-js';
import { generateAndUploadPostHTML, deletePostHTML } from './htmlGenerator';
import { generateAndUploadSitemap } from './sitemapGenerator';

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

// Generate static HTML when a post is published
export async function handlePostPublish(postId: string): Promise<void> {
  try {
    console.log(`🚀 Generating static HTML for published post: ${postId}`);

    // Fetch the post data
    const { data: postData, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content_html,
        excerpt,
        slug,
        image_url,
        published_at,
        meta_title,
        meta_description,
        og_image,
        category:categories(name, slug),
        tags,
        author:profiles(name, avatar)
      `)
      .eq('id', postId)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error('Error fetching post data:', error);
      throw new Error('Failed to fetch post data');
    }

    if (!postData) {
      console.log('Post not found or not published');
      return;
    }

    // Transform post data to match our interface
    const post: Post = {
      id: postData.id,
      title: postData.title,
      content: postData.content_html,
      excerpt: postData.excerpt,
      slug: postData.slug,
      featured_image: postData.image_url,
      category: postData.category,
      tags: postData.tags || [],
      published_at: postData.published_at,
      author: postData.author,
      meta_title: postData.meta_title,
      meta_description: postData.meta_description,
      og_image: postData.og_image
    };

    // Generate and upload static HTML
    await generateAndUploadPostHTML(post);

    // Update sitemap
    await generateAndUploadSitemap();

    console.log(`✅ Successfully generated static HTML for post: ${post.slug}`);
  } catch (error) {
    console.error('Error handling post publish:', error);
    throw error;
  }
}

// Delete static HTML when a post is deleted or unpublished
export async function handlePostUnpublish(postId: string): Promise<void> {
  try {
    console.log(`🗑️ Deleting static HTML for unpublished post: ${postId}`);

    // Fetch the post slug
    const { data: postData, error } = await supabase
      .from('posts')
      .select('slug')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching post slug:', error);
      throw new Error('Failed to fetch post slug');
    }

    if (!postData) {
      console.log('Post not found');
      return;
    }

    // Delete static HTML
    await deletePostHTML(postData.slug);

    // Update sitemap
    await generateAndUploadSitemap();

    console.log(`✅ Successfully deleted static HTML for post: ${postData.slug}`);
  } catch (error) {
    console.error('Error handling post unpublish:', error);
    throw error;
  }
}

// Update static HTML when a post is edited
export async function handlePostUpdate(postId: string): Promise<void> {
  try {
    console.log(`🔄 Updating static HTML for edited post: ${postId}`);

    // Fetch the post data
    const { data: postData, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content_html,
        excerpt,
        slug,
        image_url,
        published_at,
        status,
        meta_title,
        meta_description,
        og_image,
        category:categories(name, slug),
        tags,
        author:profiles(name, avatar)
      `)
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching post data:', error);
      throw new Error('Failed to fetch post data');
    }

    if (!postData) {
      console.log('Post not found');
      return;
    }

    // Only generate static HTML if the post is published
    if (postData.status === 'published') {
      // Transform post data to match our interface
      const post: Post = {
        id: postData.id,
        title: postData.title,
        content: postData.content_html,
        excerpt: postData.excerpt,
        slug: postData.slug,
        featured_image: postData.image_url,
        category: postData.category,
        tags: postData.tags || [],
        published_at: postData.published_at,
        author: postData.author,
        meta_title: postData.meta_title,
        meta_description: postData.meta_description,
        og_image: postData.og_image
      };

      // Generate and upload static HTML
      await generateAndUploadPostHTML(post);

      // Update sitemap
      await generateAndUploadSitemap();

      console.log(`✅ Successfully updated static HTML for post: ${post.slug}`);
    } else {
      // If post is not published, delete any existing static HTML
      await deletePostHTML(postData.slug);
      await generateAndUploadSitemap();
      console.log(`🗑️ Deleted static HTML for unpublished post: ${postData.slug}`);
    }
  } catch (error) {
    console.error('Error handling post update:', error);
    throw error;
  }
}

// Delete static HTML when a post is deleted
export async function handlePostDelete(postId: string): Promise<void> {
  try {
    console.log(`🗑️ Deleting static HTML for deleted post: ${postId}`);

    // Fetch the post slug
    const { data: postData, error } = await supabase
      .from('posts')
      .select('slug')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching post slug:', error);
      throw new Error('Failed to fetch post slug');
    }

    if (!postData) {
      console.log('Post not found');
      return;
    }

    // Delete static HTML
    await deletePostHTML(postData.slug);

    // Update sitemap
    await generateAndUploadSitemap();

    console.log(`✅ Successfully deleted static HTML for post: ${postData.slug}`);
  } catch (error) {
    console.error('Error handling post delete:', error);
    throw error;
  }
}

// Generate static HTML for a specific post (manual trigger)
export async function generatePostStaticHTML(postId: string): Promise<void> {
  try {
    console.log(`🔧 Manually generating static HTML for post: ${postId}`);
    await handlePostPublish(postId);
  } catch (error) {
    console.error('Error manually generating static HTML:', error);
    throw error;
  }
}
