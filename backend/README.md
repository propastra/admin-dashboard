# Propastra Backend API

Node.js Express backend for the Real Estate Admin Dashboard.

## Setup

1. Install dependencies: `npm install`
2. Configure Environment variables:
   - Create/Update `.env` for local development.
   - Use `.env.staging` for staging.
   - Use `.env.production` for production.

## Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | The port the server listens on. |
| `DB_HOST` | Database host address. |
| `DB_USER` | Database username. |
| `DB_PASS` | Database password. |
| `DB_NAME` | Database name. |
| `JWT_SECRET` | Secret key for JWT signing. |
| `FRONTEND_URL` | The URL of the frontend for CORS. |

## Available Scripts

- `npm start`: Runs the server normally.
- `npm run start:staging`: Runs the server with `NODE_ENV=staging` (loads `.env.staging`).
- `npm run start:production`: Runs the server with `NODE_ENV=production` (loads `.env.production`).
