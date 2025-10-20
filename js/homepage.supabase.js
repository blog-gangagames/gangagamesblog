// Homepage dynamic content powered by Supabase (plain JS + jQuery)
// Renders: Latest Gaming (global latest), Sports Betting carousel, Popular Posts,
// Culture & Lifestyle grid, Tips & Strategies Hub list, Latest Post sidebar.
(function(){
  function getClient(){
    try {
      var client = window.supabaseClient || (typeof window.supabase !== 'undefined' ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null);
      if (!client) { console.warn('[homepage] Supabase client not initialized. Check SUPABASE_URL/ANON_KEY and CDN.'); }
      return client || null;
    } catch (e) { console.warn('Supabase client init failed:', e); return null; }
  }

  // LocalStorage cache helpers for instant UI paint
  function readCache(key, maxAgeSeconds){
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || typeof obj.ts !== 'number') return null;
      var ageSec = (Date.now() - obj.ts) / 1000;
      if (typeof maxAgeSeconds === 'number' && maxAgeSeconds >= 0 && ageSec > maxAgeSeconds) return null;
      return (obj.data !== undefined) ? obj.data : null;
    } catch(_) { return null; }
  }
  function writeCache(key, data){
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch(_){}
  }
  
  // Force cache refresh every 30 minutes (1800 seconds)
  const CACHE_MAX_AGE = 1800;
  
  // Immediately render cached content if available
  function renderCachedContent() {
    try {
      // Attempt to render any cached HTML sections for instant paint
      
      // Check if any cached HTML content exists (direct HTML caching)
      var heroHtmlCache = readCache('home:hero-header-html', CACHE_MAX_AGE);
      var heroRightHtmlCache = readCache('home:hero-right-html', CACHE_MAX_AGE);
      var latestGamingHtmlCache = readCache('home:latest-gaming-html', CACHE_MAX_AGE);
      var latestGamingLeftHtmlCache = readCache('home:latest-gaming-left-html', CACHE_MAX_AGE);
      var latestGamingRightHtmlCache = readCache('home:latest-gaming-right-html', CACHE_MAX_AGE);
      var sportsHtmlCache = readCache('home:sports-html', CACHE_MAX_AGE);
      var popularHtmlCache = readCache('home:popular-posts-html', CACHE_MAX_AGE);
      var cultureHtmlCache = readCache('home:culture-lifestyle-html', CACHE_MAX_AGE);
      var tipsHtmlCache = readCache('home:tips-strategies-html', CACHE_MAX_AGE);
      var sidebarHtmlCache = readCache('home:latest-sidebar-html', CACHE_MAX_AGE);
      var popularHeaderHtmlCache = readCache('home:popular-header-html', CACHE_MAX_AGE);
      var trendingHtmlCache = readCache('home:trending-html', CACHE_MAX_AGE);
      
      // Render HTML content directly if available
      if (heroHtmlCache) {
        var $hero = $('.popular__news-header .card__post-carousel');
        $hero.html(heroHtmlCache);
        try {
          if (!$hero.hasClass('slick-initialized')) {
            $hero.slick({
              slidesToShow: 1,
              autoplay: true,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: "<button type='button' class='slick-prev pull-left'><i class='fa fa-angle-left' aria-hidden='true'></i></button>",
              nextArrow: "<button type='button' class='slick-next pull-right'><i class='fa fa-angle-right' aria-hidden='true'></i></button>"
            });
          }
        } catch(e) { console.warn('[homepage] Error initializing hero slider:', e); }
      }
      if (heroRightHtmlCache) {
        $('.popular__news-right').html(heroRightHtmlCache);
      }
      
      if (latestGamingHtmlCache) {
        $('#latestGamingGrid').html(latestGamingHtmlCache);
      }
      if (latestGamingLeftHtmlCache) {
        $('#latestGamingListLeft').html(latestGamingLeftHtmlCache);
      }
      if (latestGamingRightHtmlCache) {
        $('#latestGamingListRight').html(latestGamingRightHtmlCache);
      }
      
      if (sportsHtmlCache) {
          $('#sportsCarousel').html(sportsHtmlCache);
          try {
            if (!$('#sportsCarousel').hasClass('slick-initialized')) {
              $('#sportsCarousel').slick({
                slidesToShow: 3,
                slidesToScroll: 3,
                autoplay: true,
                dots: false,
                lazyLoad: 'progressive',
                prevArrow: '<button type="button" class="slick-prev"><i class="fa fa-angle-left"></i></button>',
                nextArrow: '<button type="button" class="slick-next"><i class="fa fa-angle-right"></i></button>',
                responsive: [
                  { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
                  { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
                  { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
                ]
              });
            }
          } catch(e) { 
            console.warn('[homepage] Error initializing sports carousel:', e); 
          }
        }
      
      if (popularHeaderHtmlCache) {
        var $popularHeader = $('#dropdownNewsSlider');
        $popularHeader.html(popularHeaderHtmlCache);
        try {
          if (!$popularHeader.hasClass('slick-initialized')) {
            $popularHeader.slick({
              slidesToShow: 4,
              slidesToScroll: 4,
              autoplay: true,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: false,
              nextArrow: false,
              responsive: [
                { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
                { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
                { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
              ]
            });
          }
        } catch(e) { console.warn('[homepage] Error initializing popular header carousel:', e); }
      }
      
      if (popularHtmlCache) {
        $('#popularPostsList').html(popularHtmlCache);
      }
      
      if (cultureHtmlCache) {
        $('#cultureLifestyleGrid').html(cultureHtmlCache);
      }
      
      if (tipsHtmlCache) {
        $('#tipsStrategiesList').html(tipsHtmlCache);
      }
      
      if (sidebarHtmlCache) {
        $('#latestPostsSmallList').html(sidebarHtmlCache);
      }
      
      if (trendingHtmlCache) {
        var $trend = $('.wrapp__list__article-responsive-carousel');
        $trend.html(trendingHtmlCache);
        try {
          if (!$trend.hasClass('slick-initialized')) {
            $trend.slick({
              slidesToShow: 3,
              slidesToScroll: 3,
              autoplay: true,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: false,
              nextArrow: false,
              responsive: [
                { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
                { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
                { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
              ]
            });
          }
        } catch(e) { console.warn('[homepage] Error initializing trending slider:', e); }
      }
      
      // Apply category colors to all rendered content
      applyCategoryColors();
      
    } catch (e) {
      console.warn('[homepage] Error rendering cached content:', e);
      // Continue with normal loading if cache rendering fails
    }
  }
  
  // Cache HTML content after rendering
  function cacheRenderedHTML() {
    try {
      // Cache the rendered HTML for each section
      writeCache('home:hero-header-html', $('.popular__news-header .card__post-carousel').html());
      writeCache('home:hero-right-html', $('.popular__news-right').html());
      writeCache('home:latest-gaming-html', $('#latestGamingGrid').html());
      writeCache('home:latest-gaming-left-html', $('#latestGamingListLeft').html());
      writeCache('home:latest-gaming-right-html', $('#latestGamingListRight').html());
      writeCache('home:sports-html', $('#sportsCarousel').html());
      writeCache('home:popular-posts-html', $('#popularPostsList').html());
      writeCache('home:culture-lifestyle-html', $('#cultureLifestyleGrid').html());
      writeCache('home:tips-strategies-html', $('#tipsStrategiesList').html());
      writeCache('home:latest-sidebar-html', $('#latestPostsSmallList').html());
      writeCache('home:popular-header-html', $('#dropdownNewsSlider').html());
      writeCache('home:trending-html', $('.wrapp__list__article-responsive-carousel').html());
    } catch(e) {
      console.warn('[homepage] Error caching rendered HTML:', e);
    }
  }
  
  function renderCultureLifestyleFromCache(data) {
    if (!data) return;
    $('#cultureLifestyleGrid').html(data);
  }
  
  function renderTipsStrategiesFromCache(data) {
    if (!data) return;
    $('#tipsStrategiesList').html(data);
  }
  
  function renderLatestSidebarFromCache(data) {
    if (!data) return;
    $('#latestPostsSmallList').html(data);
  }

  // Normalize categories to match header taxonomy and remove irrelevant ones
  function normalizeCategoryLabel(value){
    try {
      var v = (value || '').trim();
      if (!v) return '';
      var key = v.toLowerCase();
      // Remove/replace categories that don't tally with header
      if (key === 'politics' || key === 'technology') {
        return 'News & Industry Updates';
      }
      // Map common variants to canonical header labels
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
      var m = MAP[key];
      return m ? m : value; // default to original if already valid
    } catch(_) { return value || ''; }
  }

  function fmtDate(input){
    try {
      var d = input ? new Date(input) : null;
      if (!d || isNaN(d.getTime())) return '';
      var y = d.getFullYear();
      var m = (d.getMonth()+1).toString().padStart(2,'0');
      var day = d.getDate().toString().padStart(2,'0');
      return y + '-' + m + '-' + day;
    } catch(_) { return ''; }
  }

  function applyCategoryColors(){
    try {
      var normalize = function (s) {
        return (s || "")
          .replace(/[&\/\\\-_,]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase();
      };
      var CATEGORY_COLOR_MAP = {
        "casino games": "cat-color-orange",
        "sports betting": "cat-color-green",
        "bonuses promotions": "cat-color-gold",
        "how to guides": "cat-color-orange",
        "responsible gambling": "cat-color-green",
        "online slots": "cat-color-orange",
        "poker": "cat-color-green",
        "roulette": "cat-color-gold",
        "blackjack": "cat-color-gold",
        "game reviews": "cat-color-orange",
        "football betting": "cat-color-green",
        "cricket betting": "cat-color-green",
        "tennis betting": "cat-color-green",
        "kabaddi betting": "cat-color-green",
        "loyalty vip programs": "cat-color-gold",
        "news industry updates": "cat-color-gold",
        "legal regulatory updates": "cat-color-gold",
        "culture lifestyle": "cat-color-orange",
        "strategies tips": "cat-color-orange",
        "tips strategies hub": "cat-color-orange",
        "faqs beginner resources": "cat-color-green",
        "casino bonuses": "cat-color-gold"
      };
      var selectors = [
        ".card__post__category",
        ".article__category",
        ".card__post__list .category",
        ".wrapper__list__article .category",
        ".category"
      ];
      selectors.forEach(function (sel) {
        var nodes = document.querySelectorAll(sel);
        nodes.forEach(function (el) {
          var key = normalize(el.textContent || el.innerText);
          var cls = CATEGORY_COLOR_MAP[key];
          if (!cls) return;
          el.className = (el.className || "").replace(/\bcat-color-[a-z]+\b/g, "").trim();
          el.classList.add(cls);
        });
      });
    } catch (e) {}
  }

  // Category-based Unsplash fallbacks for missing post images
  var UNSPLASH_FALLBACKS = {
    'sports betting': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&auto=format&fit=crop&w=1200',
    'cricket betting': 'https://images.unsplash.com/photo-1518081461900-126a5e284fc3?q=80&auto=format&fit=crop&w=1200',
    'football betting': 'https://images.unsplash.com/photo-1521419381108-200b5e32d3a4?q=80&auto=format&fit=crop&w=1200',
    'tennis betting': 'https://images.unsplash.com/photo-1516005223398-19b9d3f1f61a?q=80&auto=format&fit=crop&w=1200',
    'online slots': 'https://images.unsplash.com/photo-1534209373440-8b0f80e93942?q=80&auto=format&fit=crop&w=1200',
    'poker': 'https://images.unsplash.com/photo-1547128410-114395b0be61?q=80&auto=format&fit=crop&w=1200',
    'roulette': 'https://images.unsplash.com/photo-1514684070672-d3b970b5a54b?q=80&auto=format&fit=crop&w=1200',
    'news industry updates': 'https://images.unsplash.com/photo-1556761175-4b46a572f05b?q=80&auto=format&fit=crop&w=1200',
    'culture lifestyle': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&auto=format&fit=crop&w=1200',
    'tips strategies hub': 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?q=80&auto=format&fit=crop&w=1200',
    'default': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&auto=format&fit=crop&w=1200'
  };
  function normKey(s){
    try { return String(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim(); } catch(_) { return ''; }
  }
  function fallbackUnsplash(p){
    try {
      var rawCat = (p && (p.subcategory || p.main_category)) || '';
      var key = normKey(rawCat);
      return UNSPLASH_FALLBACKS[key] || UNSPLASH_FALLBACKS['default'];
    } catch(_) { return UNSPLASH_FALLBACKS['default']; }
  }

  function safeImage(p){
    try {
      var raw = (p && p.image_url) ? String(p.image_url) : '';
      if (!raw) return fallbackUnsplash(p);
      var u = raw.trim();
      // If already absolute http(s), use as-is
      if (/^https?:\/\//i.test(u)) return u;
      // Normalize local images
      if (u.startsWith('images/')) return '/' + u;
      if (u.startsWith('/images/')) return u;
      // Resolve Supabase storage relative paths
      var supa = (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL.replace(/\/+$/,'') : '';
      if (supa) {
        if (u.startsWith('/storage/v1/object/public/')) return supa + u;
        if (u.startsWith('storage/v1/object/public/')) return supa + '/' + u;
      }
      // Fallback to raw if we can't resolve
      return u;
    } catch(_) { return fallbackUnsplash(p); }
  }
  function safeTitle(p){ return (p && p.title) ? p.title : 'Untitled'; }
  function safeCategory(p){
    var raw = (p && p.subcategory) ? p.subcategory : (p && p.main_category ? p.main_category : '');
    return normalizeCategoryLabel(raw);
  }
  function slugifyTitle(t){
    try {
      return String(t || '')
        .replace(/['"]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        ;
    } catch(_) { return ''; }
  }
  function articleUrl(p){
    var title = safeTitle(p);
    var slug = slugifyTitle(title);
    return slug ? ('/' + slug) : '/';
  }

  function normalizeKey(s){
    try {
      return String(s || '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } catch(_) { return ''; }
  }

  function categoryAliases(label){
    var key = normalizeKey(label);
    if (key === 'culture lifestyle') {
      return ['Culture & Lifestyle','Culture and Lifestyle','Culture Lifestyle'];
    }
    if (key === 'tips strategies hub') {
      return ['Tips & Strategies Hub','Tips & Strategies','Strategies & Tips','Tips and Strategies'];
    }
    if (key === 'sports betting' || key === 'sports' || key === 'sports news') {
      return ['Sports Betting','Sports'];
    }
    return [label];
  }

  async function fetchByLabel(label, limit){
    var client = getClient();
    var aliases = categoryAliases(label);
    var n = limit || 6;
    if (!client) {
      var loc = await fetchLocalPosts(n);
      var aliasSet = {};
      aliases.forEach(function(a){ aliasSet[normalizeKey(a)] = true; });
      var filtered = loc.filter(function(p){
        var mk = normalizeKey(p && p.main_category);
        var sk = normalizeKey(p && p.subcategory);
        return !!aliasSet[mk] || !!aliasSet[sk];
      });
      filtered.sort(function(a,b){
        var at = new Date(a && (a.published_at || a.created_at) || 0).getTime();
        var bt = new Date(b && (b.published_at || b.created_at) || 0).getTime();
        return bt - at;
      });
      return filtered.slice(0, n);
    }
    var base = client
      .from('posts')
      .select('id, title, image_url, created_at, published_at, status, main_category, subcategory')
      .eq('status','published');
    var { data: byMain, error: errMain } = await base
      .in('main_category', aliases)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(n);
    if (errMain) { console.warn('[homepage] fetchByLabel(main) error:', errMain.message || errMain); }
    var base2 = client
      .from('posts')
      .select('id, title, image_url, created_at, published_at, status, main_category, subcategory')
      .eq('status','published');
    var { data: bySub, error: errSub } = await base2
      .in('subcategory', aliases)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(n);
    if (errSub) { console.warn('[homepage] fetchByLabel(sub) error:', errSub.message || errSub); }
    var combined = ([]).concat(Array.isArray(byMain)?byMain:[], Array.isArray(bySub)?bySub:[]);
    var seen = {};
    var dedup = combined.filter(function(p){ var id = p && p.id; if (!id) return true; if (seen[id]) return false; seen[id] = true; return true; });
    dedup.sort(function(a,b){
      var at = new Date(a && (a.published_at || a.created_at) || 0).getTime();
      var bt = new Date(b && (b.published_at || b.created_at) || 0).getTime();
      return bt - at;
    });
    if (!dedup.length) {
      var loc2 = await fetchLocalPosts(n);
      var aliasSet2 = {};
      aliases.forEach(function(a){ aliasSet2[normalizeKey(a)] = true; });
      var filtered2 = loc2.filter(function(p){
        var mk = normalizeKey(p && p.main_category);
        var sk = normalizeKey(p && p.subcategory);
        return !!aliasSet2[mk] || !!aliasSet2[sk];
      });
      filtered2.sort(function(a,b){
        var at = new Date(a && (a.published_at || a.created_at) || 0).getTime();
        var bt = new Date(b && (b.published_at || b.created_at) || 0).getTime();
        return bt - at;
      });
      return filtered2.slice(0, n);
    }
    return dedup.slice(0, n);
  }

  // Builders
  function buildLargeCard(p){
    var img = safeImage(p);
    var cat = safeCategory(p);
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    var title = safeTitle(p);
    return $(
      '<div class="card__post ">\n'
      + '  <div class="card__post__body card__post__transition">\n'
      + '    <a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">\n'
      + '      <img src="' + img + '" class="img-fluid" alt="">\n'
      + '    </a>\n'
      + '    <div class="card__post__content bg__post-cover">\n'
      + '      <div class="card__post__category">' + cat + '</div>\n'
      + '      <div class="card__post__title">\n'
      + '        <h5><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">' + title + '</a></h5>\n'
      + '      </div>\n'
      + '      <div class="card__post__author-info">\n'
      + '        <ul class="list-inline">\n'
      + '          <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
      + '          <li class="list-inline-item"><span>' + dateStr + '</span></li>\n'
      + '        </ul>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
  }

  function buildListItem(p, headingTag){
    var img = safeImage(p);
    var title = safeTitle(p);
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    var tag = headingTag || 'h6';
    return $(
      '<div class="card__post card__post-list">\n'
      + '  <div class="image-sm">\n'
      + '    <a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '"><img src="' + img + '" class="img-fluid" alt="" onerror="this.onerror=null;this.src=\'/images/gangalogo.png\';"></a>\n'
      + '  </div>\n'
      + '  <div class="card__post__body ">\n'
      + '    <div class="card__post__content">\n'
      + '      <div class="card__post__author-info mb-2">\n'
      + '        <ul class="list-inline">\n'
      + '          <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
      + '          <li class="list-inline-item"><span class="text-dark text-capitalize">' + dateStr + '</span></li>\n'
      + '        </ul>\n'
      + '      </div>\n'
      + '      <div class="card__post__title">\n'
      + '        <' + tag + '><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">' + title + '</a></' + tag + '>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
  }

  function buildArticleEntry(p){
    var img = safeImage(p);
    var title = safeTitle(p);
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    return $(
      '<div class="item">\n'
      + '  <div class="article__entry">\n'
      + '    <div class="article__image">\n'
      + '      <a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '"><img src="' + img + '" alt="" class="img-fluid" onerror="this.onerror=null;this.src=\'/images/gangalogo.png\';"></a>\n'
      + '    </div>\n'
      + '    <div class="article__content">\n'
      + '      <ul class="list-inline">\n'
      + '        <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
      + '        <li class="list-inline-item"><span>' + dateStr + '</span></li>\n'
      + '      </ul>\n'
      + '      <h5><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">' + title + '</a></h5>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
  }

  // Specialized builder for hero header large items
  function buildHeroItem(p){
    var img = safeImage(p);
    var cat = safeCategory(p);
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    var title = safeTitle(p);
    return $(
      '<div class="item">\n'
      + '  <div class="card__post">\n'
      + '    <div class="card__post__body">\n'
      + '      <a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '"><img src="' + img + '" class="img-fluid" alt="" onerror="this.onerror=null;this.src=\'/images/gangalogo.png\';"></a>\n'
      + '      <div class="card__post__content bg__post-cover">\n'
      + '        <div class="card__post__category">' + cat + '</div>\n'
      + '        <div class="card__post__title"><h2><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">' + title + '</a></h2></div>\n'
      + '        <div class="card__post__author-info">\n'
      + '          <ul class="list-inline">\n'
      + '            <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
      + '            <li class="list-inline-item"><span>' + dateStr + '</span></li>\n'
      + '          </ul>\n'
      + '        </div>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
  }

  // Fetch helpers
  async function fetchLocalPosts(limit){
    try {
      var url = (window.LOCAL_API_URL || 'http://localhost:3001') + '/api/posts?limit=' + encodeURIComponent(limit || 6);
      var res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (!res.ok) return [];
      var rows = await res.json();
      return Array.isArray(rows) ? rows.map(function(r){
        return {
          id: r.id,
          title: r.title,
          image_url: r.image_url,
          created_at: r.created_at,
          published_at: r.created_at,
          status: r.status || 'published',
          main_category: r.category || '',
          subcategory: r.category || '',
          views: r.views || 0
        };
      }) : [];
    } catch(_) { return []; }
  }
  async function fetchLatest(limit){
    var client = getClient();
    if (!client) { return []; }
    var { data, error } = await client
      .from('posts')
      .select('id, title, image_url, created_at, published_at, status, main_category, subcategory')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit || 6);
    if (error) { console.warn('[homepage] fetchLatest error:', error.message || error); return []; }
    var arr = Array.isArray(data) ? data : [];
    return arr;
  }

  async function fetchByMain(main, limit){
    var client = getClient();
    if (!client) { return []; }
    var { data, error } = await client
      .from('posts')
      .select('id, title, image_url, created_at, published_at, status, main_category, subcategory')
      .eq('status', 'published')
      .in('main_category', categoryAliases(main))
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit || 6);
    if (error) {
      console.warn('[homepage] fetchByMain error:', error.message || error);
      return [];
    }
    var arr = Array.isArray(data) ? data : [];
    return arr;
  }

  async function fetchPopular(limit){
    var client = getClient();
    if (!client) { return []; }
    var { data, error } = await client
      .from('posts')
      .select('id, title, image_url, created_at, published_at, status, main_category, subcategory, views')
      .eq('status', 'published')
      .order('views', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit || 6);
    if (error) { console.warn('[homepage] fetchPopular error:', error.message || error); return []; }
    var arr = Array.isArray(data) ? data : [];
    return arr;
  }

  // Wire hero header: .popular__news-header .card__post-carousel
  async function renderHeroHeader(){
    try {
      var $car = $('.popular__news-header .card__post-carousel');
      if (!$car || !$car.length) { console.warn('[homepage] Hero container not found.'); return; }
      // Cache-first
      var cached = readCache('home:hero-header', 3600);
      if (Array.isArray(cached) && cached.length){
        try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
        $car.empty();
        cached.forEach(function(p){ $car.append(buildHeroItem(p)); });
        try {
          $car.slick({
            slidesToShow: 1,
            autoplay: true,
            dots: false,
            lazyLoad: 'progressive',
            prevArrow: "<button type='button' class='slick-prev pull-left'><i class='fa fa-angle-left' aria-hidden='true'></i></button>",
            nextArrow: "<button type='button' class='slick-next pull-right'><i class='fa fa-angle-right' aria-hidden='true'></i></button>"
          });
        } catch(_){}
      }
      // Do not clear placeholders until fresh data arrives
      var client = getClient();
      var posts = await fetchLatest(4);
      // Always clear placeholders when no data
      if (!posts || posts.length === 0){
        console.log('[homepage] renderHeroHeader: no posts.');
        return;
      }
      // Clear and rebuild only after data is ready
      try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
      $car.empty();
      console.log('[homepage] renderHeroHeader: container cleared after fetch.');
      // Rebuild items
      console.log('[homepage] renderHeroHeader: rendering', posts.length, 'items');
      posts.forEach(function(p){ $car.append(buildHeroItem(p)); });
      // Re-init slick with same settings
      try {
        $car.slick({
          slidesToShow: 1,
          autoplay: true,
          dots: false,
          lazyLoad: 'progressive',
          prevArrow: "<button type='button' class='slick-prev pull-left'><i class='fa fa-angle-left' aria-hidden='true'></i></button>",
          nextArrow: "<button type='button' class='slick-next pull-right'><i class='fa fa-angle-right' aria-hidden='true'></i></button>"
        });
        console.log('[homepage] renderHeroHeader: slick initialized');
      } catch(_){ console.warn('[homepage] renderHeroHeader: slick init failed'); }
      try { writeCache('home:hero-header', posts); } catch(_){}
    } catch(e){ console.warn('renderHeroHeader error:', e); }
  }

  // Wire popular news header carousel: .popular__news-header-carousel .top__news__slider
  async function renderPopularNewsHeaderCarousel(){
    try {
      var $car = $('#dropdownNewsSlider');
      if (!$car || !$car.length) { console.warn('[homepage] Popular header carousel container not found.'); return; }
      // Cache-first
      var cached = readCache('home:popular-header', 3600);
      if (Array.isArray(cached) && cached.length) {
        try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
        $car.empty();
        cached.forEach(function(p){ $car.append(buildArticleEntry(p)); });
        try {
          $car.slick({
            slidesToShow: 4,
            slidesToScroll: 4,
            autoplay: true,
            dots: false,
            lazyLoad: 'progressive',
            prevArrow: false,
            nextArrow: false,
            responsive: [
              { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
              { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
              { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
            ]
          });
        } catch(_){}
      }
      // Do not clear until we have fresh data
      var posts = await fetchPopular(8);
      if (!posts || posts.length === 0){
        console.log('[homepage] renderPopularNewsHeaderCarousel: no posts');
        return;
      }
      // Clear and rebuild only after data arrives
      try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
      $car.empty();
      console.log('[homepage] renderPopularNewsHeaderCarousel: container cleared after fetch');
      console.log('[homepage] renderPopularNewsHeaderCarousel: rendering', posts.length, 'items');
      posts.forEach(function(p){ $car.append(buildArticleEntry(p)); });
      try {
        $car.slick({
          slidesToShow: 4,
          slidesToScroll: 4,
          autoplay: true,
          dots: false,
          lazyLoad: 'progressive',
          prevArrow: false,
          nextArrow: false,
          responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
            { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
            { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
          ]
        });
        console.log('[homepage] renderPopularNewsHeaderCarousel: slick initialized');
      } catch(_){ console.warn('[homepage] renderPopularNewsHeaderCarousel: slick init failed'); }
      try { writeCache('home:popular-header', posts); } catch(_){}
    } catch(e){ console.warn('renderPopularNewsHeaderCarousel error:', e); }
  }

  // Wire trending strip at top: .wrapp__list__article-responsive-carousel
  async function renderTrendingStrip(){
    try {
      var $car = $('.wrapp__list__article-responsive-carousel');
      if (!$car || !$car.length) { console.warn('[homepage] Trending strip container not found.'); return; }
      // Cache-first: render cached items immediately if available
      var cached = readCache('home:trending', 3600);
      if (Array.isArray(cached) && cached.length) {
        try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
        $car.empty();
        cached.forEach(function(p){
          var $item = $('<div class="item"></div>');
          $item.append(buildListItem(p, 'h6'));
          $car.append($item);
        });
        try {
          $car.slick({
            slidesToShow: 3,
            slidesToScroll: 3,
            autoplay: true,
            dots: false,
            lazyLoad: 'progressive',
            prevArrow: false,
            nextArrow: false,
            responsive: [
              { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
              { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
              { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
            ]
          });
        } catch(_){}
      }
      var posts = await fetchLatest(9);
      if (!posts || posts.length === 0){
        console.log('[homepage] renderTrendingStrip: no posts');
        return;
      }
      // Clear and replace with fresh content only after data arrives
      try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
      $car.empty();
      console.log('[homepage] renderTrendingStrip: container cleared');
      console.log('[homepage] renderTrendingStrip: rendering', posts.length, 'items');
      posts.forEach(function(p){
        var $item = $('<div class="item"></div>');
        $item.append(buildListItem(p, 'h6'));
        $car.append($item);
      });
      try {
        $car.slick({
          slidesToShow: 3,
          slidesToScroll: 3,
          autoplay: true,
          dots: false,
          lazyLoad: 'progressive',
          prevArrow: false,
          nextArrow: false,
          responsive: [
            { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
            { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
            { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
          ]
        });
        console.log('[homepage] renderTrendingStrip: slick initialized');
      } catch(_){ console.warn('[homepage] renderTrendingStrip: slick init failed'); }
      // Update cache for next load
      try { writeCache('home:trending', posts); } catch(_){}
    } catch(e){ console.warn('renderTrendingStrip error:', e); }
  }

  // Renderers
  async function renderLatestGaming(){
    try {
      var $grid = $('#latestGamingGrid');
      // Cache-first paint
      var cached = readCache('home:latest-gaming', 3600);
      if (Array.isArray(cached) && cached.length) {
        if ($grid && $grid.length){ $grid.empty(); }
        var p0c = cached[0];
        if (p0c){
          var $topRowC = $('<div class="row"></div>');
          var $topColC = $('<div class="col-12 mb-4"></div>');
          $topColC.append(buildLargeCard(p0c));
          $topRowC.append($topColC);
          $grid.append($topRowC.children());
        }
        var smallC = cached.slice(1,3);
        if (smallC.length){
          var $smallRowC = $('<div class="row"></div>');
          smallC.forEach(function(p){
            var $colC = $('<div class="col-sm-12 col-md-6 mb-3"></div>');
            $colC.append(buildListItem(p, 'h6'));
            $smallRowC.append($colC);
          });
          $grid.append($smallRowC.children());
        }
        var leftC, rightC;
        if ($grid && $grid.length){
          leftC = cached.slice(3,5);
          rightC = cached.slice(5,6);
        } else {
          var totalC = Math.min(cached.length, 6);
          var splitC = Math.ceil(totalC / 2);
          leftC = cached.slice(0, splitC);
          rightC = cached.slice(splitC, totalC);
        }
        var $leftC = $('#latestGamingListLeft');
        if ($leftC && $leftC.length){ $leftC.empty(); }
        if ($leftC && $leftC.length && leftC.length){
          leftC.forEach(function(p){ var $wrap = $('<div class="mb-3"></div>'); $wrap.append(buildListItem(p, 'h6')); $leftC.append($wrap); });
        }
        var $rightC = $('#latestGamingListRight');
        if ($rightC && $rightC.length){ $rightC.empty(); }
        if ($rightC && $rightC.length && rightC.length){
          rightC.forEach(function(p){ var $wrap = $('<div class="mb-3"></div>'); $wrap.append(buildListItem(p, 'h6')); $rightC.append($wrap); });
        }
      }
      var posts = await fetchLatest(6);
      if (!posts || posts.length === 0) { return; }
      if ($grid && $grid.length){ $grid.empty(); }
      // If the top grid exists, reserve the first two posts for it.
      // If the grid was removed from HTML, start lists from the first available post.
      var left, right;
      if ($grid && $grid.length){
        // One big card on top
        var p0 = posts[0];
        if (p0){
          var $topRow = $('<div class="row"></div>');
          var $topCol = $('<div class="col-12 mb-4"></div>');
          $topCol.append(buildLargeCard(p0));
          $topRow.append($topCol);
          $grid.append($topRow.children());
        }
        // Two small items below
        var small = posts.slice(1,3);
        if (small.length){
          var $smallRow = $('<div class="row"></div>');
          small.forEach(function(p){
            var $col = $('<div class="col-sm-12 col-md-6 mb-3"></div>');
            $col.append(buildListItem(p, 'h6'));
            $smallRow.append($col);
          });
          $grid.append($smallRow.children());
        }
        // Remaining posts go to left/right lists
        left = posts.slice(3,5);
        right = posts.slice(5,6);
      } else {
        var total = Math.min(posts.length, 6);
        var split = Math.ceil(total / 2);
        left = posts.slice(0, split);
        right = posts.slice(split, total);
      }
      var $left = $('#latestGamingListLeft');
      if ($left && $left.length){ $left.empty(); }
      if ($left && $left.length && left.length){
        left.forEach(function(p){
          var $wrap = $('<div class="mb-3"></div>');
          $wrap.append(buildListItem(p, 'h6'));
          $left.append($wrap);
        });
      }
      var $right = $('#latestGamingListRight');
      if ($right && $right.length){ $right.empty(); }
      if ($right && $right.length && right.length){
        right.forEach(function(p){
          var $wrap = $('<div class="mb-3"></div>');
          $wrap.append(buildListItem(p, 'h6'));
          $right.append($wrap);
        });
      }
      try { writeCache('home:latest-gaming', posts); } catch(_){}
    } catch(e){ console.warn('renderLatestGaming error:', e); }
  }

  async function renderSportsCarousel(){
    try {
      var $car = $('#sportsCarousel');
      // Cache-first
      var cached = readCache('home:sports-carousel', 3600);
      if (Array.isArray(cached) && cached.length && $car && $car.length){
        try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
        $car.empty();
        cached.forEach(function(p){ $car.append(buildArticleEntry(p)); });
        try {
          $car.slick({
            slidesToShow: 3,
            slidesToScroll: 3,
            autoplay: true,
            dots: false,
            lazyLoad: 'progressive',
            prevArrow: false,
            nextArrow: false,
            responsive: [
              { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
              { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
              { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
            ]
          });
        } catch(_){ }
      }
      var posts = await fetchByLabel('Sports', 6);
      if ($car && $car.length && posts && posts.length){
        try { if ($car.hasClass('slick-initialized')) { $car.slick('unslick'); } } catch(_){ }
        $car.empty();
        posts.forEach(function(p){ $car.append(buildArticleEntry(p)); });
        try {
          $car.slick({
            slidesToShow: 3,
            slidesToScroll: 3,
            autoplay: true,
            dots: false,
            lazyLoad: 'progressive',
            prevArrow: false,
            nextArrow: false,
            responsive: [
              { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
              { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
              { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
            ]
          });
        } catch(_){ console.warn('[homepage] renderSportsCarousel: slick init failed'); }
        try { writeCache('home:sports-carousel', posts); } catch(_){}
      } else {
        console.log('[homepage] renderSportsCarousel: no fresh posts, keeping cached');
      }
    } catch(e){ console.warn('renderSportsCarousel error:', e); }
  }

  async function renderPopularPosts(){
    try {
      var $list = $('#popularPostsList');
      // Cache-first
      var cached = readCache('home:popular-list', 3600);
      if (Array.isArray(cached) && cached.length && $list && $list.length){
        $list.empty();
        cached.forEach(function(p, idx){
          var $item = $('<div class="card__post__list"></div>');
          var $num = $('<div class="list-number"><span>' + (idx+1) + '</span></div>');
          var $cat = $('<a href="#" class="category"></a>').text(safeCategory(p));
          var $ul = $('<ul class="list-inline"></ul>');
          var $li = $('<li class="list-inline-item"></li>');
          var $h5 = $('<h5></h5>').append($('<a></a>').attr('href', articleUrl(p)).attr('data-article-id', (p && p.id ? p.id : '')).attr('data-article-slug', slugifyTitle(safeTitle(p))).text(safeTitle(p)));
          $li.append($h5);
          $ul.append($li);
          $item.append($num).append($cat).append($ul);
          $list.append($item);
        });
      }
      var posts = await fetchPopular(6);
      if ($list && $list.length && posts && posts.length){
        $list.empty();
        posts.forEach(function(p, idx){
          var $item = $('<div class="card__post__list"></div>');
          var $num = $('<div class="list-number"><span>' + (idx+1) + '</span></div>');
          var $cat = $('<a href="#" class="category"></a>').text(safeCategory(p));
          var $ul = $('<ul class="list-inline"></ul>');
          var $li = $('<li class="list-inline-item"></li>');
          var $h5 = $('<h5></h5>').append($('<a></a>').attr('href', articleUrl(p)).attr('data-article-id', (p && p.id ? p.id : '')).attr('data-article-slug', slugifyTitle(safeTitle(p))).text(safeTitle(p)));
          $li.append($h5);
          $ul.append($li);
          $item.append($num).append($cat).append($ul);
          $list.append($item);
        });
        try { writeCache('home:popular-list', posts); } catch(_){}
      } else {
        console.log('[homepage] renderPopularPosts: no fresh posts, keeping cached');
      }
    } catch(e){ console.warn('renderPopularPosts error:', e); }
  }

  // Populate hero header right column with real posts
  async function renderHeroRightColumn(){
    try {
      var $right = $('.popular__news-right');
      if (!$right || !$right.length) { return; }
      // Cache-first
      var cached = readCache('home:hero-right', 3600);
      if (Array.isArray(cached) && cached.length){
        $right.empty();
        cached.forEach(function(p){ $right.append(buildLargeCard(p)); });
      }
      // Prefer category-specific highlights: Tennis Betting and Blackjack
      var tennis = await fetchByLabel('Tennis Betting', 1);
      var blackjack = await fetchByLabel('Blackjack', 1);
      var posts = ([]).concat(Array.isArray(tennis)?tennis:[], Array.isArray(blackjack)?blackjack:[]);
      if (!posts.length) {
        posts = await fetchLatest(2);
      }
      $right.empty();
      posts.forEach(function(p){
        $right.append(buildLargeCard(p));
      });
      try { writeCache('home:hero-right', posts); } catch(_){}
    } catch(e){ console.warn('renderHeroRightColumn error:', e); }
  }

  async function renderCultureLifestyle(){
    try {
      var $grid = $('#cultureLifestyleGrid');
      // Cache-first
      var cached = readCache('home:culture-lifestyle', 3600);
      if (Array.isArray(cached) && cached.length && $grid && $grid.length){
        $grid.empty();
        cached.forEach(function(p){
          var $col = $('<div class="col-md-6"><div class="mb-4"></div></div>');
          var $entry = $(
            '<div class="article__entry">\n'
          + '  <div class="article__image"><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p)) + '"><img src="' + safeImage(p) + '" alt="" class="img-fluid"></a></div>\n'
            + '  <div class="article__content">\n'
            + '    <ul class="list-inline">\n'
            + '      <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
            + '      <li class="list-inline-item"><span>' + fmtDate(p && (p.published_at || p.created_at)) + '</span></li>\n'
            + '    </ul>\n'
          + '    <h5><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p)) + '">' + safeTitle(p) + '</a></h5>\n'
            + '  </div>\n'
            + '</div>'
          );
          $col.children().append($entry);
          $grid.append($col);
        });
      }
      var posts = await fetchByLabel('Culture & Lifestyle', 6);
      if ($grid && $grid.length){ $grid.empty(); }
      if ($grid && $grid.length && posts && posts.length){
        posts.forEach(function(p){
          var $col = $('<div class="col-md-6"><div class="mb-4"></div></div>');
          var $entry = $(
            '<div class="article__entry">\n'
          + '  <div class="article__image"><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p)) + '"><img src="' + safeImage(p) + '" alt="" class="img-fluid"></a></div>\n'
            + '  <div class="article__content">\n'
            + '    <ul class="list-inline">\n'
            + '      <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
            + '      <li class="list-inline-item"><span>' + fmtDate(p && (p.published_at || p.created_at)) + '</span></li>\n'
            + '    </ul>\n'
          + '    <h5><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p)) + '">' + safeTitle(p) + '</a></h5>\n'
            + '  </div>\n'
            + '</div>'
          );
          $col.children().append($entry);
          $grid.append($col);
        });
        try { writeCache('home:culture-lifestyle', posts); } catch(_){}
      }
    } catch(e){ console.warn('renderCultureLifestyle error:', e); }
  }

  async function renderTipsStrategies(){
    try {
      var $list = $('#tipsStrategiesList');
      // Ensure a pager container exists after the list for page switching
      var $pagerArea = $('#tipsStrategiesPager');
      if (!$pagerArea.length){
        $pagerArea = $('<div id="tipsStrategiesPager" class="pagination-area"><div class="pagination"></div></div>');
        if ($list && $list.length) { $list.after($pagerArea); }
      }
      var $pager = $pagerArea.find('.pagination');

      var PER_PAGE = 4;
      var paint = function(posts, page){
        if (!$list || !$list.length) return;
        var start = (page - 1) * PER_PAGE;
        var slice = posts.slice(start, start + PER_PAGE);
        $list.empty();
        slice.forEach(function(p){
          var $wrap = $('<div class="card__post card__post-list card__post__transition mt-30"></div>');
          var $row = $('<div class="row "></div>');
          var $imgCol = $('<div class="col-md-5"><div class="card__post__transition"></div></div>');
          $imgCol.find('.card__post__transition').append($('<a></a>').attr('href', articleUrl(p)).attr('data-article-id', (p && p.id ? p.id : '')).attr('data-article-slug', slugifyTitle(safeTitle(p))).append($('<img>').attr('src', safeImage(p)).addClass('img-fluid w-100').attr('alt','')));
          var $contentCol = $('<div class="col-md-7 my-auto pl-0"><div class="card__post__body "><div class="card__post__content"></div></div></div>');
          var $content = $contentCol.find('.card__post__content');
          $content.append($('<div class="card__post__category"></div>').text(safeCategory(p)));
          var $ul = $('<div class="card__post__author-info mb-2"><ul class="list-inline"></ul></div>');
          $ul.find('ul').append('<li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>');
          $ul.find('ul').append('<li class="list-inline-item"><span class="text-dark text-capitalize">' + fmtDate(p && (p.published_at || p.created_at)) + '</span></li>');
          $content.append($ul);
          $content.append($('<div class="card__post__title"><h5><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p)) + '">' + safeTitle(p) + '</a></h5></div>'));
          $row.append($imgCol).append($contentCol);
          $wrap.append($row);
          $list.append($wrap);
        });
      };
      var initPager = function(posts){
        if (!$pager || !$pager.length) return;
        var total = Math.max(1, Math.ceil(posts.length / PER_PAGE));
        $pager.empty();
        $pager.append('<a href="#">«</a>');
        for (var i=1;i<=total;i++){ $pager.append('<a href="#" data-page="'+i+'">'+i+'</a>'); }
        $pager.append('<a href="#">»</a>');
        var current = parseInt(localStorage.getItem('home:tips:page') || '1',10);
        if (!(current>=1 && current<=total)) current = 1;
        $pager.find('a[data-page]').each(function(){ var p=parseInt($(this).attr('data-page')||'0',10); $(this).toggleClass('active', p===current); });
        paint(posts, current);
        $pager.off('click').on('click', 'a', function(e){
          e.preventDefault();
          var txt = ($(this).text()||'').trim();
          if (txt==='«'){ current = Math.max(1, current-1); }
          else if (txt==='»'){ var total2 = Math.max(1, Math.ceil(posts.length / PER_PAGE)); current = Math.min(total2, current+1); }
          else { var sel = parseInt($(this).attr('data-page')||txt,10); if (sel>=1) current = sel; }
          localStorage.setItem('home:tips:page', String(current));
          $pager.find('a[data-page]').each(function(){ var p=parseInt($(this).attr('data-page')||'0',10); $(this).toggleClass('active', p===current); });
          paint(posts, current);
        });
      };
      // Cache-first
      var cached = readCache('home:tips-strategies', 3600);
      if (Array.isArray(cached) && cached.length && $list && $list.length){
        initPager(cached);
      }
      var posts = await fetchByLabel('Tips & Strategies Hub', 48);
      if ($list && $list.length && posts && posts.length){
        initPager(posts);
        try { writeCache('home:tips-strategies', posts); } catch(_){}
      } else {
        console.log('[homepage] renderTipsStrategies: no fresh posts, keeping cached');
      }
    } catch(e){ console.warn('renderTipsStrategies error:', e); }
  }

  async function renderLatestSidebar(){
    try {
      var $side = $('#latestPostsSmallList');
      // Cache-first
      if ($side && $side.length){
        var cached = readCache('home:latest-sidebar', 3600);
        if (Array.isArray(cached) && cached.length) {
          $side.empty();
          // First as big article entry
          var p0c = cached[0];
          var $bigC = $(
            '<div class="article__entry">\n'
            + '  <div class="article__image"><a href="' + articleUrl(p0c) + '" data-article-id="' + (p0c && p0c.id ? p0c.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0c)) + '"><img src="' + safeImage(p0c) + '" alt="" class="img-fluid"></a></div>\n'
            + '  <div class="article__content">\n'
            + '    <div class="article__category">' + safeCategory(p0c) + '</div>\n'
            + '    <ul class="list-inline">\n'
            + '      <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
            + '      <li class="list-inline-item"><span class="text-dark text-capitalize">' + fmtDate(p0c && (p0c.published_at || p0c.created_at)) + '</span></li>\n'
            + '    </ul>\n'
            + '    <h5><a href="' + articleUrl(p0c) + '" data-article-id="' + (p0c && p0c.id ? p0c.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0c)) + '">' + safeTitle(p0c) + '</a></h5>\n'
            + '    <p></p>\n'
            + '    <a href="' + articleUrl(p0c) + '" data-article-id="' + (p0c && p0c.id ? p0c.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0c)) + '" class="btn btn-outline-primary mb-4 text-capitalize"> read more</a>\n'
            + '  </div>\n'
            + '</div>'
          );
          $side.append($bigC);
          cached.slice(1).forEach(function(p){ var $mb = $('<div class="mb-3"></div>'); $mb.append(buildListItem(p, 'h6')); $side.append($mb); });
        }
      }
      var posts = await fetchLatest(4);
      if ($side && $side.length && posts && posts.length){
        $side.empty();
        // First as big article entry
        var p0 = posts[0];
        var $big = $(
          '<div class="article__entry">\n'
          + '  <div class="article__image"><a href="' + articleUrl(p0) + '" data-article-id="' + (p0 && p0.id ? p0.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0)) + '"><img src="' + safeImage(p0) + '" alt="" class="img-fluid"></a></div>\n'
          + '  <div class="article__content">\n'
          + '    <div class="article__category">' + safeCategory(p0) + '</div>\n'
          + '    <ul class="list-inline">\n'
          + '      <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
          + '      <li class="list-inline-item"><span class="text-dark text-capitalize">' + fmtDate(p0 && (p0.published_at || p0.created_at)) + '</span></li>\n'
          + '    </ul>\n'
          + '    <h5><a href="' + articleUrl(p0) + '" data-article-id="' + (p0 && p0.id ? p0.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0)) + '">' + safeTitle(p0) + '</a></h5>\n'
          + '    <p></p>\n'
          + '    <a href="' + articleUrl(p0) + '" data-article-id="' + (p0 && p0.id ? p0.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0)) + '" class="btn btn-outline-primary mb-4 text-capitalize"> read more</a>\n'
          + '  </div>\n'
          + '</div>'
        );
        $side.append($big);
        // Next as small list items
        posts.slice(1).forEach(function(p){
          var $mb = $('<div class="mb-3"></div>');
          $mb.append(buildListItem(p, 'h6'));
          $side.append($mb);
        });
        try { writeCache('home:latest-sidebar', posts); } catch(_){}
      } else {
        console.log('[homepage] renderLatestSidebar: no fresh posts, keeping cached');
      }
    } catch(e){ console.warn('renderLatestSidebar error:', e); }
  }

  // Immediately render all cached content before any fetch operations
  function renderAllCachedContent() {
    console.log('[homepage] Rendering all cached content immediately');
    try {
      // Hero header (slider)
      var heroCache = readCache('home:hero-header', 3600);
      if (Array.isArray(heroCache) && heroCache.length) {
        var $hero = $('.popular__news-header .card__post-carousel');
        if ($hero && $hero.length) {
          try { if ($hero.hasClass('slick-initialized')) { $hero.slick('unslick'); } } catch(_){ }
          $hero.empty();
          heroCache.forEach(function(p){ $hero.append(buildHeroItem(p)); });
          try {
            $hero.slick({
              slidesToShow: 1,
              autoplay: true,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: "<button type='button' class='slick-prev pull-left'><i class='fa fa-angle-left' aria-hidden='true'></i></button>",
              nextArrow: "<button type='button' class='slick-next pull-right'><i class='fa fa-angle-right' aria-hidden='true'></i></button>"
            });
          } catch(_){}
        }
      }
      
      // Hero right column
      var heroRightCache = readCache('home:hero-right', 3600);
      if (Array.isArray(heroRightCache) && heroRightCache.length) {
        var $rightCol = $('.popular__news-right');
        if ($rightCol && $rightCol.length) {
          $rightCol.empty();
          heroRightCache.slice(0, 3).forEach(function(p){ $rightCol.append(buildLargeCard(p)); });
        }
      }
      
      // Popular news header carousel
      var popularCache = readCache('home:popular-header', 3600);
      if (Array.isArray(popularCache) && popularCache.length) {
        var $popular = $('#dropdownNewsSlider');
        if ($popular && $popular.length) {
          try { if ($popular.hasClass('slick-initialized')) { $popular.slick('unslick'); } } catch(_){ }
          $popular.empty();
          popularCache.forEach(function(p){ $popular.append(buildArticleEntry(p)); });
          try {
            $popular.slick({
              slidesToShow: 4,
              slidesToScroll: 4,
              autoplay: true,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: false,
              nextArrow: false,
              responsive: [
                { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
                { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
                { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
              ]
            });
          } catch(_){}
        }
      }
      
      // Trending strip
      var trendingCache = readCache('home:trending', 3600);
      if (Array.isArray(trendingCache) && trendingCache.length) {
        var $trending = $('.wrapp__list__article-responsive-carousel');
        if ($trending && $trending.length) {
          try { if ($trending.hasClass('slick-initialized')) { $trending.slick('unslick'); } } catch(_){ }
          $trending.empty();
          trendingCache.forEach(function(p){
            var $item = $('<div class="item"></div>');
            $item.append(buildListItem(p, 'h6'));
            $trending.append($item);
          });
          try {
            $trending.slick({
              slidesToShow: 3,
              slidesToScroll: 3,
              autoplay: true,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: false,
              nextArrow: false,
              responsive: [
                { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
                { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
                { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
              ]
            });
          } catch(_){}
        }
      }
      
      // Sports carousel
      var sportsCache = readCache('home:sports-carousel', 3600);
      if (Array.isArray(sportsCache) && sportsCache.length) {
        var $sports = $('#sportsCarousel');
        if ($sports && $sports.length) {
          try { if ($sports.hasClass('slick-initialized')) { $sports.slick('unslick'); } } catch(_){ }
          $sports.empty();
          sportsCache.forEach(function(p){ $sports.append(buildArticleEntry(p)); });
          try {
            $sports.slick({
              slidesToShow: 3,
              slidesToScroll: 3,
              autoplay: true,
              dots: false,
              lazyLoad: 'progressive',
              prevArrow: false,
              nextArrow: false,
              responsive: [
                { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3, infinite: true } },
                { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
                { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
              ]
            });
          } catch(_){}
        }
      }
      
      // Latest gaming grid
      var latestGamingCache = readCache('home:latest-gaming', 3600);
      if (Array.isArray(latestGamingCache) && latestGamingCache.length) {
        var $grid = $('#latestGamingGrid');
        if ($grid && $grid.length) {
          $grid.empty();
          var $row = $('<div class="row"></div>');
          $grid.append($row);
          
          // First item as large card
          if (latestGamingCache.length > 0) {
            var $col1 = $('<div class="col-md-6"></div>');
            $col1.append(buildLargeCard(latestGamingCache[0]));
            $row.append($col1);
            
            // Remaining items as list
            var $col2 = $('<div class="col-md-6"></div>');
            $row.append($col2);
            latestGamingCache.slice(1, 5).forEach(function(p){ $col2.append(buildListItem(p)); });
          }
        }
      }
      
      // Popular posts
      var popularPostsCache = readCache('home:popular-list', 3600);
      if (Array.isArray(popularPostsCache) && popularPostsCache.length) {
        var $popular = $('#popularPostsList');
        if ($popular && $popular.length) {
          $popular.empty();
          popularPostsCache.forEach(function(p){ $popular.append(buildListItem(p)); });
        }
      }
      
      // Culture & Lifestyle
      var cultureCache = readCache('home:culture-lifestyle', 3600);
      if (Array.isArray(cultureCache) && cultureCache.length) {
        var $culture = $('#cultureLifestyleGrid');
        if ($culture && $culture.length) {
          $culture.empty();
          var $row = $('<div class="row"></div>');
          $culture.append($row);
          
          cultureCache.slice(0, 3).forEach(function(p){
            var $col = $('<div class="col-lg-4"></div>');
            $col.append(buildArticleEntry(p));
            $row.append($col);
          });
        }
      }
      
      // Tips & Strategies
      var tipsCache = readCache('home:tips-strategies', 3600);
      if (Array.isArray(tipsCache) && tipsCache.length) {
        var $tips = $('#tipsStrategiesList');
        if ($tips && $tips.length) {
          $tips.empty();
          tipsCache.slice(0, 6).forEach(function(p){
            $tips.append(buildListItem(p, 'h6'));
          });
        }
      }
      
      // Latest sidebar
      var sidebarCache = readCache('home:latest-sidebar', 3600);
      if (Array.isArray(sidebarCache) && sidebarCache.length) {
        var $side = $('#latestPostsSmallList');
        if ($side && $side.length) {
          $side.empty();
          // First as big article entry
          var p0c = sidebarCache[0];
          var $bigC = $(
            '<div class="article__entry">\n'
            + '  <div class="article__image"><a href="' + articleUrl(p0c) + '" data-article-id="' + (p0c && p0c.id ? p0c.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0c)) + '"><img src="' + safeImage(p0c) + '" alt="" class="img-fluid"></a></div>\n'
            + '  <div class="article__content">\n'
            + '    <div class="article__category">' + safeCategory(p0c) + '</div>\n'
            + '    <ul class="list-inline">\n'
            + '      <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
            + '      <li class="list-inline-item"><span class="text-dark text-capitalize">' + fmtDate(p0c && (p0c.published_at || p0c.created_at)) + '</span></li>\n'
            + '    </ul>\n'
            + '    <h5><a href="' + articleUrl(p0c) + '" data-article-id="' + (p0c && p0c.id ? p0c.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0c)) + '">' + safeTitle(p0c) + '</a></h5>\n'
            + '    <p></p>\n'
            + '    <a href="' + articleUrl(p0c) + '" data-article-id="' + (p0c && p0c.id ? p0c.id : '') + '" data-article-slug="' + slugifyTitle(safeTitle(p0c)) + '" class="btn btn-outline-primary mb-4 text-capitalize"> read more</a>\n'
            + '  </div>\n'
            + '</div>'
          );
          $side.append($bigC);
          sidebarCache.slice(1).forEach(function(p){ var $mb = $('<div class="mb-3"></div>'); $mb.append(buildListItem(p, 'h6')); $side.append($mb); });
        }
      }
      
      // Apply category colors to all rendered content
      applyCategoryColors();
      
    } catch(e) {
      console.warn('[homepage] Error rendering cached content:', e);
    }
  }

window.initHomepage = async function(){
    try {
      if (window.__homepage_initialized) { console.log('[homepage] already initialized'); return; }
      window.__homepage_initialized = true;
      console.log('[homepage] initHomepage start');
      // Purge any old placeholder HTML caches so images come from DB
      purgePlaceholderCaches();
      
      // STEP 1: Immediately render cached content if available
      renderAllCachedContent();
      renderCachedContent();
      
      // STEP 2: Apply category colors immediately
      applyCategoryColors();
      
      // STEP 3: Show loading indicators for sections without cached content
      showLoadingIndicators();
      
      // STEP 4: Fetch fresh data in parallel
      var tasks = [
        renderHeroHeader(),
        renderHeroRightColumn(),
        renderPopularNewsHeaderCarousel(),
        renderTrendingStrip(),
        renderSportsCarousel(),
        renderLatestGaming(),
        renderPopularPosts(),
        renderCultureLifestyle(),
        renderTipsStrategies(),
        renderLatestSidebar()
      ];
      
      // STEP 5: After all content is loaded, cache the rendered HTML
      await Promise.allSettled(tasks);
      cacheRenderedHTML();
      
      // Function to show loading indicators
      function showLoadingIndicators() {
        // Add placeholder content to main sections without cached content
        if (!readCache('home:hero-header', 3600) && !readCache('home:hero-header-html', 3600)) {
          $('.popular__news-header .card__post-carousel').not(':has(.item)').html('<div class="loading-placeholder">Loading featured posts...</div>');
        }
        if (!readCache('home:hero-right', 3600) && !readCache('home:hero-right-html', 3600)) {
          $('.popular__news-right').not(':has(.card__post)').html('<div class="loading-placeholder">Loading highlights...</div>');
        }
        if (!readCache('home:popular-header', 3600) && !readCache('home:popular-header-html', 3600)) {
          $('#dropdownNewsSlider').not(':has(.item)').html('<div class="loading-placeholder">Loading top news...</div>');
        }
        if (!readCache('home:trending', 3600) && !readCache('home:trending-html', 3600)) {
          $('.wrapp__list__article-responsive-carousel').not(':has(.item)').html('<div class="loading-placeholder">Loading trending...</div>');
        }
        if (!readCache('home:latest-gaming', 3600) && !readCache('home:latest-gaming-html', 3600)) {
          $('#latestGamingGrid').not(':has(.row)').html('<div class="loading-placeholder">Loading news...</div>');
        }
        if (!readCache('home:sports-carousel', 3600) && !readCache('home:sports-html', 3600)) {
          $('#sportsCarousel').not(':has(.item)').html('<div class="loading-placeholder">Loading sports...</div>');
        }
        if (!readCache('home:popular-list', 3600) && !readCache('home:popular-posts-html', 3600)) {
          $('#popularPostsList').not(':has(.card__post__list)').html('<div class="loading-placeholder">Loading popular posts...</div>');
        }
        if (!readCache('home:culture-lifestyle', 3600) && !readCache('home:culture-lifestyle-html', 3600)) {
          $('#cultureLifestyleGrid').not(':has(.row)').html('<div class="loading-placeholder">Loading culture & lifestyle...</div>');
        }
        if (!readCache('home:tips-strategies', 3600) && !readCache('home:tips-strategies-html', 3600)) {
          $('#tipsStrategiesList').not(':has(.card__post__list)').html('<div class="loading-placeholder">Loading tips & strategies...</div>');
        }
        if (!readCache('home:latest-sidebar', 3600) && !readCache('home:latest-sidebar-html', 3600)) {
          $('#latestPostsSmallList').not(':has(.article__entry)').html('<div class="loading-placeholder">Loading latest posts...</div>');
        }
      }
      // Intercept pretty slug links and route to article detail doc for local preview
      try {
        document.addEventListener('click', function(e){
          var a = e.target.closest && e.target.closest('a');
          if (!a) return;
          var href = a.getAttribute('href') || '';
          var id = a.getAttribute('data-article-id') || '';
          var slug = a.getAttribute('data-article-slug') || '';
          if (/^\/[a-z0-9\-]+\/?$/.test(href) && (id || slug)) {
            // If a service worker controls the page, allow navigation to pretty slug
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
              return;
            }
            // Fallback for environments without service worker: route to detail HTML
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
      console.log('[homepage] initHomepage done');
    } catch(e) { console.warn('initHomepage error:', e); }
  };
  // Set default cache for first-time visitors
function setDefaultCacheForFirstVisit() {
  // No-op: do not seed placeholder caches; cache only real content
}

function purgePlaceholderCaches(){
  try {
    var keysHtml = [
      'home:hero-header-html','home:hero-right-html','home:latest-gaming-html',
      'home:latest-gaming-left-html','home:latest-gaming-right-html','home:sports-html',
      'home:popular-posts-html','home:culture-lifestyle-html','home:tips-strategies-html',
      'home:latest-sidebar-html','home:popular-header-html','home:trending-html'
    ];
    var keysData = [
      'home:hero-header','home:hero-right','home:trending','home:latest-gaming',
      'home:sports-carousel','home:popular-list','home:culture-lifestyle',
      'home:tips-strategies','home:latest-sidebar'
    ];
    function containsPlaceholderHtml(s){
      if (typeof s !== 'string' || s.length < 10) return true;
      var badPatterns = [
        '/images/', 'placeholder', 'dummy', 'lorem ipsum', 'data:image',
        'gangalogo.png'
      ];
      var okPatterns = ['supabase.co','/storage/v1/object/public/'];
      var lower = s.toLowerCase();
      if (badPatterns.some(function(p){ return lower.indexOf(p) >= 0; })) {
        if (okPatterns.some(function(p){ return s.indexOf(p) >= 0; })) { return false; }
        return true;
      }
      return false;
    }
    function isSuspiciousPost(p){
      if (!p || typeof p !== 'object') return true;
      var t = (p.title || '').toLowerCase();
      var img = String(p.image_url || '');
      if (t.indexOf('dummy') >= 0 || t.indexOf('placeholder') >= 0) return true;
      if (!img) return true;
      if (img.indexOf('/images/') >= 0) return true;
      if (img.indexOf('http') !== 0) return true;
      return false;
    }
    keysHtml.forEach(function(k){
      var raw = localStorage.getItem(k);
      if (!raw) return;
      try {
        var obj = JSON.parse(raw);
        var html = obj && obj.data;
        if (containsPlaceholderHtml(html)) {
          localStorage.removeItem(k);
        }
      } catch(_){ localStorage.removeItem(k); }
    });
    keysData.forEach(function(k){
      var raw = localStorage.getItem(k);
      if (!raw) return;
      try {
        var obj = JSON.parse(raw);
        var arr = obj && obj.data;
        if (!Array.isArray(arr) || arr.some(isSuspiciousPost)) {
          localStorage.removeItem(k);
        }
      } catch(_){ localStorage.removeItem(k); }
    });
  } catch(e){ console.warn('[homepage] purgePlaceholderCaches error:', e); }
}

  // Auto-run homepage init at earliest possible time to paint cached content
  try {
    // Set default cache for first-time visitors
    setDefaultCacheForFirstVisit();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function(){ try { window.initHomepage(); } catch(_){} });
    } else {
      window.initHomepage();
    }
  } catch(_){}
})();