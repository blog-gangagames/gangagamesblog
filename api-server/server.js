const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const STATIC_ROOT = path.join(__dirname, '..');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static site (homepage, category pages, article detail template, assets)
app.use(express.static(STATIC_ROOT));

// Ensure homepage serves the public index.html
app.get('/', (req, res) => {
  try {
    return res.sendFile(path.join(STATIC_ROOT, 'public', 'index.html'));
  } catch (e) {
    return res.status(500).send('Internal server error');
  }
});

// Initialize SQLite database
const db = new sqlite3.Database('./blog.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Create posts table
    db.run(`CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      category TEXT NOT NULL,
      author TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      featured BOOLEAN DEFAULT 0,
      views INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      image_url TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create categories table
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert sample data
    insertSampleData();
  });
}

// Insert sample data
function insertSampleData() {
  // Check if data already exists
  db.get("SELECT COUNT(*) as count FROM posts", (err, row) => {
    if (err) {
      console.error('Error checking posts:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Inserting sample data...');
      
      // Insert sample posts
      const samplePosts = [
        {
          title: "Republican Senator Vital to Health",
          content: "Republican Senator John Smith has been a crucial figure in health policy discussions. His recent statements on healthcare reform have sparked significant debate among lawmakers and healthcare professionals across the nation.",
          excerpt: "Republican Senator John Smith has been a crucial figure in health policy discussions and healthcare reform.",
          category: "Politics",
          author: "David Hall",
          status: "published",
          featured: 1,
          views: 15200,
          comments: 45,
          image_url: "images/thumb/news1.jpg",
          tags: "Politics,Health,Senator"
        },
        {
          title: "Barack Obama and Family Visit Indonesia",
          content: "Former President Barack Obama and his family recently visited Indonesia, reconnecting with the country where he spent part of his childhood. The visit included meetings with local officials and cultural exchanges.",
          excerpt: "Former President Barack Obama and his family recently visited Indonesia for cultural exchanges.",
          category: "Politics",
          author: "Sarah Johnson",
          status: "published",
          featured: 0,
          views: 8700,
          comments: 23,
          image_url: "images/thumb/news2.jpg",
          tags: "Politics,Obama,Indonesia"
        },
        {
          title: "6 Best Tips for Building a Good Shipping Boat",
          content: "Building a reliable shipping boat requires careful planning and attention to detail. Here are six essential tips for constructing a vessel that can withstand the rigors of commercial shipping.",
          excerpt: "Six essential tips for constructing a vessel that can withstand commercial shipping rigors.",
          category: "Technology",
          author: "Marine Expert",
          status: "published",
          featured: 0,
          views: 12100,
          comments: 67,
          image_url: "images/thumb/news3.jpg",
          tags: "Technology,Shipping,Marine"
        },
        {
          title: "Global Solidarity to Fight COVID-19",
          content: "The global community has come together in unprecedented ways to combat the COVID-19 pandemic. International cooperation, vaccine development, and public health measures have been crucial in this fight.",
          excerpt: "The global community has come together in unprecedented ways to combat the COVID-19 pandemic.",
          category: "Health",
          author: "Health Reporter",
          status: "published",
          featured: 1,
          views: 25000,
          comments: 89,
          image_url: "images/corona.png",
          tags: "Health,COVID-19,Global"
        }
      ];

      const stmt = db.prepare(`INSERT INTO posts (title, content, excerpt, category, author, status, featured, views, comments, image_url, tags) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      
      samplePosts.forEach(post => {
        stmt.run([
          post.title, post.content, post.excerpt, post.category, post.author, 
          post.status, post.featured, post.views, post.comments, post.image_url, post.tags
        ]);
      });
      
      stmt.finalize();
      console.log('Sample data inserted successfully');
    }
  });
}

// API Routes

// Get all published posts
app.get('/api/posts', (req, res) => {
  const { category, featured, limit = 10, offset = 0 } = req.query;
  
  let query = "SELECT * FROM posts WHERE status = 'published'";
  let params = [];
  
  if (category && category !== 'all') {
    query += " AND category = ?";
    params.push(category);
  }
  
  if (featured === 'true') {
    query += " AND featured = 1";
  }
  
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single post by ID
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  
  db.get("SELECT * FROM posts WHERE id = ? AND status = 'published'", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    // Increment view count
    db.run("UPDATE posts SET views = views + 1 WHERE id = ?", [id]);
    
    res.json(row);
  });
});

// Get categories
app.get('/api/categories', (req, res) => {
  db.all("SELECT DISTINCT category as name, category as slug FROM posts WHERE status = 'published'", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new post (for admin)
app.post('/api/posts', (req, res) => {
  const { title, content, excerpt, category, author, status = 'draft', featured = 0, image_url, tags } = req.body;
  
  if (!title || !content || !category || !author) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  const stmt = db.prepare(`INSERT INTO posts (title, content, excerpt, category, author, status, featured, image_url, tags) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  stmt.run([title, content, excerpt, category, author, status, featured, image_url, tags], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.status(201).json({ 
      id: this.lastID, 
      message: 'Post created successfully' 
    });
  });
  
  stmt.finalize();
});

// Update post (for admin)
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, category, author, status, featured, image_url, tags } = req.body;
  
  const stmt = db.prepare(`UPDATE posts SET 
    title = ?, content = ?, excerpt = ?, category = ?, author = ?, 
    status = ?, featured = ?, image_url = ?, tags = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`);
  
  stmt.run([title, content, excerpt, category, author, status, featured, image_url, tags, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    res.json({ message: 'Post updated successfully' });
  });
  
  stmt.finalize();
});

// Delete post (for admin)
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM posts WHERE id = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    res.json({ message: 'Post deleted successfully' });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GangaGames Blog API is running' });
});

// SEO-friendly article slug route -> serve article detail template
// Matches '/2024-some-title-123' or '/some-title-123'
app.get('/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;
    // If path actually exists as a file or directory, let static handler respond
    const candidateFile = path.join(STATIC_ROOT, slug);
    if (slug.includes('.') || require('fs').existsSync(candidateFile)) {
      return next();
    }
    const looksLikeArticle = /^\d{4}-.+-\d+$/.test(slug) || /-\d+$/.test(slug);
    if (!looksLikeArticle) return next();
    return res.sendFile(path.join(STATIC_ROOT, 'article-detail-v1.html'));
  } catch (e) {
    return next();
  }
});

// Dynamic category slug route -> serve category-style-v2.html for any category slug
app.get('/category/:slug', (req, res, next) => {
  try {
    const { slug } = req.params;
    // If a physical directory exists (e.g., /category/how-to-guides), let static handle it
    const candidateDir = path.join(STATIC_ROOT, 'category', slug);
    if (fs.existsSync(candidateDir)) {
      return next();
    }
    // Otherwise, serve the category page template that reads slug from path
    return res.sendFile(path.join(STATIC_ROOT, 'category-style-v2.html'));
  } catch (e) {
    return next();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GangaGames Blog API server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
  console.log(`📄 Static site served from ${STATIC_ROOT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

