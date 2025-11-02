// Simple service worker to support pretty slug URLs like "/my-post-title"
// For slug paths, try serving fully rendered article HTML from /api/blog/{slug}.
// Falls back to the article detail shell when API or network is unavailable.
self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of uncontrolled clients
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle navigation requests (full page loads)
  if (event.request.mode !== 'navigate') return;

  event.respondWith((async () => {
    try {
      // Try the network first
      const response = await fetch(event.request);
      // If the request succeeded, return it
      if (response && response.ok) {
        return response;
      }
      // If the request was a 404 or otherwise not OK, decide whether to fallback
      const url = new URL(event.request.url);
      const path = url.pathname || '/';
      const isSlugPath = (p) => /^\/([a-z0-9\-]+)\/?$/i.test(p);
      const isCategorySlugPath = (p) => /^\/[a-z0-9\-]+\/[a-z0-9\-]+\/?$/i.test(p);
      const extractSlug = (p) => {
        try {
          const parts = p.replace(/^\/+|\/+$/g, '').split('/');
          return parts[parts.length - 1] || '';
        } catch (_) { return ''; }
      };
      // Exclude known routes and file paths
      const excluded = (
        /\.(html|css|js|png|jpg|jpeg|gif|svg|webp|ico|json|map)(\?|$)/i.test(path) ||
        /^\/category\//i.test(path) ||
        /^\/blackjack\/?$/i.test(path) ||
        /^\/poker\/?$/i.test(path) ||
        /^\/roulette\/?$/i.test(path) ||
        /^\/online-slots\/?$/i.test(path) ||
        /^\/contact\.html$/i.test(path) ||
        /^\/search-result\.html$/i.test(path) ||
        /^\/article-detail-v1\.html$/i.test(path) ||
        /^\/index\.html$/i.test(path) ||
        path === '/'
      );
      // If it's the homepage and the response was not OK, serve static index.html
      if (path === '/' || /^\/index\.html$/i.test(path)) {
        try { const home = await fetch('/index.html'); if (home && home.ok) return home; } catch(_){}
      }
      // If it's a category path like "/category/blackjack" and not found, serve the category shell
      if (/^\/category\/[a-z0-9\-]+\/?$/i.test(path)) {
        return fetch('/category-style-v2.html');
      }
      // If it's a top-level slug path like "/my-post" and not excluded, try API first
      if (!excluded && isSlugPath(path)) {
        const slug = extractSlug(path);
        try {
          const apiResp = await fetch(`/api/blog/${encodeURIComponent(slug)}`, { headers: { 'X-From-SW': '1' } });
          if (apiResp && apiResp.ok) return apiResp;
        } catch (_) { /* fall through to shell */ }
        return fetch('/article-detail-v1.html');
      }
      // If it's a two-segment path like "/<category>/<slug>", try API using the slug segment
      if (!excluded && isCategorySlugPath(path)) {
        const slug = extractSlug(path);
        try {
          const apiResp = await fetch(`/api/blog/${encodeURIComponent(slug)}`, { headers: { 'X-From-SW': '1' } });
          if (apiResp && apiResp.ok) return apiResp;
        } catch (_) { /* fall through to shell */ }
        return fetch('/article-detail-v1.html');
      }
      // REMOVE: Service worker fallback logic for static HTML (category-style-v2.html, article-detail-v1.html, etc.)
      // ENSURE: No fallback to static HTML; allow normal fetch and error handling
      return response;
    } catch (err) {
      // Network failed (offline or server missing) — fallback based on path heuristic
      try {
        const url = new URL(event.request.url);
        const path = url.pathname || '/';
        const isSlugPath = (p) => /^\/([a-z0-9\-]+)\/?$/i.test(p) || /^\/[a-z0-9\-]+\/[a-z0-9\-]+\/?$/i.test(p);
        if (isSlugPath(path)) return fetch('/article-detail-v1.html');
      } catch (_) {}
      // As a last resort, show the homepage
      return fetch('/index.html');
    }
  })());
});