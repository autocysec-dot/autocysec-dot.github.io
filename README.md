# ComplyPS — Website & CRA Tool (frontend)

Public site for **ComplyPS** (Comply Product Security). Hosted on GitHub Pages.

- **`/`** — the ComplyPS company home (`website/index.html`) — the suite of solutions.
- **`/complyps-cra/`** — the CRA solution landing page (`website/complyps-cra/index.html`).
- **`/complyps-cra/app/`** — the CRA tool UI (a React app built from `frontend/`).

The site is a hierarchy: ComplyPS home → per-regulation solution page → that regulation's tool(s).
Future regulations (NIS2, RED) get their own `/<regulation>/` section the same way.

> This repository contains only the public website and the **frontend** of the CRA tool. The
> frontend has no compliance logic — it calls a separate backend service for all classification and
> data. The backend is proprietary and is **not** part of this repository.

## Structure

```
website/
  index.html             ComplyPS company home  (served at /)
  complyps-cra/
    index.html           CRA solution landing   (served at /complyps-cra/)
frontend/                CRA tool UI (React + Vite) -> built to /complyps-cra/app/
  src/ ...
.github/workflows/
  deploy-pages.yml       builds & assembles the hierarchy and deploys to Pages
```

## Local development

```bash
# CRA tool UI
cd frontend
npm install
npm run dev            # http://localhost:5173

# Landing page (any static server), e.g.
npx serve website
```

The tool's backend URL is configurable in the app's **Settings** screen (defaults to
`http://localhost:4000`).

## Deployment

Automated via GitHub Actions on every push to `main`. The workflow builds the React app and
assembles the site so the landing page is served at the root and the tool at `/complyps-cra/`.

Live: https://complyps.com/ (custom domain; CNAME file kept in `website/CNAME`).

## Roadmap

The site is structured to host more tools and regulations over time (e.g. NIS2, RED), each under its
own path alongside `/complyps-cra/`.
