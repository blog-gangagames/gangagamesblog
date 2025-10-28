const fs = require('fs');

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
  return template
    .replace(/{{title}}/g, postData.title)
    .replace(/{{description}}/g, postData.description)
    .replace(/{{image}}/g, postData.image)
    .replace(/{{content}}/g, postData.content)
    .replace(/{{category}}/g, postData.category)
    .replace(/{{slug}}/g, postData.slug);
}

module.exports = { generateStaticHTML };