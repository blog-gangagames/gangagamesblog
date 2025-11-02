// Article Detail loader powered by Supabase (plain JS)
// Reads `id` from the query string and renders the full post
(function(){
  // Lightweight localStorage cache for instant article paint
  function readCache(key, maxAgeSeconds){
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj.ts !== 'number') return null;
      var age = (Date.now() - obj.ts) / 1000;
      if (maxAgeSeconds && age > maxAgeSeconds) return null;
      return obj.data || null;
    } catch(_) { return null; }
  }
  function writeCache(key, data){
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch(_){}
  }
  // All cache logic removed. Article detail now always fetches fresh data from Supabase.
  function extractSlugFromLocation(){
    try {
      // Prefer explicit query param first
      var params = new URLSearchParams(window.location.search || '');
      var fromQuery = (params.get('slug') || '').trim();
      if (fromQuery) return String(fromQuery).toLowerCase();
      var path = window.location.pathname || '';
      // Expect top-level "/<slug>" (exclude known routes/files)
      var segs = path.split('/').filter(Boolean);
      if (!segs.length) return '';
      var last = segs[segs.length - 1];
      // Ignore common non-article paths
      if (/^(index\.html|article-detail-v1\.html|category|contact\.html|search-result\.html)$/i.test(last)) return '';
      // Accept single segment "/<slug>" OR two-segment "/<category>/<slug>"
      if (segs.length === 1 || segs.length === 2) {
        return String(last || '').toLowerCase();
      }
      return '';
    } catch(_) { return ''; }
  }

  function slugifyTitle(t){
    try {
      return String(t || '')
        .replace(/['"]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    } catch(_) { return ''; }
  }

  function getClient(){
    try {
      var client = window.supabaseClient || (typeof window.supabase !== 'undefined' ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null);
      if (!client) { console.warn('[article] Supabase client not initialized. Check SUPABASE_URL/ANON_KEY and CDN.'); }
      return client || null;
    } catch (e) { console.warn('[article] Supabase client init failed:', e); return null; }
  }

  function applyArticleData(data){
    if (!data) return;
    // Title
    var titleEl = document.querySelector('.wrap__article-detail-title h1');
    var titleText = safeTitle(data);
    if (titleEl) titleEl.textContent = titleText;
    document.title = titleText + ' - GangaGames';

    // Image
    try {
      var figure = document.getElementById('article-image');
      if (figure) {
        var imgEl = figure.querySelector('img');
        if (!imgEl) { imgEl = document.createElement('img'); imgEl.className = 'img-fluid'; imgEl.alt = ''; figure.appendChild(imgEl); }
        imgEl.src = safeImage(data);
      }
    } catch(_){}

    // Date & Category
    var info = document.querySelector('.wrap__article-detail-info');
    if (info){
      var anchors = info.querySelectorAll('a');
      var categoryAnchor = anchors && anchors.length ? anchors[anchors.length - 1] : null;
      var dateSpan = info.querySelector('.text-dark');
      if (dateSpan) dateSpan.textContent = fmtDate(data.published_at || data.created_at) || '';
      if (categoryAnchor) {
        var cat = safeCategory(data) || '';
        categoryAnchor.textContent = cat;
        try {
          var catSlug = slugifyTitle(cat).replace(/faqs-and-beginner-resources/,'faqs-beginner-resources');
          var catHref = ((window.location.pathname || '').indexOf('/public/') !== -1)
            ? ('category/' + catSlug + '/')
            : ('/category/' + catSlug + '/');
          categoryAnchor.setAttribute('href', catHref);
        } catch(_){}
      }
    }

    // Breadcrumb
    var crumb = document.querySelector('.breadcrumbs__item--current');
    if (crumb) crumb.textContent = safeCategory(data) || 'Article';

    // Content
    var contentWrap = document.querySelector('.wrap__article-detail-content');
    if (contentWrap){
      var html = pickContent(data);
      if (html && /<\w+/.test(html)) {
        contentWrap.innerHTML = html;
      } else {
        contentWrap.innerHTML = '<p class="has-drop-cap-fluid">' + (html ? String(html).replace(/</g,'&lt;') : '') + '</p>';
      }
    }

    // Tags
    try {
      var tags = Array.isArray(data.tags) ? data.tags : [];
      var tagsWrap = document.querySelector('#post-tags ul.list-inline');
      if (tagsWrap) {
        var items = tagsWrap.querySelectorAll('li.list-inline-item');
        for (var i = 1; i < items.length; i++) {
          if (items[i] && items[i].parentNode) items[i].parentNode.removeChild(items[i]);
        }
        tags.forEach(function(t){
          var name = String(t || '').trim();
          if (!name) return;
          var li = document.createElement('li');
          li.className = 'list-inline-item';
          var a = document.createElement('a');
          a.textContent = '#' + name;
          a.setAttribute('data-tag', name);
          a.setAttribute('href', '#');
          li.appendChild(a);
          tagsWrap.appendChild(li);
        });
      }
    } catch(_){}

    // Remove loading state & expose post id
    var wrapper = document.querySelector('.wrap__article-detail');
    if (wrapper) {
      wrapper.classList.remove('is-loading');
      try { wrapper.setAttribute('data-post-id', String(data.id || '')); } catch(_){}
    }
    try { document.dispatchEvent(new CustomEvent('article:loaded', { detail: { id: data.id } })); } catch(_){}
  }

  async function findPostBySlug(client, slug){
    try {
      if (!client || !slug) return null;
      // Fetch a reasonable batch and match client-side since slug isn't stored
      var res = await client
        .from('posts')
        .select('*')
        .eq('status','published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(200);
      if (res.error) { console.warn('[article] findPostBySlug error:', res.error.message || res.error); return null; }
      var rows = Array.isArray(res.data) ? res.data : [];
      var match = null;
      for (var i = 0; i < rows.length; i++) {
        var p = rows[i];
        var s = slugifyTitle(p && p.title);
        if (s && s.toLowerCase() === String(slug).toLowerCase()) { match = p; break; }
      }
      return match;
    } catch(e){ console.warn('[article] findPostBySlug crashed:', e); return null; }
  }

  function fmtDate(value){
    try {
      var d = value ? new Date(value) : null;
      if (!d || isNaN(d.getTime())) return '';
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch(_) { return ''; }
  }

  function normalizeCategoryLabel(value){
    try {
      var v = (value || '').trim();
      if (!v) return '';
      var key = v.toLowerCase();
      if (key === 'politics' || key === 'technology') { return 'News & Industry Updates'; }
      var MAP = {
        'casino bonus': 'Casino Bonuses',
        'casino bonuses': 'Casino Bonuses',
        'sportsbook promotions': 'Sportsbook Promotions',
        'loyalty & vip programs': 'Loyalty & VIP Programs',
        'tips & strategies': 'Strategies & Tips',
        'tips strategies hub': 'Tips & Strategies Hub',
        'responsible gambling': 'Responsible Gambling',
        'news & industry updates': 'News & Industry Updates',
        'legal & regulatory updates': 'Legal & Regulatory Updates',
        'culture & lifestyle': 'Culture & Lifestyle',
        'how-to guides': 'How-To Guides',
        'faqs & beginner resources': 'FAQs & Beginner Resources'
      };
      return MAP[key] ? MAP[key] : v;
    } catch(_) { return value || ''; }
  }

  function pickContent(post){
    var c = (post && (post.content_html || post.content || post.body_html || post.body || post.markdown || post.text)) || '';
    return String(c || '');
  }

  function safeImage(post){ return (post && post.image_url) ? post.image_url : 'images/newsimage1.png'; }
  function safeTitle(post){ return (post && post.title) ? post.title : 'Untitled'; }
  function safeCategory(post){
    var raw = (post && post.subcategory) ? post.subcategory : (post && post.main_category ? post.main_category : '');
    return normalizeCategoryLabel(raw);
  }

  function extractIdFromLocation(){
    try {
      var params = new URLSearchParams(window.location.search || '');
      // Support multiple param names used across the site
      var id = params.get('post_id') || params.get('id') || params.get('article') || '';
      if (id) return id;
      // Try hash: #/slug-or-title-123 or #slug-123
      var hash = window.location.hash || '';
      if (hash) {
        var hv = hash.replace(/^#\/?/, '').split('/').pop() || '';
        var m = hv.match(/(\d+)$/);
        if (m && m[1]) return m[1];
      }
      // Try pathname: /2024-Title-Here-123 or /some-slug-123
      var path = window.location.pathname || '';
      if (path) {
        var seg = path.split('/').filter(Boolean).pop() || '';
        var m2 = seg.match(/(\d+)$/);
        if (m2 && m2[1]) return m2[1];
      }
      return '';
    } catch(_) { return ''; }
  }

  // Try to load static HTML from Supabase storage first
  async function tryLoadStaticHtml(client, slug){
    try {
      if (!client || !slug) return null;
      // Try multiple slug variations
      var variations = [slug, slug.toLowerCase(), slug.replace(/-/g, '_'), slug.replace(/_/g, '-')];
      for (var i = 0; i < variations.length; i++) {
        try {
          var result = await client.storage.from('blog').download(variations[i] + '.html');
          if (!result.error && result.data) {
            var text = await result.data.text();
            // Parse the HTML and extract article data if it's a full HTML page
            // For now, just return success indicator - we'll let the page handle rendering
            return { success: true, slug: variations[i] };
          }
        } catch(_) { continue; }
      }
      return null;
    } catch(_) { return null; }
  }

  async function loadArticle(){
    try {
      var id = extractIdFromLocation();
      var slugPath = extractSlugFromLocation();
      var client = getClient();
      if (!client) {
        // Check for preloaded post data
        if (window.__PRELOADED_POST__) {
          var preloaded = window.__PRELOADED_POST__;
          if (preloaded.id) id = preloaded.id;
          if (preloaded.slug) slugPath = preloaded.slug;
        }
        if (!id && !slugPath) return;
        client = getClient();
        if (!client) return;
      }
      
      // Check for preloaded post data from API route
      if (window.__PRELOADED_POST__) {
        var preloaded = window.__PRELOADED_POST__;
        if (preloaded.id) id = preloaded.id;
        if (!slugPath && preloaded.slug) slugPath = preloaded.slug;
        // Preloaded data means API already found the post - we can fetch it directly
      }
      
      // Cache-first: paint cached article immediately if available
      var cacheKey = id ? ('article:id:' + id) : (slugPath ? ('article:slug:' + slugPath) : 'article:latest');
      var cached = readCache(cacheKey, 86400);
      if (cached) {
        applyArticleData(cached);
        var loader = document.querySelector('.loading-container');
        if (loader) { try { loader.style.display = 'none'; } catch(_){} }
        // Hide article loading state
        try {
          var articleLoader = document.getElementById('article-loading');
          if (articleLoader) articleLoader.style.display = 'none';
        } catch(_){}
      }
      
      // Try to check if static HTML exists (but don't block - let DB fetch proceed)
      if (slugPath && !cached) {
        tryLoadStaticHtml(client, slugPath).catch(function(_){});
      }
      
      var data = null, error = null;
      if (id) {
        var out = await client
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .eq('id', id)
          .single();
        error = out.error || null;
        data = out.data || null;
      } else if (slugPath) {
        data = await findPostBySlug(client, slugPath);
        if (!data) {
          // As a fallback, load latest
          var res = await client
            .from('posts')
            .select('*')
            .eq('status', 'published')
            .order('published_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(1);
          error = res.error || null;
          data = Array.isArray(res.data) && res.data.length ? res.data[0] : null;
        }
      } else {
        // Fallback: load the latest published post when no id/slug is provided
        var res2 = await client
          .from('posts')
          .select('*')
          .eq('status', 'published')
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(1);
        error = res2.error || null;
        data = Array.isArray(res2.data) && res2.data.length ? res2.data[0] : null;
      }
      if (error) { 
        console.warn('[article] fetch error:', error.message || error); 
        // If we have cached data, keep showing it
        if (cached) return;
        return; 
      }
      if (!data) { 
        console.warn('[article] post not found for id:', id); 
        // If we have cached data, keep showing it
        if (cached) return;
        return; 
      }
      
      // Only update if data has changed (to avoid visible flicker)
      var shouldUpdate = true;
      if (cached && cached.id === data.id) {
        // Check if content actually changed
        var cachedContent = (cached.content_html || cached.content || '').substring(0, 100);
        var newContent = (data.content_html || data.content || '').substring(0, 100);
        if (cachedContent === newContent && cached.title === data.title) {
          // Content appears same - only update cache timestamp, don't re-render
          writeCache(cacheKey, data);
          try { 
            var loader3 = document.querySelector('.loading-container'); 
            if (loader3) loader3.style.display = 'none'; 
            var articleLoader2 = document.getElementById('article-loading');
            if (articleLoader2) articleLoader2.style.display = 'none';
          } catch(_){}
          return;
        }
      }
      
      // Render fresh data and update cache
      if (shouldUpdate) {
        applyArticleData(data);
        try { 
          var loader2 = document.querySelector('.loading-container'); 
          if (loader2) loader2.style.display = 'none'; 
          var articleLoader3 = document.getElementById('article-loading');
          if (articleLoader3) articleLoader3.style.display = 'none';
        } catch(_){}
        writeCache(cacheKey, data);
      }
      return;

      // Title
      var titleEl = document.querySelector('.wrap__article-detail-title h1');
      var titleText = safeTitle(data);
      if (titleEl) titleEl.textContent = titleText;
      document.title = titleText + ' - GangaGames';

      // Image (inject into figure if not present)
      try {
        var figure = document.getElementById('article-image');
        if (figure) {
          var imgEl = figure.querySelector('img');
          if (!imgEl) {
            imgEl = document.createElement('img');
            imgEl.className = 'img-fluid';
            imgEl.alt = '';
            figure.appendChild(imgEl);
          }
          imgEl.src = safeImage(data);
        }
      } catch(_) {}

      // Date and Category (author removed)
      var info = document.querySelector('.wrap__article-detail-info');
      if (info){
        var anchors = info.querySelectorAll('a');
        var categoryAnchor = anchors && anchors.length ? anchors[anchors.length - 1] : null;
        var dateSpan = info.querySelector('.text-dark');
        if (dateSpan) dateSpan.textContent = fmtDate(data.published_at || data.created_at) || '';
        if (categoryAnchor) {
          var cat = safeCategory(data) || '';
          categoryAnchor.textContent = cat;
          try {
            var catSlug = slugifyTitle(cat).replace(/faqs-and-beginner-resources/,'faqs-beginner-resources');
            var catHref = ((window.location.pathname || '').indexOf('/public/') !== -1)
              ? ('category/' + catSlug + '/')
              : ('/category/' + catSlug + '/');
            categoryAnchor.setAttribute('href', catHref);
          } catch(_){}
        }
      }

      // Breadcrumb current category
      var crumb = document.querySelector('.breadcrumbs__item--current');
      if (crumb) crumb.textContent = safeCategory(data) || 'Article';

      // Content body
      var contentWrap = document.querySelector('.wrap__article-detail-content');
      if (contentWrap){
        var html = pickContent(data);
        if (html && /<\w+/.test(html)) {
          contentWrap.innerHTML = html;
        } else {
          contentWrap.innerHTML = '<p class="has-drop-cap-fluid">' + (html ? String(html).replace(/</g,'&lt;') : '') + '</p>';
        }
      }

      // Tags rendering
      try {
        var tags = Array.isArray(data.tags) ? data.tags : [];
        var tagsWrap = document.querySelector('#post-tags ul.list-inline');
        if (tagsWrap) {
          // Remove existing tag items except the icon (first li)
          var items = tagsWrap.querySelectorAll('li.list-inline-item');
          for (var i = 1; i < items.length; i++) {
            if (items[i] && items[i].parentNode) items[i].parentNode.removeChild(items[i]);
          }
          tags.forEach(function(t){
            var name = String(t || '').trim();
            if (!name) return;
            var li = document.createElement('li');
            li.className = 'list-inline-item';
            var a = document.createElement('a');
            a.textContent = '#' + name;
            a.setAttribute('data-tag', name);
            a.setAttribute('href', '#');
            li.appendChild(a);
            tagsWrap.appendChild(li);
          });
        }
      } catch (_) {}

      // Finalize: remove loading state and expose post id
      var wrapper = document.querySelector('.wrap__article-detail');
      if (wrapper) {
        wrapper.classList.remove('is-loading');
        try { wrapper.setAttribute('data-post-id', String(data.id || '')); } catch(_){}
      }

      // Notify listeners
      try { document.dispatchEvent(new CustomEvent('article:loaded', { detail: { id: data.id } })); } catch(_){}

      // Do not rewrite to "/<slug>" to avoid 404s on static hosts.
      // Keep current URL (with query params) stable for reliable sharing.
    } catch (e) {
      console.warn('[article] loadArticle error:', e);
    }
  }

  function init(){
    // Hide any global loading overlay quickly to reveal cached content/skeleton
    var loader = document.querySelector('.loading-container');
    if (loader) { try { loader.style.display = 'none'; } catch(_){} }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadArticle);
    } else {
      loadArticle();
    }
    // Fallback retry shortly in case CDN initializes after DOMContentLoaded
    setTimeout(loadArticle, 800);
  }

  window.initArticleDetail = init;
  init();
})();