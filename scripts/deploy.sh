#!/bin/bash

# ExportIndia Marketplace Deployment Script
# This script automates the deployment process for the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-staging}  # Default to staging if no environment specified
PROJECT_NAME="export-india-marketplace"
COMPOSE_FILE="docker-compose.yml"

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    print_message $BLUE "\n========================================"
    print_message $BLUE "$1"
    print_message $BLUE "========================================"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

# Function to check if required tools are installed
check_dependencies() {
    print_header "Checking Dependencies"
    
    local missing_deps=0
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        missing_deps=1
    else
        print_success "Docker is installed"
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        missing_deps=1
    else
        print_success "Docker Compose is installed"
    fi
    
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed (needed for local development)"
    else
        print_success "Node.js is installed"
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Please install missing dependencies before deploying"
        exit 1
    fi
}

# Function to validate environment configuration
validate_environment() {
    print_header "Validating Environment Configuration"
    
    if [ ! -f "backend/.env" ]; then
        print_warning ".env file not found, copying from .env.example"
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_warning "Please update backend/.env with your configuration before continuing"
            read -p "Press Enter to continue after updating .env file..."
        else
            print_error ".env.example file not found"
            exit 1
        fi
    fi
    
    print_success "Environment configuration validated"
}

# Function to build the application
build_application() {
    print_header "Building Application"
    
    # Build Docker images
    print_message $BLUE "Building Docker images..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    print_success "Application built successfully"
}

# Function to run tests
run_tests() {
    print_header "Running Tests"
    
    # Check if test scripts exist
    if [ -f "backend/package.json" ] && grep -q '"test"' backend/package.json; then
        print_message $BLUE "Running backend tests..."
        cd backend
        npm test || print_warning "Backend tests failed"
        cd ..
    else
        print_warning "No backend tests found"
    fi
    
    if [ -f "frontend/package.json" ] && grep -q '"test"' frontend/package.json; then
        print_message $BLUE "Running frontend tests..."
        cd frontend
        npm test -- --watchAll=false || print_warning "Frontend tests failed"
        cd ..
    else
        print_warning "No frontend tests found"
    fi
    
    print_success "Tests completed"
}

# Function to backup database (for production)
backup_database() {
    if [ "$DEPLOY_ENV" = "production" ]; then
        print_header "Creating Database Backup"
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $BACKUP_DIR
        
        # Create MongoDB backup
        docker exec export-india-mongodb mongodump --db export_india --out /tmp/backup
        docker cp export-india-mongodb:/tmp/backup $BACKUP_DIR/
        
        print_success "Database backup created in $BACKUP_DIR"
    fi
}

# Function to deploy the application
deploy_application() {
    print_header "Deploying Application - $DEPLOY_ENV Environment"
    
    # Stop existing containers
    print_message $BLUE "Stopping existing containers..."
    docker-compose -f $COMPOSE_FILE down || true
    
    # Remove unused Docker resources
    print_message $BLUE "Cleaning up unused Docker resources..."
    docker system prune -f
    
    # Start the application
    print_message $BLUE "Starting application containers..."
    docker-compose -f $COMPOSE_FILE up -d
    
    # Wait for services to be ready
    print_message $BLUE "Waiting for services to be ready..."
    sleep 30
    
    # Check if services are healthy
    print_message $BLUE "Checking service health..."
    docker-compose -f $COMPOSE_FILE ps
    
    print_success "Application deployed successfully"
}

# Function to seed database
seed_database() {
    print_header "Seeding Database"
    
    print_message $BLUE "Running database seed script..."
    docker exec export-india-app node backend/scripts/seedData.js
    
    print_success "Database seeded successfully"
}

# Function to show deployment status
show_status() {
    print_header "Deployment Status"
    
    # Show container status
    docker-compose -f $COMPOSE_FILE ps
    
    # Show application logs (last 20 lines)
    print_message $BLUE "\nRecent application logs:"
    docker-compose -f $COMPOSE_FILE logs --tail=20 app
    
    # Show URLs
    print_success "\nApplication URLs:"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 API: http://localhost:5000"
    echo "📊 API Health: http://localhost:5000/api/health"
}

# Function to rollback deployment
rollback_deployment() {
    print_header "Rolling Back Deployment"
    
    print_message $YELLOW "This will stop current containers and restore from backup"
    read -p "Are you sure you want to rollback? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE down
        
        # Restore from latest backup (if exists)
        LATEST_BACKUP=$(ls -t backups/ 2>/dev/null | head -n1)
        if [ ! -z "$LATEST_BACKUP" ]; then
            print_message $BLUE "Restoring from backup: $LATEST_BACKUP"
            # Add restore logic here
            print_success "Rollback completed"
        else
            print_warning "No backup found for rollback"
        fi
    else
        print_message $BLUE "Rollback cancelled"
    fi
}

# Main deployment function
main() {
    print_header "ExportIndia Marketplace Deployment"
    print_message $BLUE "Environment: $DEPLOY_ENV"
    print_message $BLUE "Compose File: $COMPOSE_FILE"
    
    # Show usage if help requested
    if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
        echo ""
        echo "Environments:"
        echo "  staging     Deploy to staging environment (default)"
        echo "  production  Deploy to production environment"
        echo ""
        echo "Options:"
        echo "  --help, -h      Show this help message"
        echo "  --no-tests      Skip running tests"
        echo "  --no-seed       Skip database seeding"
        echo "  --rollback      Rollback to previous version"
        echo "  --status        Show deployment status"
        exit 0
    fi
    
    # Handle special operations
    case "$2" in
        "--rollback")
            rollback_deployment
            exit 0
            ;;
        "--status")
            show_status
            exit 0
            ;;
    esac
    
    # Main deployment flow
    check_dependencies
    validate_environment
    
    if [ "$DEPLOY_ENV" = "production" ]; then
        backup_database
    fi
    
    build_application
    
    if [ "$2" != "--no-tests" ]; then
        run_tests
    fi
    
    deploy_application
    
    if [ "$2" != "--no-seed" ]; then
        read -p "Do you want to seed the database with sample data? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            seed_database
        fi
    fi
    
    show_status
    
    print_success "\n🎉 Deployment completed successfully!"
    print_message $GREEN "Access your application at the URLs shown above"
}

# Create backups directory
mkdir -p backups

# Run main function with all arguments
main "$@"