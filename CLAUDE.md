# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + Vite)
```bash
cd frontend
npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
```

### Backend (Node.js + Express)
```bash
cd backend
npm run dev          # Start with nodemon (auto-restart)
npm start            # Start production server
npm test             # Run Jest tests
npm run migrate      # Run database migrations
```

### Docker Environment
```bash
# Development
docker-compose up --build     # Start both frontend and backend
docker-compose down           # Stop and remove containers

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Database Operations
```bash
# Manual backup
cp ./data/willowbank.db ./data/backups/willowbank_$(date +%Y%m%d_%H%M%S).db

# Restore from backup
cp ./data/backups/willowbank_YYYYMMDD_HHMMSS.db ./data/willowbank.db
docker-compose restart backend
```

## Architecture Overview

This is a landscape planning application for a specific property (27314 Willowbank Rd, Davis, CA) with a React frontend and Node.js backend.

### Key Components
- **Frontend**: Single-page React app with main component `WillowbankPlanner.jsx`
- **Backend**: Express API server with SQLite database
- **Database**: SQLite with models for requirements, phases, compliance, and plants
- **API Structure**: RESTful endpoints under `/api/` prefix

### Data Flow
1. React frontend makes API calls via `services/api.js`
2. Express routes in `backend/src/routes/` handle requests
3. Database operations through `models/Database.js`
4. SQLite database persisted in `./data/` volume

### Development Setup
The application runs in Docker with hot reloading:
- Frontend: http://localhost:3000 (Vite dev server)
- Backend: http://localhost:3001 (Express with nodemon)
- Health check: http://localhost:3001/health

### Environment Configuration
- Development uses `docker-compose.yml` with volume mounts for hot reloading
- Production uses `docker-compose.prod.yml` with optimized builds
- API URL configured via `VITE_API_URL` environment variable
- CORS origin configurable via `CORS_ORIGIN` environment variable

### Database Schema
Main tables: `requirements`, `phases`, `plants`, `compliance_requirements`
All tables include timestamps and the database auto-initializes on startup.

### Property-Specific Context
This tool is designed for Yolo County regulations and UC Davis plant recommendations. The codebase includes property-specific details like parcel numbers and regulatory contacts.