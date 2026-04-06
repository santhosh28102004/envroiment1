# Deployment Guide

## Frontend on Vercel

- Root directory: `frontend`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`

`frontend/vercel.json` is included so React Router routes work after refresh.

## Backend on Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Set these environment variables in Render:

- `MONGO_URI`
- `MONGO_DB_NAME`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `ALLOWED_ORIGINS`
- `DEFAULT_USER_NAME`
- `DEFAULT_USER_EMAIL`
- `DEFAULT_USER_PASSWORD`

Use `CLIENT_URL` for your main Vercel domain. Use `ALLOWED_ORIGINS` as a comma-separated list if you also want preview domains or extra frontend URLs.

Example:

```env
CLIENT_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app,https://your-project-git-main-your-team.vercel.app
```

## Deploy order

1. Deploy the backend to Render and confirm `/api/health` works.
2. Copy the Render URL.
3. Set `VITE_API_BASE_URL` in Vercel to `https://your-render-service.onrender.com/api`.
4. Deploy the frontend to Vercel.
5. Update Render `CLIENT_URL` and `ALLOWED_ORIGINS` with the final Vercel URL if needed.
