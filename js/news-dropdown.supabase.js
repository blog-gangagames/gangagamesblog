// Populate the NEWS dropdown slider on non-home pages (category, article, contact)
// Depends on: jQuery, supabase-js CDN, js/supabase.config.js
(function(){
  function getClient(){
    try {
      var client = window.supabaseClient || (typeof window.supabase !== 'undefined' ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null);
      if (!client) { console.warn('[news-dropdown] Supabase client not initialized. Check SUPABASE_URL/ANON_KEY and CDN.'); }
      return client || null;
    } catch (e) { console.warn('[news-dropdown] Supabase client init failed:', e); return null; }
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

  function buildItem(p){
    var img = (p && p.image_url) ? p.image_url : 'images/newsimage1.png';
    var title = (p && p.title) ? p.title : 'Untitled';
    var id = (p && p.id) ? String(p.id) : '';
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    var href = 'article-detail-v1.html' + (id ? ('?id=' + encodeURIComponent(id) + (title ? ('&slug=' + encodeURIComponent(slugifyTitle(title))) : '')) : '');
    return $(
      '<div class="item">\n'
      + '  <div class="article__entry">\n'
      + '    <div class="article__image">\n'
      + '      <a href="' + href + '">\n'
      + '        <img src="' + img + '" alt="" class="img-fluid">\n'
      + '      </a>\n'
      + '    </div>\n'
      + '    <div class="article__content">\n'
      + '      <ul class="list-inline">\n'
      + '        <li class="list-inline-item"><span>' + (dateStr || '') + '</span></li>\n'
      + '      </ul>\n'
      + '      <h5><a href="' + href + '">' + title + '</a></h5>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
  }

  async function fetchLatest(limit){
    var client = getClient();
    if (!client) return [];
    try {
      var { data, error } = await client
        .from('posts')
        .select('id, title, image_url, created_at, published_at, status')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit || 8);
      if (error) { console.warn('[news-dropdown] fetchLatest error:', error.message || error); return []; }
      return Array.isArray(data) ? data : [];
    } catch(e){ console.warn('[news-dropdown] fetchLatest failed:', e && e.message ? e.message : e); return []; }
  }

  function populateFallback($slider){
    if (!$slider || !$slider.length) return;
    $slider.empty();
    var items = [
      { id: 'local-1', title: "Latest Cricket Odds and Tips", image_url: 'images/newsimage8.png', created_at: '2024-08-01' },
      { id: 'local-2', title: "Casino Bonuses You Shouldn't Miss", image_url: 'images/medium/newsimage2.png', created_at: '2024-08-05' },
      { id: 'local-3', title: "Beginner's Guide to Poker Hands", image_url: 'images/newsimage7.png', created_at: '2024-08-09' },
      { id: 'local-4', title: 'Top Roulette Strategies Explained', image_url: 'images/newsimage6.png', created_at: '2024-08-12' }
    ];
    items.forEach(function(p){ $slider.append(buildItem(p)); });
  }

  async function populateDropdown(){
    try {
      var $slider = $('#dropdownNewsSlider');
      if (!$slider || !$slider.length) { return; }
      var posts = await fetchLatest(8);
      $slider.empty();
      if (!posts || posts.length === 0) {
        populateFallback($slider);
      } else {
        posts.forEach(function(p){ $slider.append(buildItem(p)); });
      }
      // If Slick was initialized earlier by global scripts, refresh it to pick up new slides
      try {
        if ($slider.hasClass('slick-initialized')) {
          $slider.slick('unslick');
        }
        // Reinitialize with the same settings used globally
        if (typeof $slider.slick === 'function') {
          $slider.slick({
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
      } catch (e) {
        console.warn('[news-dropdown] slick reinit failed:', e);
      }
    } catch(e){ console.warn('[news-dropdown] populateDropdown error:', e && e.message ? e.message : e); }
  }

  function onReady(fn){ if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }
  onReady(function(){ populateDropdown(); });
})();