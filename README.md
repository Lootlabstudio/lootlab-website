# lootlab-website

Official website for Loot Lab Studios, built with [Astro](https://astro.build).

## Develop

Requires Node 22.12 or newer (see `.nvmrc`).

```bash
npm install
npm run dev       # local dev server
npm run build     # production build into dist/
npm run preview   # serve the production build
```

## Where things live

- `src/pages/` – routes: the homepage, `games/[slug]` for each game, and the 404 page
- `src/components/` – page sections (intro, featured game, media showcase, studio, contact)
- `src/data/site.js` – studio name, email and social links
- `src/data/games.js` – every game; adding an entry creates its page at `/games/<slug>/`
- `src/scripts/intro.js` – the scroll-driven 3D intro (three.js)
- `src/scripts/site.js` – shared interactions (viewers, reveals, contact form)
- `public/` – files served as-is: trailer video, favicons, share image, `_headers`, `robots.txt`
- `concepts/` – the design concepts explored during the redesign (not deployed)

## Deploy

Cloudflare Pages: build command `npm run build`, output directory `dist`.
