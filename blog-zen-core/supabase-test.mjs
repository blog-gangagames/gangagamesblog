import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wzeoxjjybtfiupzjwrti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZW94amp5YnRmaXVwemp3cnRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzA4NzQsImV4cCI6MjA3NTkwNjg3NH0.Rm40EGL0debjP4IiqtknXHxXVgozPKy-ieY3Tm9sMv0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    const result = {
      status,
      ok: !error,
      error: error ? error.message : null,
      sample: Array.isArray(data) ? data.slice(0, 1) : null,
    };
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Connection test failed:', e?.message || e);
    process.exit(1);
  }
}

main();