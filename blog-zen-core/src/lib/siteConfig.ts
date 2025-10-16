// Public site URL resolver: returns main homepage URL for redirects
export function getPublicSiteUrl(): string {
  // Prefer explicit Vite env
  const envUrl = (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL as string | undefined;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl;
  }

  // Runtime heuristic for local dev
  if (typeof window !== 'undefined') {
    try {
      const current = new URL(window.location.href);
      // If running the React admin on localhost, default the public site to port 3000
      if (current.hostname === 'localhost') {
        return 'http://localhost:3000/';
      }
    } catch (_) {
      // ignore
    }
  }

  // Fallback: root
  return '/';
}