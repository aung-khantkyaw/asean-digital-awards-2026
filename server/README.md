# Myanmar Explorer API Server

Backend API for the Myanmar Explorer application - a geospatial routing and navigation system.

## Quick Start

### Development
```bash
# Windows
dev.bat

# Linux/Mac
chmod +x dev.sh
./dev.sh
```

### Production
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

## Environment Setup

Create a `.env` file with:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
ORIGIN=http://localhost:5173
FLASK_ENV=development
PORT=4000
```

## Commands

| Command | Description |
|---------|-------------|
| `dev.bat` / `dev.sh` | Start development server with hot reload |
| `start.bat` / `start.sh` | Start production server with Gunicorn |
| `python app.py` | Run directly (development only) |
| `gunicorn -c gunicorn.conf.py app:app` | Run production server |

## Project Structure

```
server/
├── app.py                    # Main application
├── gunicorn.conf.py         # Production server configuration
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (create this)
├── dev.bat / dev.sh        # Development startup scripts
├── start.bat / start.sh    # Production startup scripts
├── uploads/                 # Uploaded images
└── migrations/              # Database migrations
```

## Tech Stack

- **Framework**: Flask 3.0+
- **WSGI Server**: Gunicorn (production)
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT (Flask-JWT-Extended)
- **CORS**: Flask-CORS
- **Geospatial**: GeoPy, PostGIS

## API Documentation

See [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md) for full deployment guide.

## Development

1. Install dependencies: `pip install -r requirements.txt`
2. Set up database (see migrations/)
3. Configure `.env` file
4. Run: `python app.py`

## Production Deployment

See [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md) for complete production deployment instructions.
