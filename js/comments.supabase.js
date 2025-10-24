// Supabase-backed comments: load and submit for article detail page
(function(){
  function getClient(){
    try {
      var client = window.supabaseClient || (typeof window.supabase !== 'undefined' ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null);
      if (!client) { console.warn('[comments] Supabase client not initialized.'); }
      return client || null;
    } catch (e) { console.warn('[comments] init failed:', e); return null; }
  }

  function fmtDate(value){
    try {
      var d = value ? new Date(value) : null;
      if (!d || isNaN(d.getTime())) return '';
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch(_) { return ''; }
  }

  function getPostId(){
    try {
      var wrap = document.querySelector('.wrap__article-detail');
      var idAttr = wrap ? (wrap.getAttribute('data-post-id') || '') : '';
      if (idAttr) return idAttr;
      var params = new URLSearchParams(window.location.search || '');
      var id = params.get('id') || params.get('article') || '';
      if (id) return id;
      var path = window.location.pathname || '';
      var seg = path.split('/').filter(Boolean).pop() || '';
      var m = seg.match(/(\d+)$/);
      return m && m[1] ? m[1] : '';
    } catch(_) { return ''; }
  }

  function renderList(comments){
    var list = document.getElementById('comment-list');
    var title = document.querySelector('#comments .comments-title');
    if (!list) return;
    list.innerHTML = '';
    var count = Array.isArray(comments) ? comments.length : 0;
    if (title) title.textContent = (count || 0) + ' Comments:';
    (comments || []).forEach(function(c){
      var li = document.createElement('li');
      li.className = 'comment';
      var aside = document.createElement('aside');
      aside.className = 'comment-body';

      var meta = document.createElement('div');
      meta.className = 'comment-meta';
      var author = document.createElement('div');
      author.className = 'comment-author vcard';
      var b = document.createElement('b'); b.className = 'fn'; b.textContent = c.name || 'Anonymous';
      var says = document.createElement('span'); says.className = 'says'; says.textContent = 'says:';
      author.appendChild(b); author.appendChild(says);

      var meta2 = document.createElement('div');
      meta2.className = 'comment-metadata';
      var a = document.createElement('a'); a.href = '#';
      var s = document.createElement('span'); s.textContent = fmtDate(c.created_at) || '';
      a.appendChild(s);
      meta2.appendChild(a);

      meta.appendChild(author);
      meta.appendChild(meta2);

      var content = document.createElement('div');
      content.className = 'comment-content';
      var p = document.createElement('p'); p.textContent = c.comment || '';
      content.appendChild(p);

      aside.appendChild(meta);
      aside.appendChild(content);
      li.appendChild(aside);
      list.appendChild(li);
    });
  }

  async function loadComments(postId){
    try {
      var client = getClient();
      if (!client || !postId) return;
      var res = await client
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });
      if (res.error) {
        var msgEl = document.getElementById('comment-message');
        var emsg = res.error && (res.error.message || String(res.error)) || '';
        var missingTbl = /Could not find the table 'public\.post_comments'/i.test(emsg);
        if (missingTbl) {
          if (msgEl) msgEl.textContent = 'Comments are not configured yet.';
          console.warn('[comments] table missing: create public.post_comments to enable comments');
          return;
        }
        console.warn('[comments] fetch error:', emsg);
        return;
      }
      renderList(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.warn('[comments] load error:', e);
    }
  }

  function bindSubmit(){
    var form = document.getElementById('comment-form');
    var msg = document.getElementById('comment-message');
    if (!form) return;
    form.addEventListener('submit', async function(ev){
      ev.preventDefault();
      var postId = getPostId();
      var comment = (document.getElementById('comment') || {}).value || '';
      if (!postId) { if (msg) msg.textContent = 'Post not loaded yet, please try again.'; return; }
      if (!comment) { if (msg) msg.textContent = 'Please enter your comment.'; return; }
      var client = getClient(); if (!client) return;
      try {
        var out = await client
          .from('post_comments')
          .insert({ post_id: postId, name: null, email: null, website: null, comment: comment, status: 'approved' })
          .select('*')
          .single();
        if (out.error) {
          var emsg = out.error && (out.error.message || String(out.error)) || '';
          var missingTbl = /Could not find the table 'public\.post_comments'/i.test(emsg);
          if (missingTbl) {
            if (msg) msg.textContent = 'Comments are not configured yet.';
            var btn = form.querySelector('button[type="submit"]');
            if (btn) { try { btn.disabled = true; } catch(_){} }
            return;
          }
          if (msg) msg.textContent = 'Error: ' + (emsg || 'Failed to submit');
          return;
        }
        // Reload comments to reflect the new one
        if (msg) msg.textContent = 'Thanks for commenting!';
        try { form.reset(); } catch(_){ /* ignore */ }
        loadComments(postId);
      } catch (e) {
        if (msg) msg.textContent = 'Error: ' + (e && e.message ? e.message : 'Failed to submit');
      }
    });
  }

  function init(){
    bindSubmit();
    var id = getPostId();
    if (id) loadComments(id);
    // Also listen for the article loader signal and then load
    document.addEventListener('article:loaded', function(e){
      var postId = (e && e.detail && e.detail.id) ? e.detail.id : getPostId();
      if (postId) loadComments(postId);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();