# Willowbank Landscape Planning Tool

A comprehensive landscape planning application for the Willowbank property (27314 Willowbank Rd, Davis, CA). This tool helps manage landscape requirements, implementation phases, regulatory compliance, and plant selection for a nearly 1-acre property in Yolo County.

## 🏗️ Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite3
- **Infrastructure**: Docker + Docker Compose
- **Database**: SQLite with volume persistence

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/elirentz/willobank-landscape-tool.git
cd willobank-landscape-tool

# Start development environment
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Health Check: http://localhost:3001/health
```

### Production Deployment
```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Access the application
# Frontend: http://localhost
# Backend API: http://localhost:3001
```

## 📋 Features

### Current Features
- ✅ **Requirements Management**: Organize needs, wants, and nice-to-haves
- ✅ **Implementation Phases**: 4-phase development timeline
- ✅ **Regulatory Compliance**: Yolo County zoning and MWELO requirements
- ✅ **Plant Recommendations**: UC Davis All-Stars and native species
- ✅ **Budget Estimation**: Phase-by-phase cost planning
- ✅ **Data Persistence**: SQLite database with automatic backups

### Planned Features
- 🔄 **Phase Management**: Customizable timelines and task tracking
- 🔄 **Plant Database**: Comprehensive plant selection with filtering
- 🔄 **Compliance Updates**: Dynamic regulatory requirement tracking
- 🔄 **Export Features**: PDF reports and sharing capabilities
- 🔄 **File Management**: Upload site photos and documents

## 🗂️ Project Structure

```
willowbank-landscape-tool/
├── README.md
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── .gitignore
├── frontend/                   # React application
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API client
│   │   └── styles/             # CSS and styling
│   └── public/
├── backend/                    # Node.js API server
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── models/             # Database models
│   │   └── services/           # Business logic
│   └── migrations/
├── data/                       # SQLite database volume
└── docs/                       # Additional documentation
```

## 🛠️ Development Workflow

### Branch Strategy
```
main                    # Production-ready releases
├── develop            # Integration branch
├── feature/*          # Feature development
├── bugfix/*           # Bug fixes
└── hotfix/*           # Production hotfixes
```

### Adding New Features
```bash
# Create feature branch from develop
git checkout develop
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature description"
git push origin feature/new-feature-name

# Create pull request to develop
# Test integration on develop
# Merge to main when ready for production
```

## 🗃️ Database Schema

### Requirements Table
```sql
CREATE TABLE requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('needs', 'wants', 'nice-to-haves')),
  description TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Additional Tables
- `phases` - Implementation phases and timelines
- `phase_tasks` - Individual tasks within phases
- `plants` - Plant database with categories and requirements
- `compliance_requirements` - Regulatory requirements tracking
- `project_settings` - Application configuration

## 🔌 API Endpoints

### Requirements
- `GET /api/requirements` - Get all requirements (grouped by category)
- `POST /api/requirements` - Create new requirement
- `PUT /api/requirements/:id` - Update requirement
- `DELETE /api/requirements/:id` - Delete requirement
- `POST /api/requirements/reorder` - Reorder requirements within category

### Additional APIs (Planned)
- `/api/phases` - Phase management
- `/api/plants` - Plant database
- `/api/compliance` - Compliance requirements
- `/api/export` - Export functionality

## 🏡 Property-Specific Information

### Willowbank Property Details
- **Address**: 27314 Willowbank Rd, Davis, CA 95618
- **Parcel**: 069150029
- **Size**: 37,997 sq ft (0.87 acres)
- **Zoning**: Willowbank Planned Development (PD)
- **Infrastructure**: Existing irrigation system

### Regulatory Requirements
- **Jurisdiction**: Yolo County (unincorporated)
- **Water Ordinance**: MWELO compliance for projects >500 sq ft
- **Setbacks**: Property-specific PD regulations required
- **Contact**: Jeff Anderson, Principal Planner (530) 666-8043

## 🔧 Configuration

### Environment Variables

#### Development (`docker-compose.yml`)
```yaml
# Frontend
VITE_API_URL=http://localhost:3001
CHOKIDAR_USEPOLLING=true

# Backend
NODE_ENV=development
DATABASE_PATH=/app/data/willowbank.db
CORS_ORIGIN=http://localhost:3000
```

#### Production (`docker-compose.prod.yml`)
```yaml
# Frontend
VITE_API_URL=http://localhost:3001

# Backend
NODE_ENV=production
DATABASE_PATH=/app/data/willowbank.db
CORS_ORIGIN=http://localhost
```

## 📚 Documentation

### API Documentation
Detailed API documentation available at `/docs/api.md`

### Deployment Guide
Step-by-step deployment instructions at `/docs/deployment.md`

### Development Guide
Development workflow and contribution guidelines at `/docs/development.md`

## 🔒 Security

- Helmet.js for security headers
- Rate limiting on API endpoints
- CORS configuration for frontend integration
- Input validation with Joi
- Non-root Docker containers
- Health checks for container monitoring

## 📊 Monitoring and Health Checks

### Health Check Endpoints
- `GET /health` - Backend health status
- Container health checks configured for production

### Logging
- Morgan logging for HTTP requests
- Console logging for development
- Error tracking and reporting

## 🔄 Backup and Recovery

### Database Backup
```bash
# Manual backup
cp ./data/willowbank.db ./data/backups/willowbank_$(date +%Y%m%d_%H%M%S).db

# Automated backup script (add to crontab)
./scripts/backup.sh
```

### Data Recovery
```bash
# Restore from backup
cp ./data/backups/willowbank_YYYYMMDD_HHMMSS.db ./data/willowbank.db
docker-compose restart backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary for the Willowbank property landscape planning.

## 📞 Support

For issues related to:
- **Application bugs**: Create GitHub issue
- **Yolo County regulations**: Contact Jeff Anderson (530) 666-8043
- **Plant recommendations**: UC Davis Arboretum (530) 752-4880
- **Infrastructure**: Local development server administrator

---

**Built with ❤️ for sustainable landscape planning in Davis, California**

