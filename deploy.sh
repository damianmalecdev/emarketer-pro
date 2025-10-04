#!/bin/bash

# eMarketer.pro Deployment Script for Ubuntu
# Run this script on your Ubuntu server to deploy the application

set -e

echo "🚀 Starting eMarketer.pro deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
print_status "Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_warning "Node.js is already installed"
fi

# Install PostgreSQL
print_status "Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
else
    print_warning "PostgreSQL is already installed"
fi

# Setup PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE emarketer;" 2>/dev/null || print_warning "Database 'emarketer' might already exist"
sudo -u postgres psql -c "CREATE USER emarketer WITH PASSWORD 'emarketer123';" 2>/dev/null || print_warning "User 'emarketer' might already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE emarketer TO emarketer;"
sudo -u postgres psql -c "ALTER USER emarketer CREATEDB;"

# Install PM2 for process management
print_status "Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    print_warning "PM2 is already installed"
fi

# Install Nginx
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
else
    print_warning "Nginx is already installed"
fi

# Create application directory
print_status "Setting up application directory..."
APP_DIR="/var/www/emarketer.pro"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    print_status "Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    print_status "Cloning repository..."
    # Replace with your actual repository URL
    git clone https://github.com/yourusername/emarketer.pro.git $APP_DIR
    cd $APP_DIR
fi

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build application
print_status "Building application..."
npm run build

# Setup environment variables
print_status "Setting up environment variables..."
if [ ! -f "$APP_DIR/.env.local" ]; then
    cp env.example .env.local
    print_warning "Please edit .env.local with your actual configuration:"
    print_warning "- DATABASE_URL"
    print_warning "- NEXTAUTH_SECRET"
    print_warning "- OPENAI_API_KEY"
    print_warning "- NEXTAUTH_URL (your domain)"
    read -p "Press Enter after you've updated .env.local..."
fi

# Setup database
print_status "Setting up database..."
npx prisma generate
npx prisma db push

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'emarketer-pro',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx configuration
print_status "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/emarketer.pro << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/emarketer.pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL with Let's Encrypt (optional)
print_status "Setting up SSL with Let's Encrypt..."
if command -v certbot &> /dev/null; then
    sudo certbot --nginx -d your-domain.com -d www.your-domain.com
else
    print_warning "Certbot not found. Install it to enable SSL:"
    print_warning "sudo apt install certbot python3-certbot-nginx"
fi

# Setup firewall
print_status "Setting up firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create systemd service for PM2
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/emarketer-pro.service << EOF
[Unit]
Description=emarketer.pro Node.js App
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable emarketer-pro

print_status "Deployment completed successfully! 🎉"
print_status "Your application should be running at: http://your-domain.com"
print_status "PM2 status: pm2 status"
print_status "Application logs: pm2 logs emarketer-pro"
print_status "Nginx status: sudo systemctl status nginx"
print_status "Database: sudo -u postgres psql emarketer"

print_warning "Don't forget to:"
print_warning "1. Update your domain name in Nginx configuration"
print_warning "2. Configure your DNS to point to this server"
print_warning "3. Update .env.local with production values"
print_warning "4. Set up SSL certificate with Let's Encrypt"
