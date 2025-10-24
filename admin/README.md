# Admin Dashboard

A React + Vite admin panel hosted separately from the main site.

## Prerequisites
- Node.js 18+ installed
- npm (or pnpm/yarn)
- Supabase project URL and anon key

## Setup
1. Clone the repo (admin directory as the repository root).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your env file:
   ```bash
   cp .env.example .env.local
   # Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
4. Run locally:
   ```bash
   npm run dev
   ```
   Dev server will start on `http://localhost:5173/`.

## Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – build for production to `dist/`
- `npm run preview` – preview the production build locally

## Deployment (Vercel)
This app is a client-side routed SPA. Use the provided `vercel.json` for proper history fallback.
- Project Settings:
  - Build Command: `npm run build`
  - Output Directory: `dist`
- `vercel.json` includes a rewrite so direct visits like `/dashboard` still return `index.html`.

## Environment Variables
- `VITE_SUPABASE_URL` – your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – your Supabase anon key
- `VITE_PUBLIC_SITE_URL` – optional, used for logout redirects to the public site

## Notes
- Do not commit `.env*` files. Use `.env.example` for documentation.
- If deploying to Netlify instead of Vercel, add a `_redirects` file with:
  ```
  /*    /index.html   200
  ```
- For GitHub Pages, set `base` in `vite.config.ts` to the repository name and rebuild.
