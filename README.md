# Syndat
A Dashboard for evaluation &amp; visualization of synthetic patient level data.

## About

SYNDAT was developed as part of TA6.4 of the [NFDI4Health Initiative](https://www.nfdi4health.de/). Main functionalities include:

- Automated, on-demand assesment of synthetic data quality & privacy metrics
- Visualization synthetic & real data relations using low-dimensional embedding plots
- Detection of possible outliers in the synthetic data population
- Visualization of distribution metrics such as violin or correlation plots
- Filtering of synthetic data & on-demand generation of synthetic data points

The Dashboard consists of a frontend module for user interaction and data visualization as well as a backend module for direct API access.

## Installation

### Using Github Docker Registry

Login to your Github Docker Account:

```bash
docker login ghcr.io -u $GITHUB_USERNAME -p $GITHUB_TOKEN
```

Run the `docker-compose` file in the root directory:

```bash
docker-compose up
```

### Building the containers from source

#### Requirements

- [NodeJS 18.x +](https://nodejs.org/de)
- [Docker Compose 2.x +](https://docs.docker.com/compose/)
- [GNU Make](https://www.gnu.org/software/make/manual/make.html)

Given all dependencies above are satisfied, both the frontend and backend can be started via `docker-compse` with a single make command using the designated Makefile in the root dir:

```bash
make up
```

### Running a local development version (without docker)

#### Requirements

- [NodeJS 16.x +](https://nodejs.org/de)
- [Python 3.x.x](https://www.python.org/downloads/)


```bash
# install python dependencies
pip install --requirement backend/requirements.txt

# start backend
cd backend && uvicorn api.routes:app --reload

# install node dependencies
cd frontend; npm install --legacy-peer-deps

# start frontend
cd frontend && npm start
```

You may alternatively start the backend and frontend servers using the make command `make run-local`, given you have all required python dependencies installed already.


