# Offtracq

Source for [offtracq.com](https://offtracq.com) — the site for the [Offtracq](https://www.youtube.com/@Offtracq) YouTube channel: cinematic travel and adventure films (hiking, kayaking, off-roading, via ferrata) plus stories of Native America and the hidden places worth going off the beaten path for.

React + TypeScript + Vite. The site's videos/shorts are pulled from the YouTube Data API at build time into `public/youtube.json`, which the frontend fetches statically — no API key ships to the browser.

## Local development

```bash
npm install
cp .env.example .env   # fill in YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID
npm run dev
```

`YOUTUBE_API_KEY` needs the **YouTube Data API v3** enabled in Google Cloud Console. Restrict the key (API restrictions + HTTP referrer/IP restrictions) — never commit `.env`.

The contact form posts to [Formspree](https://formspree.io) so messages land in an inbox without ever exposing that address in the site. Create a form there, set `VITE_FORMSPREE_ENDPOINT` to its endpoint URL.

## Build

```bash
npm run build   # fetches latest videos, then builds to dist/
```

## Deployment

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml), which builds the site and publishes it to GitHub Pages at the custom domain `offtracq.com`. It also re-runs on a schedule so the video list stays fresh without a code change. The workflow needs `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` and `FORMSPREE_ENDPOINT` set as repository secrets (Settings → Secrets and variables → Actions).
