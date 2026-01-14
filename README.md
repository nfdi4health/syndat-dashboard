# Syndat
A Dashboard for evaluation &amp; visualization of synthetic patient level data.

## About

SYNDAT was developed as part of TA6.4 of the [NFDI4Health Initiative](https://www.nfdi4health.de/). Main functionalities include:

- Automated, on-demand assesment of synthetic data quality & privacy metrics
- Visualization synthetic & real data relations using low-dimensional embedding plots
- Detection of possible outliers in the synthetic data population
- Visualization of distribution metrics in the form of violin, barchart or correlation plots

The Dashboard consists of a frontend module for user interaction and data visualization as well as a backend module for direct API access.

## Installation

### Python API

If you want to use the corresponding Python package that supports both evaluation metrics and visualizations programmatically, you can install it using:

```bash
pip install syndat
```

Documentation and Code are available from the following project:
[https://github.com/SCAI-BIO/syndat](https://github.com/SCAI-BIO/syndat)

### Docker

You can run a local installation using `docker-compose`:

```bash
docker-compose -f docker-compose.local.yml up
```

After startup, you will find the frontend running on [localhost:3000](http://localhost:3000).

### Running a local development version

#### Requirements

- [Node.js 18+ LTS](https://nodejs.org/de)
- [Python 3.x.x](https://www.python.org/downloads/)

```bash
# install python dependencies
pip install --requirement backend/requirements.txt

# start backend
cd backend && uvicorn api.routes:app --reload

# install node dependencies
cd frontend; npm install

# start frontend (Vite)
cd frontend && npm run dev

# optional: production build and preview
# cd frontend && npm run build && npm run preview
```

## API authentication

The following two API endpoints for batch updating data as well as batch downloading data are secured by a basic authentication workflow:
-  /datasets/import
-  /datasets/export

The default username/password are defined in the [backend environment file](https://github.com/nfdi4health/syndat-dashboard/blob/main/backend/.env). You may change them before the application startup by adapting the corresponding system environment variables:

```bash
export SYNDAT_ADMIN_USERNAME=my_new_username
export SYNDAT_ADMIN_PASSWORD=my_new_password
```
