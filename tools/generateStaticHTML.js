const fs = require('fs');

function computeCanonical(category, slug) {
  const base = (process.env.NEXT_PUBLIC_DOMAIN || process.env.SITE_DOMAIN || 'https://www.gangagamesblog.com').replace(/\/$/, '');
  const cat = String(category || '').trim().replace(/\s+/g, '-').toLowerCase();
  const s = String(slug || '').trim().toLowerCase();
  return `${base}/${cat}/${s}`;
}

/**
 * Generates a static HTML string for a blog post using the article-details-v1.html template.
 * Replaces placeholders with actual post data.
 *
 * @param {Object} postData - The post data object.
 * @param {string} postData.title - The post title.
 * @param {string} postData.description - The meta description.
 * @param {string} postData.image - The Open Graph image URL.
 * @param {string} postData.content - The HTML content of the post.
 * @param {string} postData.category - The post category.
 * @param {string} postData.slug - The post slug.
 * @returns {string} - The generated static HTML string.
 */
function generateStaticHTML(postData) {
  const template = fs.readFileSync('public/article-detail-v1.html', 'utf8');
  let html = template
    .replace(/{{title}}/g, postData.title)
    .replace(/{{description}}/g, postData.description)
    .replace(/{{image}}/g, postData.image)
    .replace(/{{content}}/g, postData.content)
    .replace(/{{category}}/g, postData.category)
    .replace(/{{slug}}/g, postData.slug);

  // Inject canonical if placeholder exists
  const canonicalUrl = computeCanonical(postData.category, postData.slug);
  if (/\{\{CANONICAL_URL\}\}/.test(html)) {
    html = html.replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl);
  }
  return html;
}

module.exports = { generateStaticHTML };