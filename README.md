# Olingo — Vietnamese & Venezuelan Spanish Learning

Minimal full-stack starter for a playful language-learning site:

- Frontend: Vite + React (in `web`)
- Backend: Express API (in `api`)

Quick start

1. Install dependencies for both projects:

```bash
cd web
npm install
cd ../api
npm install
```

2. Run the API (default port 4000):

```bash
cd api
npm start
```

3. Run the frontend (default port 5173):

```bash
cd ../web
npm run dev
```

Files of interest

- [web/src/App.jsx](web/src/App.jsx)
- [web/src/components/Roadmap.jsx](web/src/components/Roadmap.jsx)
- [api/index.js](api/index.js)

Next steps

- Hook up a real database (SQLite/Postgres) and authentication
- Add lesson authoring UI and content pipeline
- Deploy to Vercel/Netlify (frontend) + Render/Heroku (API)
