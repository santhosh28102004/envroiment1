# Frontend Deployment

## Local development

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL`.
3. Run `npm install`.
4. Run `npm run dev`.

For local development, `VITE_API_BASE_URL=/api` works with the Vite proxy in `vite.config.js`.

## Vercel

1. Import the repo in Vercel.
2. Set the root directory to `frontend`.
3. Set build command to `npm run build`.
4. Set output directory to `dist`.
5. Add `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`.

`vercel.json` rewrites all routes to `index.html`, so React Router works on refresh and direct links.

## Notes

- The frontend expects the backend API under the configured base URL.
- If your Render URL changes, update `VITE_API_BASE_URL` in Vercel and redeploy.
