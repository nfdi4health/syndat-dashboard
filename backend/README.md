# Backend

FastAPI service that runs the SYNDAT evaluation pipeline and exposes the REST
API consumed by the dashboard frontend.

## Running the API

From the `backend` directory:

```bash
cd api && uvicorn routes:app --reload
```

The API listens on <http://127.0.0.1:8000>. Dataset import and export require
HTTP Basic Authentication; set `SYNDAT_ADMIN_USERNAME` and
`SYNDAT_ADMIN_PASSWORD` in `backend/.env` (see the top-level `README.md`).

## Docker

The image is built from `backend/Dockerfile` and is normally started through the
repository's `docker-compose.yml`.

## Tests

```bash
cd backend
pytest
```

## Third-party credits

License texts for bundled dependencies live in [`credits/`](credits). See
[`credits/README.md`](credits/README.md) for the index.
