# Deployment Guide for Olingo

## Frontend Deployment (Netlify)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repo
   - Set Build command: `npm run build` (in web dir)
   - Set Publish directory: `web/dist`
   - Click Deploy

3. **Environment Variables (in Netlify UI)**
   - Add `VITE_API_URL` = your Render API URL (e.g., `https://olingo-api.onrender.com`)

## Backend Deployment (Render)

1. **Create a render.yaml or use Render UI**
   
   Via Render Dashboard:
   - Create new Web Service
   - Connect GitHub repo
   - Set Runtime: Node
   - Set Build Command: `cd api && npm install`
   - Set Start Command: `cd api && npm start`
   - Add environment variable: `NODE_ENV=production`
   - Set PORT: 4000 (default)

2. **Database Persistence**
   - SQLite database stored at `/api/data/olingo.db`
   - On Render, you'll need to mount a persistent disk:
     - Add disk at `/api/data` (250MB free tier available)
   - Or switch to PostgreSQL for better production use

3. **After Deployment**
   - Get your API URL from Render (e.g., `https://olingo-api.onrender.com`)
   - Update Netlify environment variable `VITE_API_URL`
   - Test by visiting the Netlify site

## Local Development

```bash
# Terminal 1: API
cd api
npm install
npm start

# Terminal 2: Frontend
cd web
npm install
npm run build
npm run preview

# Or for live development:
npm run dev
```

## Production Checklist

- [ ] Environment variables set correctly
- [ ] CORS configured (API allows frontend domain)
- [ ] SSL/HTTPS enabled on both
- [ ] Database backups enabled (if using persistent storage)
- [ ] Error logging configured
- [ ] Rate limiting enabled
- [ ] Password requirements enforced
- [ ] JWT secrets changed from development values

## Troubleshooting

### Flashcards not loading
- Check API `/api/flashcards-due` endpoint
- Verify user is authenticated with valid token
- Check browser console for CORS errors

### XP not updating
- Verify token is being sent with Authorization header
- Check API logs for errors
- Ensure user record exists in database

### Deployment build fails
- Clear `node_modules` and reinstall: `npm install --force`
- Check Node version matches (18+)
- Verify all dependencies are in package.json
