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

If you want to use the cortesponding python package that supports both evaluation metrics and visualizations programatically, you can install it using:

```bash
pip install syndat
```

Documentation and Code are available from the following project:
[https://github.com/SCAI-BIO/syndat](https://github.com/SCAI-BIO/syndat)

### Docker

You can run a local installation using `docker-compse`:

```bash
docker-compose -f docker-compose.local.yaml up
```

After startup, you will find the frontend running on [localhost:3000](http://localhost:3000).

### Running a local development version

#### Requirements

- [NodeJS 16.x](https://nodejs.org/de)
- [Python 3.x.x](https://www.python.org/downloads/)

```bash
# install python dependencies
pip install --requirement backend/requirements.txt

# start backend
cd backend && uvicorn api.routes:app --reload

# install node dependencies
export NODE_OPTIONS=--openssl-legacy-provider
cd frontend; npm install --legacy-peer-deps

# start frontend
cd frontend && npm start
```

## API authentification

The following two API endpoints for batch upating data as well as batch dowloading data are secured by a basic authentification workflow:
-  /datasets/import
-  /datasets/export

The default username/password are defined in the [backend environment file](https://github.com/nfdi4health/syndat-dashboard/blob/main/backend/.env). You may change them before the application startup by adapting the corresponding system environment variables:

```bash
export SYNDAT_ADMIN_USERNAME=my_new_username
export SYNDAT_ADMIN_PASSWORD=my_new_password
```
