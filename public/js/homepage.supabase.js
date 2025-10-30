// Homepage dynamic content powered by Supabase (plain JS + jQuery)
(function(){
  // --- Cache helpers ---
  function readCache(key, maxAgeSeconds) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj !== 'object') return null;
      var now = Date.now();
      if (typeof obj.ts !== 'number' || (maxAgeSeconds && now - obj.ts > maxAgeSeconds * 1000)) {
        localStorage.removeItem(key);
        return null;
      }
      return obj.data;
    } catch (_) { return null; }
  }
  function writeCache(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch (_) {}
  }
  // Detect prewarm/dummy content so we can prefer real snapshot
  function isPrewarmData(list){
    try {
      if (!Array.isArray(list) || !list.length) return false;
      var score = 0;
      for (var i = 0; i < list.length; i++){
        var p = list[i] || {};
        if (typeof p.id === 'string' && /^(g|s|p|c|t)-\d+/.test(p.id)) score++;
        if (p.image_url && /images\.unsplash\.com/.test(String(p.image_url))) score++;
      }
      return score >= Math.max(2, Math.floor(list.length * 0.2));
    } catch(_) { return false; }
  }

  // --- SEO URL helpers ---
  function slugifyTitle(t){
    try { 
      return String(t||'').replace(/['"]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); 
    } catch(_) { 
      return ''; 
    }
  }
  
  function generateSeoUrl(post) {
    if (!post) return 'article-detail-v1.html';
    
    // Use slug if available, otherwise generate from title
    var slug = post.slug || slugifyTitle(post.title);
    if (!slug) return 'article-detail-v1.html?id=' + encodeURIComponent(post.id);
    
    // Use subcategory first, then main_category for URL structure
    var category = post.subcategory || post.main_category || 'general';
    var categorySlug = slugifyTitle(category);
    
    // Return SEO-friendly URL: /category/slug
    return '/' + categorySlug + '/' + slug;
  }

  // --- Supabase client ---
  function getClient(){
    try {
      if (window.supabaseClient) return window.supabaseClient;
      if (typeof window.ensureSupabaseClient === 'function') return window.ensureSupabaseClient(false);
      if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
          console.warn('[home] Missing SUPABASE_URL/ANON_KEY');
          try { showStatus('Missing SUPABASE_URL/ANON_KEY', false); } catch(_){}
          return null;
        }
        var c = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        try { showStatus('Supabase client initialized', true); } catch(_){}
        return c;
      }
      return null;
    } catch (e) { console.warn('[home] Supabase client init failed:', e); return null; }
  }

  // --- Rendering helpers ---
  function esc(text){ return String(text == null ? '' : text); }
  function safeImg(p){ return p && p.image_url ? p.image_url : 'images/newsimage1.png'; }
  function fmtDate(value){ try { var d = value ? new Date(value) : null; if (!d || isNaN(d.getTime())) return ''; return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch(_) { return ''; } }
  // Category utilities: only allow known site categories and color them dynamically
  var CATEGORY_COLOR_MAP = {
    "casino games": "cat-color-orange",
    "sports betting": "cat-color-green",
    "bonuses promotions": "cat-color-gold",
    "how to guides": "cat-color-orange",
    "politics": "cat-color-gold",
    "responsible gambling": "cat-color-green",
    "online slots": "cat-color-orange",
    "poker": "cat-color-green",
    "roulette": "cat-color-gold",
    "game reviews": "cat-color-orange",
    "football betting": "cat-color-green",
    "cricket betting": "cat-color-green",
    "tennis betting": "cat-color-green",
    "kabaddi betting": "cat-color-green",
    "loyalty vip programs": "cat-color-gold",
    "news industry updates": "cat-color-gold",
    "culture lifestyle": "cat-color-orange",
    "strategies tips": "cat-color-orange",
    "tips strategies hub": "cat-color-orange",
    "casino bonuses": "cat-color-gold"
  };
  function normalizeCat(s){
    return (s || "")
      .replace(/[&\/\\\-_,]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
  function categoryLabel(p){
    try {
      var mc = p && (p.main_category || p.mainCategory || p.category);
      var sc = p && (p.subcategory || p.subCategory || p.sub_category);
      var label = esc(mc || sc || '');
      var key = normalizeCat(label);
      // Only return labels that exist on the website (in our map)
      if (!CATEGORY_COLOR_MAP[key]) return '';
      return label;
    } catch(_) { return ''; }
  }
  // Category filtering helpers
  function normalizeForCompare(value){ return normalizeCat(value || ''); }
  function filterByCategory(posts, targetKeys, maxCount){
    try {
      var keys = (Array.isArray(targetKeys) ? targetKeys : [targetKeys])
        .map(function(k){ return normalizeForCompare(k); })
        .filter(Boolean);
      if (!keys.length) return maxCount ? posts.slice(0, maxCount) : posts.slice(0);
      var out = [];
      posts.forEach(function(p){
        var mc = normalizeForCompare(p && (p.main_category || p.mainCategory || p.category));
        var sc = normalizeForCompare(p && (p.subcategory || p.subCategory || p.sub_category));
        if ((mc && keys.indexOf(mc) !== -1) || (sc && keys.indexOf(sc) !== -1)) {
          out.push(p);
        }
      });
      return maxCount ? out.slice(0, maxCount) : out;
    } catch(_) { return maxCount ? posts.slice(0, maxCount) : posts.slice(0); }
  }
  function applyCategoryColorsDynamic(){
    try {
      var selectors = [
        '.card__post__category',
        '.article__category',
        '.card__post__list .category',
        '.wrapper__list__article .category',
        '.popular__section-news .category',
        '.category'
      ];
      selectors.forEach(function(sel){
        var nodes = document.querySelectorAll(sel);
        nodes.forEach(function(el){
          if (!el) return;
          var key = normalizeCat(el.textContent || el.innerText);
          var cls = CATEGORY_COLOR_MAP[key];
          if (!cls) return;
          el.className = (el.className || '').replace(/\bcat-color-[a-z]+\b/g, '').trim();
          if (el.classList) el.classList.add(cls);
        });
      });
    } catch(_) { /* noop */ }
  }
  var AUTHOR_TEXT = 'By GangaGames Team';

  function renderHeroCarousel(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 4).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="item">'
        + '  <div class="card__post">'
        + '    <div class="card__post__body" style="position: relative;">'
        + '      <a href="' + esc(seoUrl) + '">'
        + '        <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="height: 450px; object-fit: cover; width: 100%;">'
        + '      </a>'
        + '      <div class="card__post__content" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 30px 20px 20px;">'
        + '        <div class="card__post__title">'
        + '          <h2 style="color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); margin-bottom: 8px; font-size: 24px; line-height: 1.3;"><a href="' + esc(seoUrl) + '" style="color: white; text-decoration: none;">' + esc(p.title || 'Untitled') + '</a></h2>'
        + '        </div>'
        + '        <ul class="list-inline" style="margin-bottom: 0;">'
        + '          <li class="list-inline-item"><span style="color: rgba(255,255,255,0.9); font-size: 14px;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '        </ul>'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
    // Ensure carousel container is visible and ready
    if (container.parentElement) {
      container.parentElement.style.display = 'block';
    }
  }

  // Render two stacked posts on the right with overlay title at bottom
  function renderRightStack(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 2).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="card__post card__post__transition mb-0" style="margin-bottom:0;">'
        + '  <div class="card__post__body" style="position: relative;">'
        + '    <a href="' + esc(seoUrl) + '">'
        + '      <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="height: 225px; object-fit: cover; width: 100%;">'
        + '    </a>'
        + '    <div class="card__post__content" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 20px 15px 15px;">'
        + '      <div class="card__post__title">'
        + '        <h5 style="color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); margin-bottom: 5px;"><a href="' + esc(seoUrl) + '" style="color: white;">' + esc(p.title || 'Untitled') + '</a></h5>'
        + '      </div>'
        + '      <ul class="list-inline" style="margin-bottom: 0;">'
        + '        <li class="list-inline-item"><span style="color: rgba(255,255,255,0.8); font-size: 12px;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '      </ul>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  // Render Latest Gaming News: one featured post full width (shorter height)
  function renderLatestGamingFeatured(container, featuredPost){
    if (!container) return;
    var html = '';
    if (featuredPost) {
      var seoUrl = generateSeoUrl(featuredPost);
      html += (
        '<div class="col-12">'
        + '  <div class="card__post">'
        + '    <div class="card__post__body" style="position: relative;">'
        + '      <a href="' + esc(seoUrl) + '">'
        + '        <img src="' + esc(safeImg(featuredPost)) + '" class="img-fluid" alt="' + esc(featuredPost.title || '') + '" style="height: 220px; object-fit: cover; width: 100%;">'
        + '      </a>'
        + (function(){ var _c = categoryLabel(featuredPost); return _c ? ('<span class="badge badge-pill card__post__category" style="position:absolute;top:10px;left:10px;font-weight:700;">' + _c + '</span>') : ''; })()
        + '      <div class="card__post__content" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 16px 14px 12px;">'
        + '        <div class="card__post__title">'
        + '          <h5 style="color: white; margin:0 0 6px 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);"><a href="' + esc(seoUrl) + '" style="color: white; text-decoration:none;">' + esc(featuredPost.title || 'Untitled') + '</a></h5>'
        + '        </div>'
        + '        <ul class="list-inline" style="margin-bottom: 0;">'
        + '          <li class="list-inline-item"><span style="color: rgba(255,255,255,0.9); font-size: 12px;">' + AUTHOR_TEXT + '</span></li>'
        + '          <li class="list-inline-item"><span style="color: rgba(255,255,255,0.85); font-size: 12px;">' + esc(fmtDate(featuredPost.published_at || featuredPost.created_at)) + '</span></li>'
        + '        </ul>'
        + '      </div>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    }
    container.innerHTML = html;
  }

  // Compact list for small posts (used under Latest Gaming News)
  function renderSmallList(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 2).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="card__post card__post-list" style="margin-bottom: 1rem;">'
        + '  <div class="card__post__body d-flex">'
        + '    <a href="' + esc(seoUrl) + '" class="mr-3" style="flex:0 0 80px;min-width:80px;">'
        + '      <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="width:80px;height:80px;object-fit:cover;">'
        + '    </a>'
        + '    <div style="flex:1;min-width:0;">'
        + '      <h6 class="card__post__title" style="margin-bottom:0.25rem;font-size:14px;line-height:1.4;"><a href="' + esc(seoUrl) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '      <ul class="list-inline mb-0">'
        + '        <li class="list-inline-item"><span style="font-size:12px;color:#7ea9ff;">' + AUTHOR_TEXT + '</span></li>'
        + '        <li class="list-inline-item"><span style="font-size:12px;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '      </ul>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  // Sidebar block: Latest Post (featured image + 3 items)
  function renderLatestSidebar(container, featuredPost, items){
    if (!container) return;
    var html = '';
    if (featuredPost) {
      var cat = categoryLabel(featuredPost);
      var featuredSeoUrl = generateSeoUrl(featuredPost);
      html += (
        '<div class="card__post" style="margin-bottom:1rem;">'
        + '  <div class="card__post__body" style="position:relative;">'
        + '    <a href="' + esc(featuredSeoUrl) + '">'
        + '      <img src="' + esc(safeImg(featuredPost)) + '" class="img-fluid" alt="' + esc(featuredPost.title || '') + '" style="width:100%;height:170px;object-fit:cover;">'
        + '    </a>'
        + (cat ? ('<span class="badge badge-pill card__post__category" style="position:absolute;top:10px;left:10px;font-weight:700;">' + cat + '</span>') : '')
        + '    <div class="card__post__content" style="position:absolute;left:0;right:0;bottom:0;background:linear-gradient(transparent, rgba(0,0,0,0.85));padding:12px 14px;">'
        + '      <h6 class="card__post__title" style="margin:0 0 6px 0;color:#fff;line-height:1.3;"><a href="' + esc(featuredSeoUrl) + '" style="color:#fff;text-decoration:none;">' + esc(featuredPost.title || 'Untitled') + '</a></h6>'
        + '      <ul class="list-inline" style="margin:0;">'
        + '        <li class="list-inline-item"><span style="font-size:12px;color:rgba(255,255,255,0.9);">' + AUTHOR_TEXT + '</span></li>'
        + '        <li class="list-inline-item"><span style="font-size:12px;color:rgba(255,255,255,0.85);">' + esc(fmtDate(featuredPost.published_at || featuredPost.created_at)) + '</span></li>'
        + '      </ul>'
        + '    </div>'
        + '  </div>'
        + '</div>'
        + '<div style="margin-bottom:0.75rem;"><a href="' + esc(featuredSeoUrl) + '" class="btn btn-primary btn-sm" style="padding:6px 10px;font-weight:600;">Read More</a></div>'
      );
    }
    (items || []).slice(0,3).forEach(function(p){
      var cat = categoryLabel(p);
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="card__post card__post-list" style="margin-bottom:0.75rem;">'
        + '  <div class="card__post__body d-flex">'
        + '    <a href="' + esc(seoUrl) + '" class="mr-3" style="flex:0 0 70px;min-width:70px;">'
        + '      <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="width:70px;height:70px;object-fit:cover;">'
        + '    </a>'
        + '    <div style="flex:1;min-width:0;">'
        + (cat ? ('      <span class="badge badge-pill category" style="display:inline-block;margin-bottom:4px;font-weight:700;">' + cat + '</span>') : '')
        + '      <h6 class="card__post__title" style="margin:0 0 4px 0;font-size:14px;line-height:1.4;"><a href="' + esc(seoUrl) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '      <span style="font-size:12px;color:#999;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  function renderGrid(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 4).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="col-md-6 col-lg-6">'
        + '  <div class="card__post">'
        + '    <div class="card__post__body">'
        + '      <a href="' + esc(seoUrl) + '"><img src="' + esc(safeImg(p)) + '" class="img-fluid" alt=""></a>'
        + '    </div>'
        + '    <div class="card__post__content">'
        + '      <div class="card__post__title">'
        + '      <h6><a href="' + esc(seoUrl) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '      </div>'
        + '      <ul class="list-inline">'
        + '        <li class="list-inline-item"><span>' + AUTHOR_TEXT + '</span></li>'
        + '        <li class="list-inline-item"><span>' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '      </ul>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  function renderSidebarList(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 4).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="card__post card__post-list" style="margin-bottom:0.75rem;">'
        + '  <div class="card__post__body d-flex">'
        + '    <a href="' + esc(seoUrl) + '" class="mr-3" style="flex:0 0 100px;min-width:100px;">'
        + '      <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="width:100px;height:100px;object-fit:cover;">'
        + '    </a>'
        + '    <div style="flex:1;min-width:0;">'
        + '      <h6 class="card__post__title" style="margin-bottom:0.5rem;"><a href="' + esc(seoUrl) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '      <ul class="list-inline mb-0">'
        + '        <li class="list-inline-item"><span style="font-size:12px;color:#7ea9ff;">' + AUTHOR_TEXT + '</span></li>'
        + '        <li class="list-inline-item"><span style="font-size:12px;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '      </ul>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  function renderHorizontalList(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 3).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="card__post card__post-list" style="margin-bottom:1rem;">'
        + '  <div class="card__post__body d-flex">'
        + '    <a href="' + esc(seoUrl) + '" class="mr-3" style="flex:0 0 240px;min-width:240px;">'
        + '      <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="width:240px;height:160px;object-fit:cover;">'
        + '    </a>'
        + '    <div style="flex:1;min-width:0;padding:10px 0;">'
        + (function(){ var _c = categoryLabel(p); return _c ? ('<span class="badge badge-pill category" style="display:inline-block;margin-bottom:8px;font-weight:700;">' + _c + '</span>') : ''; })()
        + '      <h6 class="card__post__title" style="margin:0;font-size:16px;line-height:1.45;"><a href="' + esc(seoUrl) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '      <ul class="list-inline" style="margin:8px 0 0 0;">'
        + '        <li class="list-inline-item"><span style="font-size:12px;color:#7ea9ff;">' + AUTHOR_TEXT + '</span></li>'
        + '        <li class="list-inline-item"><span style="font-size:12px;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '      </ul>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  function renderTextList(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 5).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div style="margin-bottom:0.75rem;">'
        + '  <div style="border-bottom:1px solid #eee;padding-bottom:0.5rem;">'
        + '    <h6 style="margin:0 0 0.5rem 0;font-size:14px;line-height:1.4;"><a href="' + esc(seoUrl) + '" style="color:inherit;text-decoration:none;">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '    <span style="font-size:12px;color:#999;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  function renderLargeGrid(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 6).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="col-md-4 col-lg-4">'
        + '  <div class="card__post">'
        + '    <div class="card__post__body">'
        + '      <a href="' + esc(seoUrl) + '"><img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="" style="height:240px;object-fit:cover;width:100%;"></a>'
        + '    </div>'
        + '    <div class="card__post__content">'
        + '      <div class="card__post__title">'
        + '      <h6><a href="' + esc(seoUrl) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '      </div>'
        + '      <ul class="list-inline">'
        + '        <li class="list-inline-item"><span>' + AUTHOR_TEXT + '</span></li>'
        + '        <li class="list-inline-item"><span>' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '      </ul>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  function renderCompactList(container, posts){
    if (!container) return;
    var html = '';
    posts.slice(0, 4).forEach(function(p){
      var seoUrl = generateSeoUrl(p);
      html += (
        '<div class="card__post card__post-list" style="margin-bottom:0.75rem;">'
        + '  <div class="card__post__body d-flex">'
        + '      <a href="' + esc(seoUrl) + '" class="mr-3" style="flex:0 0 120px;min-width:120px;">'
        + '        <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="width:120px;height:90px;object-fit:cover;">'
        + '      </a>'
        + '      <div style="flex:1;min-width:0;">'
        + (function(){ var _c = categoryLabel(p); return _c ? ('<span class="badge badge-pill category" style="display:inline-block;margin-bottom:4px;font-weight:700;">' + _c + '</span>') : ''; })()
        + '        <h6 class="card__post__title" style="margin:0;font-size:14px;line-height:1.4;"><a href="' + esc(seoUrl) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '        <span style="font-size:12px;color:#999;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span>'
        + '      </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  // Tips & Strategies Hub renderer: image left, category badge, author + date, title
  function renderTipsHub(container, posts){
    if (!container) return;
    var html = '';
    posts.forEach(function(p){
      var cat = categoryLabel(p) || 'Tips & Strategies Hub';
      html += (
        '<div class="card__post card__post-list" style="margin-bottom: 1.25rem;">'
        + '  <div class="card__post__body d-flex">'
        + '    <a href="article-detail-v1.html?id=' + esc(p.id) + '" class="mr-3" style="flex:0 0 240px;min-width:240px;">'
        + '      <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="width:240px;height:150px;object-fit:cover;">'
        + '    </a>'
        + '    <div style="flex:1;min-width:0;">'
        + '      <span class="badge badge-pill category" style="display:inline-block;margin-bottom:6px;font-weight:700;">' + esc(cat) + '</span>'
        + '      <ul class="list-inline" style="margin:0 0 6px 0;">'
        + '        <li class="list-inline-item"><span style="font-size:12px;color:#7ea9ff;">' + AUTHOR_TEXT + '</span></li>'
        + '        <li class="list-inline-item"><span style="font-size:12px;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
        + '      </ul>'
        + '      <h6 class="card__post__title" style="margin:0;font-size:16px;line-height:1.45;"><a href="article-detail-v1.html?id=' + esc(p.id) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '    </div>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  // Render numbered list for Popular Posts sidebar
  function renderNumberedList(container, posts){
    if (!container) return;
    var html = '';
    posts.forEach(function(p, idx){
      var num = idx + 1;
      var cat = categoryLabel(p);
      html += (
        '<div class="wrapper__list-number-item" style="display:flex;align-items:flex-start;margin-bottom:1rem;">'
        + '  <span class="wrapper__list-number-number" style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;background:#4a90e2;color:#fff;border-radius:50%;font-weight:700;margin-right:12px;flex-shrink:0;">' + num + '</span>'
        + '  <div style="flex:1;min-width:0;">'
        + (cat ? ('    <span class="badge badge-pill category" style="display:inline-block;margin-bottom:6px;font-weight:700;">' + cat + '</span>') : '')
        + '    <h6 style="margin:0 0 0.5rem 0;font-size:14px;line-height:1.4;"><a href="' + generateSeoUrl(p) + '" style="color:inherit;text-decoration:none;">' + esc(p.title || 'Untitled') + '</a></h6>'
        + '    <span style="font-size:12px;color:#999;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span>'
        + '  </div>'
        + '</div>'
      );
    });
    container.innerHTML = html;
  }

  // Render sports as a slider of landscape cards
  function renderSportsRow(container, posts){
    if (!container) return;
    try {
      var html = '';
      posts.forEach(function(p){
        html += (
          '<div class="item">'
          + '  <article class="article__entry">'
          + '    <div class="article__image">'
          + '      <a href="' + generateSeoUrl(p) + '"><img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="" style="height:240px;object-fit:cover;width:100%;"></a>'
          + '    </div>'
          + '    <div class="article__content">'
          + '      <ul class="list-inline"><li class="list-inline-item"><span>' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li></ul>'
          + '      <h6><a href="' + generateSeoUrl(p) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
          + '    </div>'
          + '  </article>'
          + '</div>'
        );
      });
      container.innerHTML = html;
    } catch (e) { console.warn('[home] renderSportsRow failed:', e); }
  }

  // Render thin 3-post strip above hero (auto-scrolling)
  function renderUnderHeroStrip(container, posts){
    if (!container) return;
    try {
      var html = '';
      posts.forEach(function(p){
        var cat = categoryLabel(p);
        html += (
          '<div class="item">'
          + '  <div class="card__post card__post-list" style="margin-bottom:0;">'
          + '    <div class="card__post__body d-flex">'
          + '      <a href="' + generateSeoUrl(p) + '" class="mr-3" style="flex:0 0 120px;min-width:120px;">'
          + '        <img src="' + esc(safeImg(p)) + '" class="img-fluid" alt="' + esc(p.title || '') + '" style="width:120px;height:80px;object-fit:cover;">'
          + '      </a>'
          + '      <div style="flex:1;min-width:0;">'
          + (cat ? '        <span class="badge badge-pill category" style="display:inline-block;margin-bottom:4px;font-weight:700;">' + esc(cat) + '</span>' : '')
          + '        <ul class="list-inline" style="margin:0 0 4px 0;">'
          + '          <li class="list-inline-item"><span style="font-size:12px;color:#7ea9ff;">' + AUTHOR_TEXT + '</span></li>'
          + '          <li class="list-inline-item"><span style="font-size:12px;">' + esc(fmtDate(p.published_at || p.created_at)) + '</span></li>'
          + '        </ul>'
          + '        <h6 class="card__post__title" style="margin:0;font-size:14px;line-height:1.4;"><a href="' + generateSeoUrl(p) + '">' + esc(p.title || 'Untitled') + '</a></h6>'
          + '      </div>'
          + '    </div>'
          + '  </div>'
          + '</div>'
        );
      });
      container.innerHTML = html;
    } catch(e){ console.warn('[home] renderUnderHeroStrip failed:', e); }
  }

  // --- Data layer ---
  async function fetchLatestPosts(client, limit){
    try {
      try { showStatus('Querying published posts…', true); } catch(_){}
      var res = await client
        .from('posts')
        .select('id,title,image_url,created_at,published_at,status,main_category,subcategory')
        .eq('status','published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit || 24);
      if (res.error) { console.warn('[home] fetchLatestPosts error:', res.error.message || res.error); try { showStatus('DB error: ' + (res.error.message || res.error), false); } catch(_){} return []; }
      var rows = Array.isArray(res.data) ? res.data : [];
      if (!rows.length) {
        try { showStatus('No published posts found; trying fallback…', true); } catch(_){}
        // Fallback: fetch without status filter
        var res2 = await client
          .from('posts')
          .select('id,title,image_url,created_at,published_at,status,main_category,subcategory')
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(limit || 24);
        if (res2 && res2.error) { try { showStatus('DB error (fallback): ' + (res2.error.message || res2.error), false); } catch(_){} }
        if (res2 && !res2.error && Array.isArray(res2.data) && res2.data.length) {
          rows = res2.data;
        }
      }
      try { showStatus('Fetched posts: ' + (rows.length || 0), true); } catch(_){}
      return rows;
    } catch (e) { console.warn('[home] fetchLatestPosts crashed:', e); return []; }
  }

  // --- Static snapshot (Supabase Storage) ---
  // Try to read an inline JSON snapshot embedded in index.html
  function readInlineSnapshot(){
    try {
      var el = document.getElementById('home-snapshot');
      if (!el) return [];
      var text = (el.textContent || el.innerText || '').trim();
      if (!text) return [];
      var json = JSON.parse(text);
      return Array.isArray(json) ? json : [];
    } catch(_) { return []; }
  }
  async function fetchStaticHomepageSnapshot(client){
    try {
      var storage = client && client.storage;
      if (!storage || typeof storage.from !== 'function') { return []; }
      var candidates = ['homepage.json', 'latest.json', 'home_latest.json'];
      // Prefer public URL fetch (faster), fall back to download()
      try {
        for (var i = 0; i < candidates.length; i++){
          var name = candidates[i];
          var pub = storage.from('blog').getPublicUrl(name);
          var url = pub && pub.data && pub.data.publicUrl ? pub.data.publicUrl : null;
          if (url) {
            var r = await fetch(url, { cache: 'no-store' });
            if (r && r.ok) {
              var j = await r.json();
              if (Array.isArray(j) && j.length) {
                try { showStatus('Loaded static snapshot: ' + name, true); } catch(_){}
                return j;
              }
            }
          }
        }
      } catch(_) { /* continue to download fallback */ }
      for (var i = 0; i < candidates.length; i++){
        var name = candidates[i];
        var dl = await storage.from('blog').download(name);
        if (dl && !dl.error && dl.data) {
          try {
            var text = await dl.data.text();
            var json = JSON.parse(text);
            if (Array.isArray(json) && json.length) {
              try { showStatus('Loaded static snapshot: ' + name, true); } catch(_){}
              return json;
            }
          } catch(_) { /* continue */ }
        }
      }
      return [];
    } catch (e) { console.warn('[home] fetchStaticHomepageSnapshot failed:', e); return []; }
  }

  // --- Page orchestration (cache-first) ---
  async function initHomepage(){
    var client = getClient();
    if (!client) { console.warn('[home] Supabase not ready'); return; }

    var cacheTTL = 43200; // seconds (12 hours) to keep return visits instant
    var cacheKey = 'home:latest';

    // Read inline snapshot synchronously if embedded
    var inlineSnapshot = readInlineSnapshot();
    // Begin requesting static snapshot for quick initial paint
    var staticSnapshotPromise = fetchStaticHomepageSnapshot(client);

    // DOM targets
    var hero = document.querySelector('.card__post-carousel');
    var underHeroStrip = document.querySelector('.wrapp__list__article-responsive-carousel');
    var heroRight = document.querySelector('.popular__news-right');
    var latestGrid = document.getElementById('latestGamingGrid');
    var latestLeft = document.getElementById('latestGamingListLeft');
    var latestRight = document.getElementById('latestGamingListRight');
    var cultureGrid = document.getElementById('cultureLifestyleGrid');
    var popularList = document.getElementById('popularPostsList');
    var sports = document.getElementById('sportsCarousel');
    var latestSmall = document.getElementById('latestPostsSmallList');
    var tipsList = document.getElementById('tipsStrategiesList');

    function paintAll(posts){
      try {
        var a = posts.slice(0);
        // Keep Popular showing true top 5
        var popularPosts = a.slice(0, 5);
        // Filter Sports section strictly by sports-related categories with graceful fallback
        var sportsPosts = filterByCategory(a, ['sports betting','football betting','cricket betting','tennis betting','kabaddi betting'], Math.min(8, a.length));
        if (!sportsPosts.length) { sportsPosts = a.slice(0, Math.min(8, a.length)); }
        var stripPosts = a.slice(0, 3).length ? a.slice(0, 3) : a.slice(0, Math.min(3, a.length));
        // Primary layout with fallbacks to avoid empty sections when content is limited
        var heroPosts  = a.slice(0, 4);
        var rightPosts = a.slice(4, 6).length ? a.slice(4, 6) : a.slice(0, Math.min(2, a.length));
        var featured   = a[6] || a[0] || null;
        var leftSmall  = a.slice(7, 9).length ? a.slice(7, 9) : a.slice(1, Math.min(3, a.length));
        var rightSmall = a.slice(9, 11).length ? a.slice(9, 11) : a.slice(3, Math.min(5, a.length));
        var latestFeatured = a[11] || a[0] || null;
        var latestItems    = a.slice(12, 15).length ? a.slice(12, 15) : a.slice(1, Math.min(4, a.length));
        // Filter Tips & Strategies strictly by tips-related categories with graceful fallback
        var tipsPosts  = filterByCategory(a, ['strategies tips','tips strategies hub'], Math.min(6, a.length));
        if (!tipsPosts.length) { tipsPosts = a.slice(0, Math.min(6, a.length)); }
        // Filter Culture & Lifestyle strictly by culture category with graceful fallback
        var culturePosts = filterByCategory(a, ['culture lifestyle'], Math.min(6, a.length));
        if (!culturePosts.length) { culturePosts = a.slice(0, Math.min(4, a.length)); }

        // Preserve structure: hero carousel stays inside .card__post-carousel; right column in .popular__news-right
        renderHeroCarousel(hero, heroPosts);
        renderUnderHeroStrip(underHeroStrip, stripPosts);
        renderRightStack(heroRight, rightPosts);
        renderLatestGamingFeatured(latestGrid, featured);
        renderSmallList(latestLeft, leftSmall);
        renderSmallList(latestRight, rightSmall);
        renderNumberedList(popularList, popularPosts); // Use numbered list for Popular Posts
        renderSportsRow(sports, sportsPosts);
        renderLatestSidebar(latestSmall, latestFeatured, latestItems);
        renderTipsHub(tipsList, tipsPosts);
        renderGrid(cultureGrid, culturePosts);

        // Initialize carousels after content is rendered
        try {
          // Hero carousel (left side) - initialize Slick after dynamic render
          if (hero && hero.children.length > 0) {
            var $hero = (typeof jQuery !== 'undefined') ? jQuery(hero) : null;
            if ($hero && typeof $hero.slick === 'function') {
              try { if ($hero.hasClass('slick-initialized')) { $hero.slick('unslick'); } } catch(_) {}
              $hero.slick({
                slidesToShow: 1,
                autoplay: true,
                dots: false,
                lazyLoad: 'progressive',
                prevArrow: "<button type='button' class='slick-prev pull-left'><i class='fa fa-angle-left' aria-hidden='true'></i></button>",
                nextArrow: "<button type='button' class='slick-next pull-right'><i class='fa fa-angle-right' aria-hidden='true'></i></button>"
              });
            }
          }
          // Strip above hero: 3 visible, auto-scroll
          if (underHeroStrip && underHeroStrip.children.length > 0) {
            var $strip = (typeof jQuery !== 'undefined') ? jQuery(underHeroStrip) : null;
            if ($strip && typeof $strip.slick === 'function') {
              try { if ($strip.hasClass('slick-initialized')) { $strip.slick('unslick'); } } catch(_){ }
              $strip.slick({
                slidesToShow: 3,
                slidesToScroll: 1,
                autoplay: true,
                autoplaySpeed: 3000,
                pauseOnHover: true,
                arrows: false,
                dots: false,
                lazyLoad: 'progressive',
                responsive: [
                  { breakpoint: 1024, settings: { slidesToShow: 2 } },
                  { breakpoint: 576, settings: { slidesToShow: 1 } }
                ]
              });
            }
          }
          // Sports section slider init
          if (sports && sports.children.length > 0) {
            var $sports = (typeof jQuery !== 'undefined') ? jQuery(sports) : null;
          if ($sports && typeof $sports.slick === 'function') {
            try { if ($sports.hasClass('slick-initialized')) { $sports.slick('unslick'); } } catch(_){ }
            $sports.slick({
              slidesToShow: 3,
              slidesToScroll: 1,
              autoplay: true,
              autoplaySpeed: 2500,
              pauseOnHover: true,
              arrows: false,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: "",
              nextArrow: "",
              responsive: [
                { breakpoint: 992, settings: { slidesToShow: 2 } },
                { breakpoint: 576, settings: { slidesToShow: 1 } }
              ]
            });
          }
          }
          // Apply category colors for newly injected badges
          applyCategoryColorsDynamic();
           // Equalize heights between Latest Gaming (left) and Popular Post (right)
           // Soften: avoid hard clamping to prevent extra blank space below Popular
           try {
             var leftCol = document.querySelector('.popular__section-news .col-lg-8');
             var rightAside = document.querySelector('.popular__section-news .col-lg-4 aside.wrapper__list__article');
             if (leftCol && rightAside) {
               var lh = leftCol.offsetHeight;
               // Remove hard clamp; only ensure a minimum height for visual balance
               rightAside.style.minHeight = lh + 'px';
               rightAside.style.maxHeight = '';
               rightAside.style.overflow = '';
             }
           } catch(_){}
          // Spacing above Sports is now handled in CSS to avoid JS layout hacks.
          try {
            /* Intentionally left blank: CSS overrides collapse the outside gap
               without touching internal title/content spacing. */
          } catch(_){}
        } catch (e) { console.warn('[home] Carousel init error:', e); }

        try { if (typeof window.hideLoadingContainers === 'function') window.hideLoadingContainers(); } catch(_) {}
        try { hideStatusSoon(); } catch(_) {}
      } catch (e) { console.warn('[home] paintAll failed:', e); }
    }

    // 1) Inline snapshot paint (if present), then cache-first
    var t0 = (performance && performance.now) ? performance.now() : Date.now();
    var cached = readCache(cacheKey, cacheTTL);
    var painted = false;
    if (Array.isArray(inlineSnapshot) && inlineSnapshot.length) {
      writeCache(cacheKey, inlineSnapshot);
      paintAll(inlineSnapshot);
      painted = true;
    }
    if (Array.isArray(cached) && cached.length && !isPrewarmData(cached)) {
      paintAll(cached);
      painted = true;
    }

    // Prefer static snapshot whenever available (over dummy cache)
    var staticSnapshot = [];
    try { staticSnapshot = await staticSnapshotPromise; } catch(_) { staticSnapshot = []; }
    if (Array.isArray(staticSnapshot) && staticSnapshot.length) {
      writeCache(cacheKey, staticSnapshot);
      paintAll(staticSnapshot);
      painted = true;
    } else if (!painted && Array.isArray(cached) && cached.length) {
      // If we didn’t paint yet, fall back to cached (even if prewarm)
      paintAll(cached);
      painted = true;
    }

    // 2) Fresh fetch
    var fresh = await fetchLatestPosts(client, 30);
    var t1 = (performance && performance.now) ? performance.now() : Date.now();
    try { showStatus('Fetched posts: ' + (fresh && fresh.length ? fresh.length : 0) + ' in ' + Math.round(t1 - t0) + 'ms', true); } catch(_){}
    if (fresh && fresh.length) {
      writeCache(cacheKey, fresh);
      paintAll(fresh);
    } else if (!cached || !cached.length) {
      try {
        var wrap = document.querySelector('.popular__section-news .container');
        if (wrap) {
          var note = document.createElement('div');
          note.style.padding = '10px';
          note.style.margin = '10px 0';
          note.style.border = '1px dashed rgba(255,255,255,0.2)';
          note.style.color = '#bbb';
          note.textContent = 'No posts returned from database.';
          wrap.prepend(note);
        }
      } catch(_) {}
      try { showStatus('No posts returned from database', false); } catch(_){}
      paintAll([]);
    }
  }

  // Expose and auto-run
  window.initHomepage = initHomepage;
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initHomepage); } else { initHomepage(); }
  
  // Status banner helper
  function showStatus(message, ok){
    try {
      var id = 'home-supabase-status';
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement('div');
        el.id = id;
        el.style.position = 'fixed';
        el.style.top = '10px';
        el.style.right = '10px';
        el.style.zIndex = '99999';
        el.style.fontFamily = 'system-ui, sans-serif';
        el.style.fontSize = '12px';
        el.style.padding = '8px 10px';
        el.style.borderRadius = '6px';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        document.body.appendChild(el);
      }
      el.style.background = ok ? 'rgba(33,150,83,0.9)' : 'rgba(198,40,40,0.9)';
      el.style.color = '#fff';
      el.textContent = String(message || '');
    } catch(_){}
  }

  function hideStatusSoon(){
    try {
      var el = document.getElementById('home-supabase-status');
      if (!el) return;
      setTimeout(function(){ try { el.parentNode && el.parentNode.removeChild(el); } catch(_){} }, 2500);
    } catch(_){}
  }
})();