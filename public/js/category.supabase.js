/*
  Dynamic Category Page powered by Supabase
  - Parses category slug from URL/hash/query
  - Clears dummy content and renders posts from Supabase
  - Updates breadcrumbs, page title, and heading
*/

(function () {
  function getClient() {
    if (window.supabaseClient) return window.supabaseClient;
    if (window.supabase && typeof window.supabase.createClient === 'function' && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      try {
        window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
        return window.supabaseClient;
      } catch (e) {
        console.error('Failed creating Supabase client', e);
      }
    }
    console.warn('Supabase client not available.');
    return null;
  }

  // Simple localStorage cache helpers to enable instant content paint
  function readCache(key, maxAgeSeconds) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj.ts !== 'number') return null;
      var age = (Date.now() - obj.ts) / 1000;
      if (maxAgeSeconds && age > maxAgeSeconds) return null;
      return obj.data || null;
    } catch (_) {
      return null;
    }
  }
  function writeCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (_) {}
  }

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function labelFromSlug(slug) {
    var map = {
      'sports-betting': 'Sports Betting',
      'culture-lifestyle': 'Culture & Lifestyle',
      'tips-strategies-hub': 'Tips & Strategies Hub',
      'casino-bonuses': 'Casino Bonuses',
      'news-industry-updates': 'News & Industry Updates',
      'legal-regulatory-updates': 'Legal & Regulatory Updates',
      'how-to-guides': 'How-To Guides',
      'faqs-beginner-resources': 'FAQs & Beginner Resources',
      'poker': 'Poker',
      'roulette': 'Roulette',
      'blackjack': 'Blackjack',
      'online-slots': 'Online Slots',
      'football-betting': 'Football Betting',
      'cricket-betting': 'Cricket Betting',
      'tennis-betting': 'Tennis Betting',
      'kabaddi-betting': 'Kabaddi Betting',
      'game-reviews': 'Game Reviews'
    };
    if (map[slug]) return map[slug];
    return String(slug || '')
      .split('-')
      .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
      .join(' ');
  }

  function getSelectedSlug() {
    // Query param support: ?category=slug
    var params = new URLSearchParams(window.location.search);
    var q = params.get('category');
    if (q) return slugify(q);

    // Hash support: #slug
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (hash) return slugify(hash);

    // Path support: /category/<slug>/ or top-level /<slug>/ in parent frame
    var path = '';
    try {
      path = (window.top && window.top.location && window.top.location.pathname) || window.location.pathname || '';
    } catch (e) {
      path = window.location.pathname || '';
    }

    var m = path.match(/\/category\/([^\/?#]+)(?:\/|$)/i);
    if (m && m[1]) return slugify(m[1]);

    var m2 = path.match(/^\/([^\/?#]+)(?:\/|$)/);
    if (m2 && m2[1] && !/^(category|index\.html|category-style-v2)$/i.test(m2[1])) {
      return slugify(m2[1]);
    }
    return null;
  }

  function applyCategoryColors(el, label) {
    if (!el) return;
    var normalized = String(label || '').toLowerCase();
    var className = 'cl-orange';
    switch (normalized) {
      case 'sports betting':
      case 'football betting':
      case 'cricket betting':
      case 'tennis betting':
      case 'kabaddi betting':
        className = 'cl-blue';
        break;
      case 'casino bonuses':
      case 'online slots':
        className = 'cl-yellow';
        break;
      case 'culture & lifestyle':
        className = 'cl-pink';
        break;
      case 'tips & strategies hub':
      case 'how-to guides':
        className = 'cl-green';
        break;
      case 'legal & regulatory updates':
        className = 'cl-red';
        break;
      case 'news & industry updates':
        className = 'cl-orange';
        break;
      default:
        className = 'cl-orange';
    }
    var span = el.querySelector('.article__category') || el;
    span.classList.add(className);
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function safeTitle(post){
    return (post && post.title) ? String(post.title) : 'Untitled';
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

  function articleUrl(post) {
    var title = safeTitle(post);
    var slug = slugifyTitle(title);
    return slug ? ('/' + slug) : '/';
  }

  function buildArticleEntry(post, label) {
    var img = post.image_url || 'images/placeholder/800x600.jpg';
    var href = articleUrl(post);
    var date = formatDate(post.published_at || post.created_at);
    var title = post.title || 'Untitled';

    var wrapper = document.createElement('div');
    wrapper.className = 'article__entry';
    wrapper.setAttribute('data-category', label || '');
    wrapper.innerHTML =
      '<div class="article__image">\n' +
      '  <a href="' + href + '" data-article-id="' + (post && post.id ? post.id : '') + '" data-article-slug="' + slugifyTitle(title) + '"><img src="' + img + '" alt="' + (title || '') + '" class="img-fluid"></a>\n' +
      '</div>\n' +
      '<div class="article__content">\n' +
      '  <div class="article__category">' + (label || '') + '</div>\n' +
      '  <ul class="list-inline article__date">\n' +
      '    <li class="list-inline-item">' + date + '</li>\n' +
      '  </ul>\n' +
      '  <h5><a href="' + href + '" data-article-id="' + (post && post.id ? post.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">' + title + '</a></h5>\n' +
      '  <a href="' + href + '" data-article-id="' + (post && post.id ? post.id : '') + '" data-article-slug="' + slugifyTitle(title) + '" class="btn btn-outline-primary btn-sm">Read More</a>\n' +
      '</div>';
    return wrapper;
  }

  async function fetchPostsByCategory(label, limit) {
    var client = getClient();
    if (!client) return [];
    var fields = 'id,title,image_url,created_at,published_at,status,main_category,subcategory';
    var byMain = [];
    var bySub = [];
    try {
      var r1 = await client
        .from('posts')
        .select(fields)
        .eq('status', 'published')
        .eq('main_category', label)
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit || 12);
      if (!r1.error && Array.isArray(r1.data)) byMain = r1.data;
    } catch (e) {
      console.error('Error fetching main_category', e);
    }
    try {
      var r2 = await client
        .from('posts')
        .select(fields)
        .eq('status', 'published')
        .eq('subcategory', label)
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit || 12);
      if (!r2.error && Array.isArray(r2.data)) bySub = r2.data;
    } catch (e) {
      console.error('Error fetching subcategory', e);
    }
    var map = {};
    var merged = [];
    [].concat(byMain, bySub).forEach(function (p) {
      if (p && !map[p.id]) { map[p.id] = true; merged.push(p); }
    });
    return merged;
  }

  function clearDummyContentAndInitContainers(displayName) {
    var mainColumn = document.querySelector('.row .col-md-8');
    var mainList = mainColumn ? mainColumn.querySelector('.wrapper__list__article') : null;
    if (mainList) {
      mainList.innerHTML = '';
      var heading = document.createElement('h4');
      heading.className = 'border_section title-orange';
      heading.id = 'categoryTitle';
      heading.textContent = displayName;
      mainList.appendChild(heading);
      var grid = document.createElement('div');
      grid.id = 'categoryPostsGrid';
      grid.className = 'row';
      mainList.appendChild(grid);
    }

    var sidebarColumn = document.querySelector('.row .col-md-4');
    var sideList = sidebarColumn ? sidebarColumn.querySelector('.wrapper__list__article') : null;
    if (sideList) {
      sideList.innerHTML = '';
      var sHeading = document.createElement('h4');
      sHeading.className = 'border_section';
      sHeading.id = 'sidebarTitle';
      sHeading.textContent = 'Recent in ' + displayName;
      sideList.appendChild(sHeading);
      var sContainer = document.createElement('div');
      sContainer.id = 'categorySidebarList';
      sideList.appendChild(sContainer);
    }

    // Preserve existing pagination and sidebar widgets; we only replace main list content.
  }

  function renderPosts(displayName, posts) {
    var grid = document.getElementById('categoryPostsGrid');
    var side = document.getElementById('categorySidebarList');
    if (!grid) return;
    // Always clear existing content before (re)rendering to avoid duplicates
    try { grid.innerHTML = ''; } catch(_){}
    if (side) { try { side.innerHTML = ''; } catch(_){} }

    if (!posts || posts.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'col-12';
      empty.innerHTML = '<p>No posts found for this category yet.</p>';
      grid.appendChild(empty);
      if (side) side.innerHTML = '';
      return;
    }

    // Main grid: render up to 12 entries in two-column layout
    posts.slice(0, 12).forEach(function (post) {
      var col = document.createElement('div');
      col.className = 'col-md-6';
      var entry = buildArticleEntry(post, displayName);
      applyCategoryColors(entry, displayName);
      col.appendChild(entry);
      grid.appendChild(col);
    });

    // Sidebar: show next up to 6 items as a compact list
    if (side) {
      posts.slice(12, 18).forEach(function (post) {
        var img = post.image_url || 'images/placeholder/800x600.jpg';
        var href = articleUrl(post);
        var item = document.createElement('div');
        item.className = 'widget__article-small';
        item.innerHTML =
          '<div class="article__entry">\n' +
          '  <div class="article__image">\n' +
          '    <a href="' + href + '" data-article-id="' + (post && post.id ? post.id : '') + '" data-article-slug="' + slugifyTitle(post.title || '') + '"><img src="' + img + '" alt="' + (post.title || '') + '" class="img-fluid"></a>\n' +
          '  </div>\n' +
          '  <div class="article__content">\n' +
          '    <div class="article__category">' + displayName + '</div>\n' +
          '    <ul class="list-inline article__date"><li class="list-inline-item">' + formatDate(post.published_at || post.created_at) + '</li></ul>\n' +
          '    <h6><a href="' + href + '" data-article-id="' + (post && post.id ? post.id : '') + '" data-article-slug="' + slugifyTitle(post.title || '') + '">' + (post.title || 'Untitled') + '</a></h6>\n' +
          '  </div>\n' +
          '</div>';
        applyCategoryColors(item, displayName);
        side.appendChild(item);
      });
    }
  }

  function updateChrome(displayName) {
    document.title = 'Category: ' + displayName;
    var heading = document.getElementById('categoryTitle') || document.querySelector('.border_section');
    if (heading) heading.textContent = displayName;
    var crumb = document.getElementById('breadcrumbsCurrent');
    if (crumb) crumb.textContent = displayName;
  }

  // Render a specific page into grid and sidebar slices
  function renderPostsPage(displayName, posts, pageIndex) {
    var perGrid = 12; // grid shows 12 items per page
    var perSidebar = 6; // sidebar shows next 6 items
    var start = (pageIndex - 1) * perGrid;
    var slice = posts.slice(start, start + perGrid + perSidebar);
    renderPosts(displayName, slice);
  }

  // Initialize pagination: build links based on total posts and wire up navigation
  function initPagination(displayName, slug, posts){
    var container = document.querySelector('.pagination-area .pagination');
    if (!container) return;
    var perGrid = 12;
    var totalPages = Math.max(1, Math.ceil(posts.length / perGrid));
    // Rebuild anchors to reflect actual page count
    try { container.innerHTML = ''; } catch(_){}
    var mk = function(text, page){
      var a = document.createElement('a');
      a.href = '#';
      a.textContent = text;
      if (typeof page === 'number') a.setAttribute('data-page', String(page));
      return a;
    };
    var prev = mk('«');
    container.appendChild(prev);
    for (var i=1;i<=totalPages;i++) container.appendChild(mk(String(i), i));
    var next = mk('»');
    container.appendChild(next);

    var current = parseInt(localStorage.getItem('category:'+slug+':page') || '1', 10);
    if (!(current >=1 && current <= totalPages)) current = 1;
    // Apply active state
    [].slice.call(container.querySelectorAll('a[data-page]')).forEach(function(a){
      var p = parseInt(a.getAttribute('data-page')||'0',10);
      if (p === current) a.classList.add('active'); else a.classList.remove('active');
    });
    // Initial render
    renderPostsPage(displayName, posts, current);
    // Wire click handlers
    container.addEventListener('click', function(e){
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      e.preventDefault();
      var text = (a.textContent || '').trim();
      if (text === '«') current = Math.max(1, current - 1);
      else if (text === '»') current = Math.min(totalPages, current + 1);
      else {
        var sel = parseInt(a.getAttribute('data-page')||text,10);
        if (sel>=1 && sel<=totalPages) current = sel;
      }
      localStorage.setItem('category:'+slug+':page', String(current));
      [].slice.call(container.querySelectorAll('a[data-page]')).forEach(function(a2){
        var p2 = parseInt(a2.getAttribute('data-page')||'0',10);
        if (p2 === current) a2.classList.add('active'); else a2.classList.remove('active');
      });
      renderPostsPage(displayName, posts, current);
    });
  }

  async function init() {
    var slug = getSelectedSlug();
    if (!slug) return; // keep default page if no slug
    var displayName = labelFromSlug(slug);
    updateChrome(displayName);
    // Cache-first paint without removing placeholders unless we have something
    var cached = readCache('category:' + slug, 7200);
    if (Array.isArray(cached) && cached.length) {
      clearDummyContentAndInitContainers(displayName);
      try { renderPosts(displayName, cached); } catch(_){}
      try { initPagination(displayName, slug, cached); } catch(_){}
    }
    var posts = await fetchPostsByCategory(displayName, 24);
    // After fresh fetch, build containers (if not already) and render
    clearDummyContentAndInitContainers(displayName);
    renderPosts(displayName, posts);
    try { initPagination(displayName, slug, posts); } catch(_){}
    if (Array.isArray(posts) && posts.length) {
      writeCache('category:' + slug, posts);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Intercept pretty slug links for local preview routing
  try {
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var id = a.getAttribute('data-article-id') || '';
      var slug = a.getAttribute('data-article-slug') || '';
      if (/^\/[a-z0-9\-]+\/?$/.test(href) && (id || slug)) {
        // Respect service worker-controlled navigation for pretty slugs
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          return;
        }
        // Fallback: route to detail HTML when SW is unavailable
        e.preventDefault();
        if (!slug) {
          var m = href.match(/^\/([a-z0-9\-]+)\/?$/);
          slug = m && m[1] ? m[1] : '';
        }
        var url = id
          ? ('article-detail-v1.html?id=' + encodeURIComponent(id) + (slug ? ('&slug=' + encodeURIComponent(slug)) : ''))
          : (slug ? ('article-detail-v1.html?slug=' + encodeURIComponent(slug)) : '');
        if (url) window.location.href = url;
      }
    }, true);
  } catch(_){}
})();