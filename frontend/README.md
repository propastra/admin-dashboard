# Propastra Frontend

React + Vite frontend for the Propastra Admin Dashboard.

## Setup

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`

## Environments & Building

The frontend uses environment-specific build modes.

### Staging
```bash
npm run build:staging
```
This will build the application using `.env.staging` which points to `https://staging-api.propastra.com/api`.

### Production
```bash
npm run build:production
```
This will build the application using `.env.production` which points to `https://api.propastra.com/api`.

## Technology Stack
- **Framework**: React 19
- **Build Tool**: Vite 7
- **Styling**: Vanilla CSS (Modern design)
- **State/Routing**: React Router
- **Charts**: Chart.js
