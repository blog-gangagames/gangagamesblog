// Supabase healthcheck: verifies client init and read access to `posts` and dispatches a status event
(function(){
  function onReady(fn){ if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', fn); } else { fn(); } }
  function dispatch(status){
    try { document.dispatchEvent(new CustomEvent('supabase-health', { detail: status })); }
    catch(e){ /* ignore */ }
  }
  function run(){
    var status = {
      startedAt: new Date().toISOString(),
      clientInitialized: false,
      ok: null,
      error: null,
      dataLength: 0,
    };
    try {
      var client = window.supabaseClient || (typeof window.ensureSupabaseClient === 'function' ? window.ensureSupabaseClient(false) : null);
      status.clientInitialized = !!client;
      if (!client) { status.ok = false; status.error = 'Supabase client not initialized'; dispatch(status); return Promise.resolve(status); }
      return client
        .from('posts')
        .select('id, status')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .then(function(res){
          if (res && res.error) {
            status.ok = false;
            status.error = res.error.message || String(res.error);
          } else {
            var list = (res && Array.isArray(res.data)) ? res.data : [];
            status.dataLength = list.length;
            status.ok = true;
          }
          dispatch(status);
          return status;
        })
        .catch(function(e){
          status.ok = false;
          status.error = e && e.message ? e.message : String(e);
          dispatch(status);
          return status;
        });
    } catch(e){ status.ok = false; status.error = e && e.message ? e.message : String(e); dispatch(status); return Promise.resolve(status); }
  }
  window.runSupabaseHealthcheck = run;
  onReady(function(){ run(); });
})();