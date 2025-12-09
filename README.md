# HDB Resale Price Prediction & Flat Recommendation System

Democratizing property valuation for social good.

## Overview

This project aims to democratize property valuation for the Social Good by providing Singaporean homebuyers with an accurate, transparent, and accessible HDB Resale Price Prediction Tool along with a Personalized Flat Recommendation System.

With HDB flats making up over 80% of Singapore's housing stock, empowering citizens to understand fair market values and discover homes that match their lifestyle needs is a critical economic enabler. This project leverages machine learning to make housing decisions more informed, data-driven, and equitable.

## Live Demo

- **Frontend**: http://13.239.16.20
- **Backend API (Swagger Docs)**: http://13.239.16.20:8000/docs

## Installation

### Prerequisites

- Python 3.11
- XGBoost 3.1.2

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/johncharles-dev/hdb-resale-price-prediction-and-recommendation.git
   cd hdb-resale-price-prediction-and-recommendation
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run locally**
   ```bash
   uvicorn app.main:app --reload
   ```

## Docker

### Build and Run Backend

```bash
docker build -t hdb-backend ./HDB-Backend
docker run -p 8000:8000 hdb-backend
```

### Build and Run Frontend

```bash
docker build -t hdb-frontend ./HDB-Frontend
docker run -p 80:80 hdb-frontend
```

## Environment Requirements

| Requirement | Version |
|-------------|---------|
| Python      | 3.11    |
| XGBoost     | 3.1.2   |

## Hardware Used

| Purpose    | Hardware                              |
|------------|---------------------------------------|
| Training   | Local machine / SUTD AI Cluster       |
| Deployment | AWS EC2 t3.small (2 vCPU, 2GB RAM)    |

## Random Seeds

For reproducibility, the following random seed is used throughout the project:

- **random_state**: `42`

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment. The pipeline is triggered on:
- Push to `main` or `develop` branches
- Pull requests to `main`

### Pipeline Stages

1. **Test Backend**
   - Sets up Python 3.11
   - Installs dependencies
   - Runs linting with flake8
   - Executes pytest tests

2. **Build Backend Image**
   - Builds Docker image for backend
   - Pushes to GitHub Container Registry (ghcr.io)

3. **Test Frontend**
   - Sets up Node.js 20
   - Installs dependencies
   - Runs linting
   - Builds the frontend

4. **Build Frontend Image**
   - Builds Docker image for frontend
   - Pushes to GitHub Container Registry (ghcr.io)

5. **Deploy to EC2**
   - Triggered only on `main` branch
   - SSH into EC2 instance
   - Pulls latest images from GitHub Container Registry
   - Stops and removes existing containers
   - Deploys new containers with `--restart unless-stopped`
   - Runs health check on `/health` endpoint

## Monitoring Considerations

- **Latency**: API response time ~200-500ms for predictions
- **Model Drift**: Monthly retraining recommended as HDB market prices change
- **Logging**: Docker logs capture all API requests and errors
- **Health Check**: `/health` endpoint monitors model and data loading status
- **Auto-Recovery**: `--restart unless-stopped` flag ensures container restarts on failure

## Reproducing Results

```bash
# Clone repo
git clone https://github.com/johncharles-dev/HDB-Resale-Price-Prediction-and-Recommendation.git

# Run model training notebooks
cd Hybrid_Model_Building
jupyter notebook

# Run backend locally
cd ../HDB-Backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
