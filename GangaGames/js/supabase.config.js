// Configure Supabase for the static site.
// IMPORTANT: Replace the placeholder values with your actual project URL and anon key.
// These values are safe to use client-side (anon key), but keep service keys secret.
// You can also set these at runtime via localStorage keys 'VITE_SUPABASE_URL' and 'VITE_SUPABASE_ANON_KEY'.

;(function () {
  var url = window.SUPABASE_URL || localStorage.getItem('VITE_SUPABASE_URL') || 'https://wzeoxjjybtfiupzjwrti.supabase.co'
  var anon = window.SUPABASE_ANON_KEY || localStorage.getItem('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0'
  window.SUPABASE_URL = url
  window.SUPABASE_ANON_KEY = anon
})()