import { createClient } from '@supabase/supabase-js';
import { generateAndUploadPostHTML, generateAndUploadSitemap } from '../lib/htmlGenerator';
import { generateAndUploadSitemap as generateSitemap } from '../lib/sitemapGenerator';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

// Generate static HTML for all existing published posts
export async function generateExistingPosts(): Promise<void> {
  try {
    console.log('🚀 Starting bulk generation of static HTML for existing posts...');

    // Fetch all published posts
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        content,
        excerpt,
        slug,
        featured_image,
        published_at,
        meta_title,
        meta_description,
        og_image,
        category:categories(name, slug),
        tags,
        author:profiles(name, avatar)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }

    if (!posts || posts.length === 0) {
      console.log('ℹ️ No published posts found to generate static HTML for.');
      return;
    }

    console.log(`📝 Found ${posts.length} published posts to process...`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Process each post
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\n📄 Processing post ${i + 1}/${posts.length}: ${post.title}`);

      try {
        // Transform post data to match our interface
        const postData: Post = {
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          slug: post.slug,
          featured_image: post.featured_image,
          category: post.category,
          tags: post.tags || [],
          published_at: post.published_at,
          author: post.author,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          og_image: post.og_image
        };

        // Generate and upload static HTML
        await generateAndUploadPostHTML(postData);
        successCount++;
        console.log(`✅ Successfully generated static HTML for: ${post.slug}`);

      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to generate HTML for ${post.slug}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }

      // Add a small delay to avoid overwhelming the system
      if (i < posts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Generate and upload sitemap
    console.log('\n🗺️ Generating sitemap...');
    try {
      await generateSitemap();
      console.log('✅ Successfully generated and uploaded sitemap.xml');
    } catch (error) {
      console.error('❌ Error generating sitemap:', error);
      errors.push(`Failed to generate sitemap: ${error.message}`);
    }

    // Summary
    console.log('\n📊 Generation Summary:');
    console.log(`✅ Successfully processed: ${successCount} posts`);
    console.log(`❌ Errors: ${errorCount} posts`);
    
    if (errors.length > 0) {
      console.log('\n❌ Error Details:');
      errors.forEach(error => console.log(`  - ${error}`));
    }

    if (errorCount === 0) {
      console.log('\n🎉 All posts processed successfully!');
    } else {
      console.log(`\n⚠️ Completed with ${errorCount} errors. Please check the error details above.`);
    }

  } catch (error) {
    console.error('❌ Fatal error during bulk generation:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  generateExistingPosts()
    .then(() => {
      console.log('\n🏁 Bulk generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Bulk generation failed:', error);
      process.exit(1);
    });
}
