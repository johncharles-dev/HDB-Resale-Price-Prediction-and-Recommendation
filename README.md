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
| Training   | Local machine                         |
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

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS EC2 (t3.small)                             │
│                            2 vCPU, 2GB RAM                                  │
├─────────────────────────────────┬───────────────────────────────────────────┤
│                                 │                                           │
│  ┌───────────────────────────┐  │  ┌─────────────────────────────────────┐  │
│  │     HDB-Frontend          │  │  │         HDB-Backend                 │  │
│  │     (Port 80)             │  │  │         (Port 8000)                 │  │
│  │                           │  │  │                                     │  │
│  │  React 19 + Vite 7        │  │  │  FastAPI + Uvicorn                  │  │
│  │  Tailwind CSS             │  │  │                                     │  │
│  │  nginx                    │  │  │  ┌─────────────────────────────┐    │  │
│  │                           │  │  │  │   Hybrid ML Model           │    │  │
│  │  ┌───────────────────┐    │  │  │  │   (XGBoost + Prophet)       │    │  │
│  │  │ Hdbprediction.jsx │────┼──┼──┼─▶│                             │    │  │
│  │  └───────────────────┘    │  │  │  └──────────────┬──────────────┘    │  │
│  │                           │  │  │                 │                   │  │
│  │  ┌───────────────────┐    │  │  │  ┌──────────────▼──────────────┐    │  │
│  │  │Hdbrecommendation  │────┼──┼──┼─▶│   Recommendation Engine     │    │  │
│  │  │.jsx               │    │  │  │  │   (uses same ML model)      │    │  │
│  │  └───────────────────┘    │  │  │  └─────────────────────────────┘    │  │
│  │                           │  │  │                                     │  │
│  └───────────────────────────┘  │  └─────────────────────────────────────┘  │
│                                 │                                           │
└─────────────────────────────────┴───────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React | 19.2.0 |
| | Vite | 7.2.4 |
| | Tailwind CSS | 4.1.17 |
| | nginx | alpine |
| **Backend** | FastAPI | 0.109.0 |
| | Uvicorn | 0.27.0 |
| | Python | 3.11 |
| **ML Model** | XGBoost | 3.1.2 |
| | scikit-learn | 1.4.0 |
| **Deployment** | Docker | Latest |
| | GitHub Actions | CI/CD |
| | AWS EC2 | t3.small |

### Data Flow

```
User (Browser)
    │
    ├── Address Search ──────────► OneMap API (Singapore Gov)
    │                                    │
    │◄───────── lat/lon coords ──────────┘
    │
    ├─────────────────────────────────────────────────────────────┐
    │  PREDICTION FLOW                 RECOMMENDATION FLOW        │
    │                                                             │
    ├── POST /predict ────────┐       POST /recommend ────────────┤
    │                         │              │                    │
    │                         ▼              ▼                    │
    │                   ┌───────────────────────────────────┐     │
    │                   │         FastAPI Backend           │     │
    │                   │                                   │     │
    │                   │  ┌─────────────────────────────┐  │     │
    │                   │  │   SHARED PREDICTION MODEL   │  │     │
    │                   │  │                             │  │     │
    │                   │  │   XGBoost (base price)      │  │     │
    │                   │  │          ×                  │  │     │
    │                   │  │   Prophet (trend)           │  │     │
    │                   │  │          =                  │  │     │
    │                   │  │   Final Predicted Price     │  │     │
    │                   │  │                             │  │     │
    │                   │  └─────────────────────────────┘  │     │
    │                   └───────────────────────────────────┘     │
    │                         │              │                    │
    │◄────────────────────────┴──────────────┘                    │
    │                                                             │
    ▼                                                             │
Display in React UI                                               │
```

### ML Model Architecture (Hybrid XGBoost + Prophet)

```
User Input
    │
    ▼
┌────────────────────────────────────────────────────┐
│              Feature Engineering                    │
│  16 Features:                                      │
│  - floor_area_sqm, lease_commence_year, floor_level│
│  - distance_to_mrt, school, hawker, mall, cbd      │
│  - town_code, flat_type_int, flat_model_code       │
│  - region_code, remaining_lease, month, quarter    │
└────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────┐     ┌────────────────────────┐
│   XGBoost Model    │     │   Prophet Trend        │
│   (Base Price)     │  ×  │   (Year Multiplier)    │
│                    │     │                        │
│   1.68MB model     │     │   2025: 1.000          │
│                    │     │   2026: 1.063          │
│                    │     │   2027: 1.127          │
│                    │     │   2028: 1.192          │
│                    │     │   2029: 1.252          │
│                    │     │   2030: 1.312          │
└────────────────────┘     └────────────────────────┘
    │                           │
    └───────────┬───────────────┘
                ▼
        Final Predicted Price
```

### Recommendation Engine

The recommendation system uses the **same hybrid prediction model** to score each candidate flat:

```
User Preferences (budget, towns, destinations)
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: HARD FILTERING (from 254K HDB transactions)            │
│  Filter by: budget, towns, flat types, floor area, lease        │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: PRICE PREDICTION (for each candidate)                  │
│  Calls predict_price_for_recommendation()                       │
│  Uses same XGBoost + Prophet model                              │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: MULTI-CRITERIA SCORING                                 │
│                                                                 │
│  Travel Score    35%  - Distance to work/school/parents         │
│  Value Score     25%  - Price per sqm vs other candidates       │
│  Budget Score    20%  - How close to mid-budget                 │
│  Amenity Score   15%  - MRT, school, mall, hawker proximity     │
│  Space Score      5%  - Floor area adequacy                     │
│  ───────────────────────────────────────────────────────────    │
│  Final Score    100%                                            │
└─────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: RANK & RETURN TOP 10                                   │
└─────────────────────────────────────────────────────────────────┘
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check & resource status |
| `/predict` | POST | Single-year price prediction |
| `/predict/multi-year` | POST | Multi-year trajectory (2025-2030) |
| `/recommend` | POST | Flat recommendations (uses same model) |
| `/options/towns` | GET | List of 26 towns |
| `/options/flat_types` | GET | Flat types (2-5 ROOM, EXECUTIVE) |
| `/locations/schools` | GET | Primary schools dataset |

### Data Storage (In-Memory CSV)

```
HDB-Backend/app/
├── models/
│   ├── xgb_hybrid_base.joblib (1.68MB) ─── XGBoost model
│   ├── trend_multipliers.json ─────────── Prophet multipliers
│   └── hybrid_model_features.json ─────── 16 feature names
│
└── data/
    ├── Complete_HDB_resale_dataset_2015_to_2025.csv (31.6MB, 254K rows)
    ├── mappings/
    │   ├── town_code_map.csv (26 towns)
    │   ├── flat_type_int_map.csv
    │   ├── flat_model_code_map.csv
    │   └── region_code_map.csv
    └── amenities/
        ├── Primary_school_dataset.csv
        ├── MRT_datasets.csv
        ├── Hawker_Centers_datasets.csv
        ├── Malls_datasets.csv
        └── singapore_poi.csv
```
