# JW Reports System

A comprehensive Flask-based web application for managing and tracking ministry reports for Jehovah's Witnesses congregation groups. This system allows group overseers to track publisher activities, generate monthly reports, and export data in multiple formats.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Export Features](#export-features)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)

## Overview

The JW Reports System is designed to streamline the process of collecting, managing, and reporting ministry activities for congregation groups. The application supports multiple groups (1-6), various publisher states (Regular Publisher, Auxiliary Pioneer, Continuous Auxiliary Pioneer, Regular Pioneer), and provides comprehensive reporting capabilities with Excel and PDF exports.

## Features

### Core Functionality

- **Multi-Group Management**: Manage up to 6 different congregation groups
- **Publisher Management**: 
  - Create, update, and delete publisher records
  - Assign publishers to specific groups
  - Track publisher states (Publicador, Precursor Auxiliar, Precursor Auxiliar Indefinido, Precursor Regular)
- **Monthly Activity Tracking**:
  - Log hours of ministry
  - Track participation status
  - Record Bible studies conducted
  - Add comments for each monthly report
- **Report Generation**:
  - Generate comprehensive monthly reports by group
  - View aggregated statistics by publisher state
  - Calculate totals for hours and studies
- **Export Capabilities**:
  - Export reports to Excel (.xlsx) with professional formatting
  - Export reports to PDF with styled tables and summaries
- **Search & Filter**: Real-time search functionality for finding publishers
- **Responsive UI**: Modern, user-friendly interface with intuitive navigation

## Tech Stack

### Backend
- **Flask 3.0.0**: Python web framework
- **Firebase Admin SDK 6.3.0**: Cloud Firestore database integration
- **ReportLab 4.0.7**: PDF generation library
- **XlsxWriter 3.1.9**: Excel file generation
- **python-dotenv 1.0.0**: Environment variable management

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome 6.4.0 for icons
- Responsive design with modern UI/UX

### Database
- **Google Cloud Firestore**: NoSQL cloud database

## Database Schema

### Collections

#### Publishers Collection

The main collection storing all publisher information and their monthly activity records.

**Collection Name**: `Publishers`

**Document Structure**:

```javascript
{
  name: string,              // Publisher's full name
  groupID: number,           // Group identifier (1-6)
  state: string,             // Publisher state/role
  hours: array               // Array of monthly activity records
}
```

**Publisher States (Enumerated Values)**:
- `"Publicador"` - Regular Publisher
- `"Precursor Auxiliar"` - Auxiliary Pioneer
- `"Precursor Auxiliar Indefinido"` - Continuous Auxiliary Pioneer
- `"Precursor Regular"` - Regular Pioneer

**Hours Array Structure**:

Each element in the `hours` array represents a monthly activity report:

```javascript
{
  month: number,            // Month (1-12)
  year: number,             // Year (e.g., 2024)
  hours: number,            // Hours of ministry
  Participo: boolean,       // Participation status
  estudios: number,         // Number of Bible studies conducted
  Comentario: string        // Optional comments/notes
}
```

**Example Document**:

```javascript
{
  id: "abc123xyz",
  name: "John Doe",
  groupID: 1,
  state: "Precursor Regular",
  hours: [
    {
      month: 1,
      year: 2024,
      hours: 75,
      Participo: true,
      estudios: 3,
      Comentario: "Good month with several return visits"
    },
    {
      month: 2,
      year: 2024,
      hours: 82,
      Participo: true,
      estudios: 4,
      Comentario: "Started new Bible study"
    }
  ]
}
```

**Data Types & Validation**:
- `name`: Required, non-empty string
- `groupID`: Integer between 1-6, defaults to 1
- `state`: Must be one of the four enumerated values, defaults to "Publicador"
- `hours`: Optional array, defaults to empty array `[]`
- `month`: Integer between 1-12
- `year`: Integer (4-digit year)
- `hours` (in monthly record): Non-negative number (can include decimals)
- `Participo`: Boolean value
- `estudios`: Non-negative integer
- `Comentario`: String (can be empty)

**Indexing Strategy**:
- Primary queries filter by `groupID`
- Consider creating a composite index on `groupID` for optimal query performance

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- A Google Firebase project with Firestore enabled

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd app
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
```

**macOS/Linux:**
```bash
python3 -m venv venv
```

### Step 3: Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

## Configuration

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select or create your project
3. Navigate to **Project Settings** (gear icon) > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file with your credentials

### Environment Variables

Create a `.env` file in the project root:

```env
# Firebase Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=generate-a-random-secure-secret-key-here
```

**Important Notes:**
- Keep the `\n` characters in the private key
- Change `SECRET_KEY` to a random, secure value in production
- Never commit `.env` or `key.json` to version control

### Alternative: Using key.json (Development Only)

For local development, you can place the downloaded Firebase JSON credentials as `key.json` in the project root. The application will automatically detect and use it if environment variables are not configured.

## Running the Application

### Development Mode

```bash
python app.py
```

The application will start on `http://127.0.0.1:5000`

### Production Mode

Install Gunicorn:
```bash
pip install gunicorn
```

Run with Gunicorn:
```bash
gunicorn --bind 0.0.0.0:8000 app:app
```

For production deployment, consider:
- Using a reverse proxy (Nginx, Apache)
- Enabling HTTPS
- Setting `FLASK_ENV=production` and `FLASK_DEBUG=False`
- Using a production-grade WSGI server

## Deployment

### Fly.io Deployment

This application is configured for deployment on [Fly.io](https://fly.io), a platform for running full-stack apps globally.

#### Prerequisites

1. Install the Fly CLI:
   ```bash
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Sign up and log in:
   ```bash
   fly auth signup
   # or
   fly auth login
   ```

#### Initial Setup

1. Launch the app (first time only):
   ```bash
   fly launch
   ```
   This will:
   - Create a `fly.toml` configuration file
   - Set up your app on Fly.io
   - Configure the region and resources

2. Set your Firebase environment variables as secrets:
   ```bash
   fly secrets set FIREBASE_TYPE=service_account
   fly secrets set FIREBASE_PROJECT_ID=your-project-id
   fly secrets set FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   fly secrets set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key\n-----END PRIVATE KEY-----\n"
   fly secrets set FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   fly secrets set FIREBASE_CLIENT_ID=your-client-id
   fly secrets set FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
   fly secrets set FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
   fly secrets set FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
   fly secrets set FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
   fly secrets set SECRET_KEY=your-random-secret-key
   ```

#### Manual Deployment

Deploy manually at any time:
```bash
fly deploy
```

#### Continuous Deployment with GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/fly-deploy.yml`) that automatically deploys to Fly.io when you push to the `main` branch.

**Setup Steps:**

1. Get your Fly.io API token:
   ```bash
   fly auth token
   ```

2. Add the token to your GitHub repository:
   - Go to your repository on GitHub
   - Navigate to **Settings** > **Secrets and variables** > **Actions**
   - Click **New repository secret**
   - Name: `FLY_API_TOKEN`
   - Value: (paste your token)

3. Push to `main` branch:
   ```bash
   git push origin main
   ```

The GitHub Action will automatically build and deploy your application.

#### Fly.io Configuration

The `fly.toml` file contains the deployment configuration:

- **App Name**: `jwreports`
- **Region**: `gru` (São Paulo, Brazil)
- **Port**: 8080 (internal)
- **HTTPS**: Forced
- **Auto-scaling**: Enabled (stops when inactive, starts on request)
- **Resources**: 1GB RAM, 1 shared CPU

#### Dockerfile

The application uses a multi-stage Docker build:
- Base image: `python:3.12-slim`
- Installs dependencies from `requirements.txt`
- Exposes port 8080
- Runs with Gunicorn: `gunicorn -b 0.0.0.0:8080 app:app`

#### Useful Fly.io Commands

```bash
# Check app status
fly status

# View logs
fly logs

# Open the app in browser
fly open

# SSH into the running machine
fly ssh console

# Check secrets
fly secrets list

# Scale resources
fly scale memory 512  # Set to 512MB
fly scale count 2     # Run 2 instances
```

## API Documentation

### Groups

#### Get All Groups
```http
GET /api/grupos
```

**Response:**
```json
[
  {"id": 1, "nombre": "Grupo 1"},
  {"id": 2, "nombre": "Grupo 2"},
  ...
]
```

### Publishers

#### Get All Publishers
```http
GET /api/publishers/all
```

**Response:**
```json
[
  {
    "id": "abc123",
    "name": "John Doe",
    "groupID": 1,
    "state": "Publicador",
    "hours": [...]
  },
  ...
]
```

#### Get Publishers by Group
```http
GET /api/personas/<grupo_id>
```

**Parameters:**
- `grupo_id` (path): Group ID (1-6)

**Response:**
```json
[
  {
    "id": "abc123",
    "name": "John Doe",
    "groupID": 1,
    "state": "Publicador",
    "hours": [...]
  }
]
```

#### Create Publisher
```http
POST /api/publishers
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "groupID": 1,
  "state": "Publicador",
  "hours": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Publisher creado correctamente",
  "id": "new-document-id"
}
```

#### Update Publisher (Monthly Report)
```http
PUT /api/persona/<persona_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "state": "Precursor Regular",
  "hours": {
    "month": 1,
    "year": 2024,
    "hours": 75,
    "Participo": true,
    "estudios": 3,
    "Comentario": "Good progress"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Persona actualizada correctamente"
}
```

#### Update Publisher (Admin)
```http
PUT /api/persona/admin/<persona_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "groupID": 2,
  "state": "Precursor Auxiliar"
}
```

#### Delete Publisher
```http
DELETE /api/publishers/<publisher_id>
```

**Response:**
```json
{
  "success": true,
  "message": "Publisher eliminado correctamente"
}
```

### Reports

#### Get Report Data
```http
GET /api/reporte/<grupo_id>/<mes>/<year>
```

**Parameters:**
- `grupo_id` (path): Group ID (1-6)
- `mes` (path): Month (1-12)
- `year` (path): Year (e.g., 2024)

**Response:**
```json
{
  "reporte": {
    "Publicador": [...],
    "Precursor Auxiliar": [...],
    "Precursor Auxiliar Indefinido": [...],
    "Precursor Regular": [...]
  },
  "totales": {
    "Publicador": 15,
    "Precursor Auxiliar": 120,
    ...
  },
  "totales_estudios": {
    "Precursor Auxiliar": 8,
    ...
  },
  "total_general": 450,
  "total_estudios_general": 25,
  "mes": "Enero",
  "year": 2024,
  "grupo": 1
}
```

## Export Features

### Export to PDF
```http
GET /api/export/pdf/<grupo_id>/<mes>/<year>
```

**Features:**
- Professional formatting with custom styles
- Color-coded headers and totals
- Grouped by publisher state
- Includes total hours and studies
- Automatic file naming: `informe_grupo_{id}_{month}_{year}.pdf`

### Export to Excel
```http
GET /api/export/excel/<grupo_id>/<mes>/<year>
```

**Features:**
- Multi-section spreadsheet with formatted headers
- Color-coded rows and totals
- Auto-sized columns
- Separate sections for each publisher state
- Grand totals at the bottom
- Automatic file naming: `informe_grupo_{id}_{month}_{year}.xlsx`

## Project Structure

```
app/
├── app.py                     # Main Flask application
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (not in git)
├── .gitignore                # Git ignore rules
├── key.json                  # Firebase credentials (not in git)
├── README.md                 # This file
├── Dockerfile                # Docker configuration for Fly.io
├── fly.toml                  # Fly.io deployment configuration
├── .dockerignore             # Docker ignore rules
├── .github/
│   └── workflows/
│       └── fly-deploy.yml    # GitHub Actions CI/CD workflow
├── templates/
│   └── index.html            # Main HTML template
└── static/
    ├── css/
    │   └── style.css         # Application styles
    ├── js/
    │   └── script.js         # Frontend JavaScript
    └── favicon/
        ├── favicon.ico
        ├── favicon.svg
        ├── apple-touch-icon.png
        └── site.webmanifest
```

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS:**

1. **Never commit sensitive files:**
   - `.env` - Contains Firebase credentials
   - `key.json` - Contains Firebase service account key
   - Always use `.gitignore` to exclude these files

2. **Production Security:**
   - Change `SECRET_KEY` to a strong, random value
   - Use HTTPS in production (SSL/TLS certificates)
   - Set `FLASK_DEBUG=False` and `FLASK_ENV=production`
   - Implement authentication/authorization if needed
   - Keep dependencies updated regularly

3. **Firebase Security:**
   - Configure Firestore security rules
   - Limit service account permissions
   - Monitor Firebase usage and logs
   - Rotate credentials periodically

4. **Best Practices:**
   - Use environment variables for all sensitive data
   - Implement proper error handling
   - Add rate limiting for API endpoints
   - Regular security audits and dependency updates

## License

This project is intended for use by Jehovah's Witnesses congregations for managing ministry reports.

## Support

For issues, questions, or contributions, please contact the system administrator or project maintainer.

---

**Version:** 1.1.0  
**Last Updated:** February 2026
