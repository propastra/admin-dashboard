# Propastra Admin Dashboard

Fully-featured real estate admin dashboard with separate staging and production environments.

## Project Structure

- `frontend/`: React + Vite application.
- `backend/`: Node.js + Express + Sequelize (PostgreSQL/SQLite) API.

## Environments

The project is configured for three environments: Local, Staging, and Production.

### Domain Information
- **Main Domain**: `propastra.com`
- **Frontend (Prod)**: `https://admin.propastra.com`
- **API (Prod)**: `https://api.propastra.com/api`
- **Frontend (Staging)**: `https://staging.propastra.com`
- **API (Staging)**: `https://staging-api.propastra.com/api`

## Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your .env (Local), .env.staging, or .env.production
npm start           # Local Development
npm run start:staging
npm run start:production
```

### 2. Frontend Setup
```bash
cd frontend
npm install
# Configure your .env.staging or .env.production if URLs change
npm run dev         # Local Development
npm run build:staging
npm run build:production
```

## Git Branches
- `main`: Development/Latest code.
- `staging`: Automated or manual deployment to staging environment.
- `production`: Stabilized code for the production environment.
