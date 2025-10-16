// Simple Supabase bootstrap for static pages (plain JS)
// Sets global `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `supabaseClient` if available
(function () {
  // Single source of truth: prefer window globals, fallback to hardcoded values
  var SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) || "https://wzeoxjjybtfiupzjwrti.supabase.co";
  var SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0";

  if (typeof window !== 'undefined') {
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    try {
      console.log('[Supabase] Config active:', { url: SUPABASE_URL });
      // In non-module static pages, `supabase` may be loaded via script tag
      if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      }
    } catch (e) {
      console.error('Supabase init failed:', e);
    }
  }
})();