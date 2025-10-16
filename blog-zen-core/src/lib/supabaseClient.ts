import { createClient } from "@supabase/supabase-js";

// Prefer Vite envs; fall back to localStorage or window globals set by static site scripts
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const ls = typeof window !== "undefined" ? window.localStorage : undefined;
const lsUrl = ls ? ls.getItem("VITE_SUPABASE_URL") || ls.getItem("SUPABASE_URL") : undefined;
const lsAnon = ls ? ls.getItem("VITE_SUPABASE_ANON_KEY") || ls.getItem("SUPABASE_ANON_KEY") : undefined;
const winUrl = typeof window !== "undefined" ? (window as any).SUPABASE_URL : undefined;
const winAnon = typeof window !== "undefined" ? (window as any).SUPABASE_ANON_KEY : undefined;

const supabaseUrl = envUrl || lsUrl || winUrl;
const supabaseAnonKey = envAnon || lsAnon || winAnon;

let supabaseInstance: any;
if (supabaseUrl && supabaseAnonKey) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // Safe shim to avoid runtime errors when envs are not set; components should handle no session
  supabaseInstance = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({ select: async () => ({ data: null, error: { message: "No Supabase configured" } }) }),
  };
}

export const supabase = supabaseInstance;