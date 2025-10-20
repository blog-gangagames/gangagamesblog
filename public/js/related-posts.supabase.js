// Related posts loader (random real posts from Supabase)
(function(){
  function getClient(){
    try { return window.supabaseClient || (typeof window.supabase !== 'undefined' ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null); } catch(_) { return null; }
  }
  function safeImage(p){ return (p && p.image_url) ? p.image_url : 'images/newsimage1.png'; }
  function safeTitle(p){ return (p && p.title) ? p.title : 'Untitled'; }
  function fmtDate(input){
    try { var d = input ? new Date(input) : null; if (!d || isNaN(d.getTime())) return ''; var y=d.getFullYear(), m=(d.getMonth()+1).toString().padStart(2,'0'), day=d.getDate().toString().padStart(2,'0'); return y+'-'+m+'-'+day; } catch(_) { return ''; }
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
  function articleUrl(p){
    var title = safeTitle(p);
    var slug = slugifyTitle(title);
    return slug ? ('/' + slug) : '/';
  }
  function buildEntry(p){
    var img = safeImage(p);
    var title = safeTitle(p);
    var dateStr = fmtDate(p && (p.published_at || p.created_at));
    return (
      '<div class="item">\n'
      + '  <div class="article__entry">\n'
      + '    <div class="article__image">\n'
      + '      <a href="' + articleUrl(p) + '" data-article-id="' + (p && p.id ? p.id : '') + '" data-article-slug="' + slugifyTitle(title) + '"><img src="' + img + '" alt="" class="img-fluid"></a>\n'
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

  function shuffle(arr){
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  async function loadRelated(currentId){
    try {
      var client = getClient();
      if (!client) return;
      var res = await client
        .from('posts')
        .select('id,title,image_url,published_at,created_at')
        .eq('status','published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(24);
      if (res.error) { console.warn('[related] fetch error:', res.error.message || res.error); return; }
      var rows = Array.isArray(res.data) ? res.data : [];
      var filtered = rows.filter(function(p){ return String(p.id) !== String(currentId || ''); });
      var picks = shuffle(filtered).slice(0, 4);
      var container = document.getElementById('relatedPosts');
      if (!container) return;
      container.innerHTML = picks.map(buildEntry).join('');
    } catch (e) { console.warn('[related] load error:', e); }
  }

  function init(){
    document.addEventListener('article:loaded', function(e){
      var id = e && e.detail ? e.detail.id : null;
      loadRelated(id);
    });
    // If event missed, attempt a delayed load without exclusion
    setTimeout(function(){
      var container = document.getElementById('relatedPosts');
      if (container && !container.children.length) loadRelated(null);
    }, 1200);
  }

  init();
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
          // Allow pretty slug navigation handled by SW
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