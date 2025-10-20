// Supabase bootstrap for static pages (nested path version)
(function(){
  var url = (typeof window !== 'undefined' && (window.SUPABASE_URL || localStorage.getItem('VITE_SUPABASE_URL'))) || "https://wzeoxjjybtfiupzjwrti.supabase.co";
  var anon = (typeof window !== 'undefined' && (window.SUPABASE_ANON_KEY || localStorage.getItem('VITE_SUPABASE_ANON_KEY'))) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0";
  if (typeof window !== 'undefined') {
    window.SUPABASE_URL = url;
    window.SUPABASE_ANON_KEY = anon;
    window.SUPABASE_IS_CONFIGURED = !!(url && anon);
    window.ensureSupabaseClient = window.ensureSupabaseClient || function(force){
      try {
        if (force) { window.supabaseClient = null; }
        if (window.supabaseClient) return window.supabaseClient;
        if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
          window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
          console.log('[Supabase] Client initialized (nested)');
          return window.supabaseClient;
        }
        return null;
      } catch(e){ console.error('[Supabase] ensureSupabaseClient failed:', e); return null; }
    };
    window.ensureSupabaseClient(false);
  }
})();