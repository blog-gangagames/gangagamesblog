// Supabase bootstrap for static pages (plain JS)
// Sets global `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `supabaseClient` if available
(function(){
  var url = (typeof window !== 'undefined' && (window.SUPABASE_URL || localStorage.getItem('VITE_SUPABASE_URL'))) || "https://wzeoxjjybtfiupzjwrti.supabase.co";
  var anon = (typeof window !== 'undefined' && (window.SUPABASE_ANON_KEY || localStorage.getItem('VITE_SUPABASE_ANON_KEY'))) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0";
  if (typeof window !== 'undefined') {
    window.SUPABASE_URL = url;
    window.SUPABASE_ANON_KEY = anon;
    window.SUPABASE_IS_CONFIGURED = !!(url && anon);
    window.setSupabaseKeys = function(u, k){
      try {
        if (u) { window.SUPABASE_URL = u; localStorage.setItem('VITE_SUPABASE_URL', u); }
        if (k) { window.SUPABASE_ANON_KEY = k; localStorage.setItem('VITE_SUPABASE_ANON_KEY', k); }
        console.log('[Supabase] Keys updated');
        if (typeof window.ensureSupabaseClient === 'function') { window.ensureSupabaseClient(true); }
      } catch(e){ console.warn('[Supabase] setSupabaseKeys failed:', e); }
    };
    window.ensureSupabaseClient = function(force){
      try {
        if (force) { window.supabaseClient = null; }
        if (window.supabaseClient) return window.supabaseClient;
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
          if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
            console.warn('[Supabase] Missing URL/anon key. Set with setSupabaseKeys or localStorage.');
            return null;
          }
          window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
          console.log('[Supabase] Client initialized');
          return window.supabaseClient;
        } else {
          console.warn('[Supabase] supabase-js CDN not loaded');
          return null;
        }
      } catch(e){ console.error('[Supabase] ensureSupabaseClient failed:', e); return null; }
    };
    // Attempt to initialize immediately
    window.ensureSupabaseClient(false);
  }
})();