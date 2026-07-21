<p align="left">
	<picture>
		<source media="(prefers-color-scheme: dark)" srcset="frontend/public/brand/syndat_dashboard_white.svg">
		<img alt="SYNDAT Dashboard" src="frontend/public/brand/syndat_dashboard.svg">
	</picture>
</p>

<p align="left"><a href="https://doi.org/10.5281/zenodo.15399485"><img src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.15399485-blue.svg" alt="DOI"></a>&nbsp;<a href="https://github.com/nfdi4health/syndat-dashboard/releases"><img src="https://img.shields.io/github/v/release/nfdi4health/syndat-dashboard" alt="Latest Release"></a>&nbsp;<a href="https://github.com/nfdi4health/syndat-dashboard/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-CC_BY--NC--ND_4.0-lightgrey.svg?style=flat-square&logo=creative-commons&logoColor=white" alt="License: CC BY-NC-ND 4.0"></a></p>

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


# Citation

If you use **Syndat** in your research, please cite as:

```bibtex
@article{Adams_On_the_fidelity_2025,
  author  = {Adams, Tim and Birkenbihl, Colin and Otte, Karen and
             Ng, Hwei Geok and Rieling, Jonas Adrian and
             Näher, Anatol-Fiete and Sax, Ulrich and
             Prasser, Fabian and Fröhlich, Holger},
  title   = {On the fidelity versus privacy and utility trade-off of synthetic patient data},
  journal = {iScience},
  volume  = {28},
  year    = {2025},
  doi     = {10.1016/j.isci.2025.112382}
}
```
