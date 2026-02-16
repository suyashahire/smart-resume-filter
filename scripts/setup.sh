#!/bin/bash

# =============================================================================
# HireQ - Quick Setup Script
# =============================================================================
# This script helps you set up HireQ for local development or production.
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh [dev|prod|docker]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Header
echo ""
echo "=================================================="
echo "   HireQ - AI-Powered Recruitment Platform"
echo "   Setup Script"
echo "=================================================="
echo ""

# Determine setup mode
MODE=${1:-dev}
print_status "Setup mode: $MODE"

# =============================================================================
# Development Setup
# =============================================================================
if [ "$MODE" == "dev" ]; then
    print_status "Starting development setup..."
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists python3; then
        print_error "Python 3 is not installed. Please install Python 3.10 or later."
        exit 1
    fi
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    print_success "All prerequisites are installed."
    
    # Setup Backend
    print_status "Setting up backend..."
    cd backend
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    print_status "Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Download spaCy model
    print_status "Downloading spaCy NLP model..."
    python -m spacy download en_core_web_sm
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file from example..."
        cp .env.example .env
        print_warning "Please edit backend/.env with your configuration."
    fi
    
    # Create upload directories
    mkdir -p uploads/resumes uploads/interviews uploads/reports
    
    cd ..
    print_success "Backend setup complete!"
    
    # Setup Frontend
    print_status "Setting up frontend..."
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm install
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        print_status "Creating .env.local file..."
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
        print_warning "Please edit .env.local if your backend is on a different URL."
    fi
    
    print_success "Frontend setup complete!"
    
    # Print next steps
    echo ""
    echo "=================================================="
    echo "   Setup Complete!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Start MongoDB (if not running):"
    echo "   ${BLUE}mongod --dbpath /path/to/data${NC}"
    echo ""
    echo "2. Start the backend (in one terminal):"
    echo "   ${BLUE}cd backend && source venv/bin/activate && uvicorn app.main:app --reload${NC}"
    echo ""
    echo "3. Start the frontend (in another terminal):"
    echo "   ${BLUE}npm run dev${NC}"
    echo ""
    echo "4. Open your browser to:"
    echo "   ${GREEN}http://localhost:3000${NC}"
    echo ""

# =============================================================================
# Docker Setup
# =============================================================================
elif [ "$MODE" == "docker" ]; then
    print_status "Starting Docker setup..."
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please install Docker Compose."
        exit 1
    fi
    
    # Create .env file for Docker
    if [ ! -f ".env" ]; then
        print_status "Creating .env file for Docker..."
        cat > .env << EOF
# MongoDB
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=changeme_strong_password

# Backend
JWT_SECRET_KEY=$(openssl rand -hex 32)
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=

# Email (optional)
RESEND_API_KEY=
FROM_EMAIL=noreply@yourdomain.com

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
        print_warning "Please edit .env with your configuration (especially MongoDB password)."
    fi
    
    # Build and start containers
    print_status "Building Docker containers..."
    docker-compose build
    
    print_status "Starting Docker containers..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "Docker setup complete!"
    else
        print_error "Some services failed to start. Check logs with: docker-compose logs"
        exit 1
    fi
    
    echo ""
    echo "=================================================="
    echo "   Docker Setup Complete!"
    echo "=================================================="
    echo ""
    echo "Services running:"
    echo "  - Frontend:  ${GREEN}http://localhost:3000${NC}"
    echo "  - Backend:   ${GREEN}http://localhost:8000${NC}"
    echo "  - MongoDB:   ${GREEN}localhost:27017${NC}"
    echo "  - Redis:     ${GREEN}localhost:6379${NC}"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:        ${BLUE}docker-compose logs -f${NC}"
    echo "  - Stop services:    ${BLUE}docker-compose down${NC}"
    echo "  - Restart service:  ${BLUE}docker-compose restart backend${NC}"
    echo ""

# =============================================================================
# Production Setup
# =============================================================================
elif [ "$MODE" == "prod" ]; then
    print_status "Starting production setup..."
    
    echo ""
    echo "For production deployment, please follow the detailed guide:"
    echo "  ${BLUE}docs/DEPLOYMENT_GUIDE.md${NC}"
    echo ""
    echo "Quick options:"
    echo ""
    echo "1. ${GREEN}Vercel + Railway (Recommended)${NC}"
    echo "   - Frontend: Deploy to Vercel"
    echo "   - Backend: Deploy to Railway"
    echo "   - Database: MongoDB Atlas (free tier available)"
    echo ""
    echo "2. ${GREEN}Docker + VPS${NC}"
    echo "   - Run: docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
    echo "   - Configure Traefik for SSL"
    echo ""
    echo "3. ${GREEN}AWS/GCP/Azure${NC}"
    echo "   - Use managed services for database and file storage"
    echo "   - Deploy containers to ECS/Cloud Run/Container Apps"
    echo ""

else
    print_error "Unknown mode: $MODE"
    echo "Usage: ./scripts/setup.sh [dev|prod|docker]"
    exit 1
fi
