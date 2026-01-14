# Frontend (Vite + React)

This frontend uses Vite for development/build.

## Scripts

- `npm run dev`: Start the dev server on http://localhost:3000
- `npm run build`: Build production assets into `dist/`
- `npm run preview`: Preview the production build locally
- `npm test`: Run tests (currently via CRA's test runner)

## Environment

Configure the API base URL via `.env`:

```
REACT_APP_API_BASE_URL=http://localhost:8000
```

Vite injects this value and it is used throughout the app (see Axios calls).

## Deployment

The Dockerfile serves the built `dist/` directory using Nginx. In CI, run `npm ci && npm run build` before building the image.
