# Render Deployment

This project can run on Render as a single Node web service.

## Why your deploy failed

Render was starting `npm run dev` from the project root. In this repo that launches Vite, which is a frontend dev server:

- it is not the backend
- it binds to `localhost:5173`
- Render expects your app to listen on `0.0.0.0:$PORT`

## Fixed in this repo

- Root `npm start` now runs `server/production.js`
- Root install now also installs `server/` dependencies
- Backend now listens on `0.0.0.0`
- Frontend API calls now use `VITE_API_BASE_URL` or `/api` in production
- Backend can run even if `dist/` is missing

## Render settings

If you create the service manually, use:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`

## Required environment variables

- `MONGODB_URI`
- `VITE_MAPBOX_TOKEN`
- `CORS_ORIGINS`

Optional:

- `VITE_API_BASE_URL=/api`

Example:

- `CORS_ORIGINS=https://your-hostinger-domain.com`

## Recommended deploy flow

1. Push these changes to GitHub.
2. In Render, redeploy the service.
3. Open `/api/health` after deploy to confirm the backend is live.

## Important note

If you want to deploy only the backend from the `server/` folder instead of the whole app, you can also make a separate Render service with:

- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`

That setup is only for API deployment and will not serve the React frontend.
