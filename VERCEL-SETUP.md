# Vercel setup (shared leagues + tribes)

## 1. Redis storage

1. Open your project in the [Vercel dashboard](https://vercel.com).
2. Go to **Storage** → **Create Database** / **Marketplace**.
3. Add **Upstash Redis** (the current replacement for Vercel KV).
4. Connect it to this project. Vercel injects `KV_REST_API_URL` and `KV_REST_API_TOKEN` into production (and preview if you choose).

Redeploy after linking storage so Route Handlers can read/write.

## 2. Local development

```bash
vercel env pull .env.local
npm run dev
```

Without those variables, the app still runs: draft falls back to `localStorage`, tribe saves return 503 and the UI shows a warning.

## 3. Using a league

Share a URL with a league slug (letters, numbers, hyphens):

`https://your-app.vercel.app/?league=our-secret-name`

Everyone on that URL shares draft status and pick order. Tribe assignments are shared for the whole season (all URLs).

## 4. Privacy (crawlers)

`robots.txt`, page metadata, and `X-Robots-Tag` ask crawlers not to index the site. That reduces casual search indexing; it is **not** access control—anyone with the URL can read or edit data.
