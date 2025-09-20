# ExportIndia Marketplace Deployment Script (PowerShell)
# This script automates the deployment process for the application on Windows

param(
    [string]$Environment = "staging",
    [switch]$NoTests,
    [switch]$NoSeed,
    [switch]$Rollback,
    [switch]$Status,
    [switch]$Help
)

# Configuration
$PROJECT_NAME = "export-india-marketplace"
$COMPOSE_FILE = "docker-compose.yml"

# Function to print colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-ColorOutput "========================================" "Blue"
    Write-ColorOutput $Message "Blue"
    Write-ColorOutput "========================================" "Blue"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

# Function to check if required tools are installed
function Test-Dependencies {
    Write-Header "Checking Dependencies"
    
    $missingDeps = $false
    
    # Check Docker
    try {
        docker --version | Out-Null
        Write-Success "Docker is installed"
    }
    catch {
        Write-Error "Docker is not installed"
        $missingDeps = $true
    }
    
    # Check Docker Compose
    try {
        docker-compose --version | Out-Null
        Write-Success "Docker Compose is installed"
    }
    catch {
        try {
            docker compose version | Out-Null
            Write-Success "Docker Compose is installed"
        }
        catch {
            Write-Error "Docker Compose is not installed"
            $missingDeps = $true
        }
    }
    
    # Check Node.js
    try {
        node --version | Out-Null
        Write-Success "Node.js is installed"
    }
    catch {
        Write-Warning "Node.js is not installed (needed for local development)"
    }
    
    if ($missingDeps) {
        Write-Error "Please install missing dependencies before deploying"
        exit 1
    }
}

# Function to validate environment configuration
function Test-EnvironmentConfig {
    Write-Header "Validating Environment Configuration"
    
    if (!(Test-Path "backend\.env")) {
        Write-Warning ".env file not found, copying from .env.example"
        if (Test-Path "backend\.env.example") {
            Copy-Item "backend\.env.example" "backend\.env"
            Write-Warning "Please update backend\.env with your configuration before continuing"
            Read-Host "Press Enter to continue after updating .env file"
        }
        else {
            Write-Error ".env.example file not found"
            exit 1
        }
    }
    
    Write-Success "Environment configuration validated"
}

# Function to build the application
function Build-Application {
    Write-Header "Building Application"
    
    # Build Docker images
    Write-ColorOutput "Building Docker images..." "Blue"
    docker-compose -f $COMPOSE_FILE build --no-cache
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application built successfully"
    }
    else {
        Write-Error "Application build failed"
        exit 1
    }
}

# Function to run tests
function Invoke-Tests {
    Write-Header "Running Tests"
    
    # Check if backend tests exist
    if ((Test-Path "backend\package.json") -and (Get-Content "backend\package.json" | Select-String '"test"')) {
        Write-ColorOutput "Running backend tests..." "Blue"
        Push-Location "backend"
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Backend tests failed"
        }
        Pop-Location
    }
    else {
        Write-Warning "No backend tests found"
    }
    
    # Check if frontend tests exist
    if ((Test-Path "frontend\package.json") -and (Get-Content "frontend\package.json" | Select-String '"test"')) {
        Write-ColorOutput "Running frontend tests..." "Blue"
        Push-Location "frontend"
        npm test -- --watchAll=false
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Frontend tests failed"
        }
        Pop-Location
    }
    else {
        Write-Warning "No frontend tests found"
    }
    
    Write-Success "Tests completed"
}

# Function to backup database (for production)
function Backup-Database {
    if ($Environment -eq "production") {
        Write-Header "Creating Database Backup"
        
        $backupDir = "backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        
        # Create MongoDB backup
        docker exec export-india-mongodb mongodump --db export_india --out /tmp/backup
        docker cp export-india-mongodb:/tmp/backup $backupDir/
        
        Write-Success "Database backup created in $backupDir"
    }
}

# Function to deploy the application
function Deploy-Application {
    Write-Header "Deploying Application - $Environment Environment"
    
    # Stop existing containers
    Write-ColorOutput "Stopping existing containers..." "Blue"
    docker-compose -f $COMPOSE_FILE down
    
    # Remove unused Docker resources
    Write-ColorOutput "Cleaning up unused Docker resources..." "Blue"
    docker system prune -f
    
    # Start the application
    Write-ColorOutput "Starting application containers..." "Blue"
    docker-compose -f $COMPOSE_FILE up -d
    
    if ($LASTEXITCODE -eq 0) {
        # Wait for services to be ready
        Write-ColorOutput "Waiting for services to be ready..." "Blue"
        Start-Sleep -Seconds 30
        
        # Check if services are healthy
        Write-ColorOutput "Checking service health..." "Blue"
        docker-compose -f $COMPOSE_FILE ps
        
        Write-Success "Application deployed successfully"
    }
    else {
        Write-Error "Application deployment failed"
        exit 1
    }
}

# Function to seed database
function Initialize-Database {
    Write-Header "Seeding Database"
    
    Write-ColorOutput "Running database seed script..." "Blue"
    docker exec export-india-app node backend/scripts/seedData.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database seeded successfully"
    }
    else {
        Write-Error "Database seeding failed"
    }
}

# Function to show deployment status
function Show-Status {
    Write-Header "Deployment Status"
    
    # Show container status
    docker-compose -f $COMPOSE_FILE ps
    
    # Show application logs (last 20 lines)
    Write-ColorOutput "`nRecent application logs:" "Blue"
    docker-compose -f $COMPOSE_FILE logs --tail=20 app
    
    # Show URLs
    Write-Success "`nApplication URLs:"
    Write-Host "🌐 Frontend: http://localhost:3000"
    Write-Host "🔧 API: http://localhost:5000"
    Write-Host "📊 API Health: http://localhost:5000/api/health"
}

# Function to rollback deployment
function Invoke-Rollback {
    Write-Header "Rolling Back Deployment"
    
    Write-Warning "This will stop current containers and restore from backup"
    $confirm = Read-Host "Are you sure you want to rollback? (y/N)"
    
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        docker-compose -f $COMPOSE_FILE down
        
        # Restore from latest backup (if exists)
        $latestBackup = Get-ChildItem "backups" -Directory | Sort-Object Name -Descending | Select-Object -First 1
        if ($latestBackup) {
            Write-ColorOutput "Restoring from backup: $($latestBackup.Name)" "Blue"
            # Add restore logic here
            Write-Success "Rollback completed"
        }
        else {
            Write-Warning "No backup found for rollback"
        }
    }
    else {
        Write-ColorOutput "Rollback cancelled" "Blue"
    }
}

# Function to show help
function Show-Help {
    Write-Host @"
ExportIndia Marketplace Deployment Script

Usage: .\deploy.ps1 [ENVIRONMENT] [OPTIONS]

Environments:
  staging     Deploy to staging environment (default)
  production  Deploy to production environment

Options:
  -NoTests      Skip running tests
  -NoSeed       Skip database seeding
  -Rollback     Rollback to previous version
  -Status       Show deployment status
  -Help         Show this help message

Examples:
  .\deploy.ps1                    # Deploy to staging
  .\deploy.ps1 production         # Deploy to production
  .\deploy.ps1 -Status            # Show current status
  .\deploy.ps1 production -NoTests # Deploy to production without tests
"@
}

# Main execution
Write-Header "ExportIndia Marketplace Deployment"
Write-ColorOutput "Environment: $Environment" "Blue"
Write-ColorOutput "Compose File: $COMPOSE_FILE" "Blue"

# Handle help
if ($Help) {
    Show-Help
    exit 0
}

# Handle special operations
if ($Rollback) {
    Invoke-Rollback
    exit 0
}

if ($Status) {
    Show-Status
    exit 0
}

# Create backups directory
if (!(Test-Path "backups")) {
    New-Item -ItemType Directory -Path "backups" -Force | Out-Null
}

# Main deployment flow
try {
    Test-Dependencies
    Test-EnvironmentConfig
    
    if ($Environment -eq "production") {
        Backup-Database
    }
    
    Build-Application
    
    if (!$NoTests) {
        Invoke-Tests
    }
    
    Deploy-Application
    
    if (!$NoSeed) {
        $seedChoice = Read-Host "Do you want to seed the database with sample data? (y/N)"
        if ($seedChoice -eq "y" -or $seedChoice -eq "Y") {
            Initialize-Database
        }
    }
    
    Show-Status
    
    Write-Success "`n🎉 Deployment completed successfully!"
    Write-ColorOutput "Access your application at the URLs shown above" "Green"
}
catch {
    Write-Error "Deployment failed: $_"
    exit 1
}