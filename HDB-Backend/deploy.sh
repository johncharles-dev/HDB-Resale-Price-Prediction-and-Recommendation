#!/bin/bash
# HDB Price Prediction API - EC2 Deployment Script
# Usage: ./deploy.sh [setup|deploy|start|stop|logs|status]

set -e

# Configuration
APP_NAME="hdb-backend"
APP_DIR="/opt/hdb-app"
DOCKER_IMAGE="hdb-backend:latest"
PORT=8000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Initial EC2 setup (run once on new instance)
setup() {
    log_info "Setting up EC2 instance..."

    # Update system
    sudo yum update -y || sudo apt-get update -y

    # Install Docker
    if ! command -v docker &> /dev/null; then
        log_info "Installing Docker..."
        sudo yum install -y docker || sudo apt-get install -y docker.io
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
        log_warn "Please log out and log back in for docker group changes to take effect"
    else
        log_info "Docker already installed"
    fi

    # Install Docker Compose (optional)
    if ! command -v docker-compose &> /dev/null; then
        log_info "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi

    # Install Git
    if ! command -v git &> /dev/null; then
        log_info "Installing Git..."
        sudo yum install -y git || sudo apt-get install -y git
    fi

    # Create app directory
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR

    # Clone repository (if not exists)
    if [ ! -d "$APP_DIR/.git" ]; then
        log_info "Clone your repository to $APP_DIR"
        echo "Run: git clone <your-repo-url> $APP_DIR"
    fi

    log_info "Setup complete!"
}

# Build Docker image locally
build() {
    log_info "Building Docker image..."
    cd $APP_DIR/HDB-Backend
    docker build -t $DOCKER_IMAGE .
    log_info "Build complete!"
}

# Deploy the application
deploy() {
    log_info "Deploying $APP_NAME..."

    # Pull latest code
    cd $APP_DIR
    git pull origin main

    # Build new image
    build

    # Stop existing container
    stop || true

    # Start new container
    start

    log_info "Deployment complete!"
}

# Start the container
start() {
    log_info "Starting $APP_NAME..."

    docker run -d \
        --name $APP_NAME \
        --restart unless-stopped \
        -p $PORT:8000 \
        -v $APP_DIR/HDB-Backend/app/data:/app/app/data:ro \
        -v $APP_DIR/HDB-Backend/app/models:/app/app/models:ro \
        $DOCKER_IMAGE

    # Wait for startup
    log_info "Waiting for application to start..."
    sleep 10

    # Health check
    if curl -sf http://localhost:$PORT/health > /dev/null; then
        log_info "$APP_NAME is running and healthy!"
        echo ""
        echo "API available at: http://$(curl -s ifconfig.me):$PORT"
        echo "Health check: http://$(curl -s ifconfig.me):$PORT/health"
    else
        log_error "Health check failed!"
        docker logs $APP_NAME
        exit 1
    fi
}

# Stop the container
stop() {
    log_info "Stopping $APP_NAME..."
    docker stop $APP_NAME 2>/dev/null || true
    docker rm $APP_NAME 2>/dev/null || true
    log_info "Stopped!"
}

# Restart the container
restart() {
    stop
    start
}

# View logs
logs() {
    docker logs -f $APP_NAME
}

# Check status
status() {
    if docker ps | grep -q $APP_NAME; then
        log_info "$APP_NAME is running"
        docker ps | grep $APP_NAME
        echo ""
        echo "Health check:"
        curl -s http://localhost:$PORT/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:$PORT/health
    else
        log_warn "$APP_NAME is not running"
    fi
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    docker image prune -f
    docker container prune -f
    log_info "Cleanup complete!"
}

# Show usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup    - Initial EC2 setup (run once)"
    echo "  build    - Build Docker image"
    echo "  deploy   - Pull latest code and deploy"
    echo "  start    - Start the container"
    echo "  stop     - Stop the container"
    echo "  restart  - Restart the container"
    echo "  logs     - View container logs"
    echo "  status   - Check container status"
    echo "  cleanup  - Remove old Docker images"
    echo ""
}

# Main
case "$1" in
    setup)
        setup
        ;;
    build)
        build
        ;;
    deploy)
        deploy
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    cleanup)
        cleanup
        ;;
    *)
        usage
        exit 1
        ;;
esac
