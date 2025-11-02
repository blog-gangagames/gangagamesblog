// Supabase-powered search results renderer
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

  function buildResultCard(p){
    var img = safeImage(p);
    var title = safeTitle(p);
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    var cat = safeCategory(p);
    var excerpt = (p && p.excerpt) ? String(p.excerpt) : '';
    return (
      '<div class="card__post card__post-list card__post__transition mt-30">\n'
      + '  <div class="row ">\n'
      + '    <div class="col-md-5">\n'
      + '      <div class="card__post__transition">\n'
      + '        <a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '"><img src="' + img + '" class="img-fluid w-100" alt=""></a>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '    <div class="col-md-7 my-auto pl-0">\n'
      + '      <div class="card__post__body ">\n'
      + '        <div class="card__post__content  ">\n'
      + '          <div class="card__post__category ">' + (cat || '') + '</div>\n'
      + '          <div class="card__post__author-info mb-2">\n'
      + '            <ul class="list-inline">\n'
      + '              <li class="list-inline-item"><span class="text-primary">by GangaGames Team</span></li>\n'
      + '              <li class="list-inline-item"><span class="text-dark text-capitalize">' + dateStr + '</span></li>\n'
      + '            </ul>\n'
      + '          </div>\n'
      + '          <div class="card__post__title">\n'
      + '            <h5><a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '">' + title + '</a></h5>\n'
      + '            <p class="d-none d-lg-block d-xl-block mb-0">' + (excerpt || '') + '</p>\n'
      + '          </div>\n'
      + '        </div>\n'
      + '      </div>\n'
      + '    </div>\n'
      + '  </div>\n'
      + '</div>'
    );
  }

  function getQuery(){
    try { var params=new URLSearchParams(window.location.search||''); return (params.get('q')||'').trim(); } catch(_) { return ''; }
  }

  async function render(){
    var q = getQuery();
    var client = getClient();
    var wrap = document.querySelector('.wrap__search-result');
    var header = document.querySelector('.wrap__search-result-keyword h5');
    if (header) {
      header.innerHTML = 'Search results for keyword: <span class="text-primary"> "' + (q || '') + '" </span> found in <span id="resultCount">0</span> posts.';
    }
    if (!wrap || !client) return;

    // Remove any static list items
    var statics = wrap.querySelectorAll('.card__post.card__post-list');
    statics.forEach(function(el){ try { el.parentNode && el.parentNode.removeChild(el); } catch(_){} });
    var container = document.getElementById('searchResults');
    if (!container) {
      container = document.createElement('div');
      container.id = 'searchResults';
      wrap.appendChild(container);
    }
    container.innerHTML = '<p class="text-muted">Searching...</p>';

    try {
      var like = q ? '%' + q.replace(/%/g,'') + '%' : '%';
      var res = await client
        .from('posts')
        .select('id,title,image_url,excerpt,main_category,subcategory,published_at,created_at,status')
        .eq('status','published')
        .or('title.ilike.' + like + ',excerpt.ilike.' + like)
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(25);
      if (res.error) { container.innerHTML = '<p class="text-danger">Search failed: ' + (res.error.message||'Unknown error') + '</p>'; return; }
      var rows = Array.isArray(res.data) ? res.data : [];
      var countEl = document.getElementById('resultCount');
      if (countEl) countEl.textContent = String(rows.length);
      if (!rows.length) { container.innerHTML = '<p class="text-muted">No posts found.</p>'; return; }
      container.innerHTML = rows.map(buildResultCard).join('');
    } catch (e) {
      container.innerHTML = '<p class="text-danger">Search crashed. Please try again later.</p>';
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', render); } else { render(); }
  // Intercept pretty slug links for local preview routing
  try {
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      var id = a.getAttribute('data-article-id') || '';
      var slug = a.getAttribute('data-article-slug') || '';
      if (/^\/[a-z0-9\-]+\/?$/.test(href) && (id || slug)) {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          // Let SW handle pretty slug navigation
          return;
        }
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