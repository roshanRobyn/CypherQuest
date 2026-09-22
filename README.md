# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Backend + gameplay monitoring

This repo now also includes a small Node.js/Fastify backend, in `backend/`,
that tracks team registration, game sessions, puzzle completion timing, and
a leaderboard — plus updates to `admin.html` so it can optionally pull live
data from that backend. Full details, API reference, and the DB-migration
story are in [`backend/README.md`](./backend/README.md).

### Running both locally

```bash
# Terminal 1 — frontend (Vite dev server)
npm install
npm run dev              # http://localhost:5173

# Terminal 2 — backend (Fastify API)
cd backend
npm install
cp .env.example .env     # optional
npm run dev               # http://localhost:3001
```

Copy `.env.example` to `.env.local` at the repo root if you need to point
the frontend at a non-default backend URL (`VITE_API_URL`).

Open `admin.html` directly in a browser (or serve it) to monitor teams live
once the backend is running — it works standalone via localStorage even
without the backend.

### Deployment sketch

- **Frontend**: `npm run build` produces a static `dist/` folder deployable
  to any static host (Netlify, Vercel, GitHub Pages, S3+CloudFront, etc.).
  Set `VITE_API_URL` at build time to point at the deployed backend.
- **Backend**: a small stateless-ish Node process (`backend/`) deployable to
  any Node host (Render, Fly.io, Railway, a small VM, etc.). It currently
  persists to a local JSON file, so it needs a persistent disk/volume if
  deployed to an ephemeral filesystem — or migrate to a real database first
  (see `backend/README.md` → "Data storage & the DB-swap point").
- **Future**: swap `backend/src/services/teamRepository.js`'s JSON-file
  implementation for Postgres/Supabase without touching routes/controllers.
