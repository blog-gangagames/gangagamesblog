// Populate sidebar small posts under the search box with real data
(function(){
  function getClient(){
    try { return window.supabaseClient || (typeof window.supabase !== 'undefined' ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null); } catch(_) { return null; }
  }
  function fmtDate(input){
    try { var d = input ? new Date(input) : null; if (!d || isNaN(d.getTime())) return ''; var y=d.getFullYear(), m=(d.getMonth()+1).toString().padStart(2,'0'), day=d.getDate().toString().padStart(2,'0'); return y+'-'+m+'-'+day; } catch(_) { return ''; }
  }
  function safeImage(p){ return (p && p.image_url) ? p.image_url : 'images/newsimage1.png'; }
  function safeTitle(p){ return (p && p.title) ? p.title : 'Untitled'; }
  function safeCategory(p){ var raw=(p&&p.subcategory)?p.subcategory:(p&&p.main_category?p.main_category:''); return String(raw || ''); }
  function slugifyTitle(t){ try { return String(t||'').replace(/['"]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); } catch(_) { return ''; } }
  function articleUrl(p){
    var title=safeTitle(p); var slug=slugifyTitle(title);
    return slug ? ('/' + slug) : '/';
  }

  function buildSmallCard(p){
    var img = safeImage(p);
    var title = safeTitle(p);
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    var cat = safeCategory(p);
    return (
      '<div class="card__post card__post-list">\n'
      + '  <div class="image-sm">\n'
      + '    <a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '"><img src="' + img + '" class="img-fluid" alt=""></a>\n'
      + '  </div>\n'
      + '  <div class="card__post__body ">\n'
      + '    <div class="card__post__content">\n'
      + '      <div class="card__post__category">' + (cat || '') + '</div>\n'
      + '      <div class="card__post__author-info mb-2">\n'
      + '        <ul class="list-inline">\n'
      + '          <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
      + '          <li class="list-inline-item"><span class="text-dark text-capitalize">' + dateStr + '</span></li>\n'
      + '        </ul>\n'
      + '      </div>\n'
      + '      <div class="card__post__title">\n'
      + '        <h6><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">' + title + '</a></h6>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
  }

  async function loadSidebar(){
    try {
      var client = getClient();
      if (!client) return;
      // Try to read current article/category context
      var catEl = document.querySelector('.wrap__article-detail-info a');
      var activeCat = catEl ? String(catEl.textContent || '').trim() : '';
      var res = await client
        .from('posts')
        .select('id,title,image_url,published_at,created_at,main_category,subcategory,status')
        .eq('status','published')
        .or(activeCat ? ('main_category.eq.' + activeCat + ',subcategory.eq.' + activeCat) : '')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6);
      if (res.error) { console.warn('[sidebar] fetch error:', res.error.message || res.error); return; }
      var rows = Array.isArray(res.data) ? res.data : [];
      var container = document.querySelector('.wrapper__list__article-small');
      if (!container) return;
      container.innerHTML = rows.map(buildSmallCard).join('');
    } catch (e) { console.warn('[sidebar] load error:', e); }
  }

  function init(){
    var boot = function(){ loadSidebar(); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
    // Also react after article is loaded to pick up category context
    try { document.addEventListener('article:loaded', boot); } catch(_){ }
    // Intercept sidebar pretty slug links for local preview routing
    try {
      document.addEventListener('click', function(e){
        var a = e.target.closest && e.target.closest('a');
        if (!a) return;
        var href = a.getAttribute('href') || '';
        var id = a.getAttribute('data-article-id') || '';
        var slug = a.getAttribute('data-article-slug') || '';
        if (/^\/[a-z0-9\-]+\/?$/.test(href) && (id || slug)) {
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
  }
  init();
})();