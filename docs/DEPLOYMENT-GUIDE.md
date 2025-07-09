# Platinum Lounge Management System - Production Deployment Guide

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or newer / CentOS 8+ / Docker environment
- **Node.js**: Version 18.x or newer
- **MongoDB**: Version 6.0 or newer
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB free space
- **Network**: Local network with static IP configuration

### Hardware Requirements
- **Server**: Dedicated machine or VM with above specifications
- **Tablets**: Touch-enabled devices for POS interface
- **Displays**: iMac or large monitors for kitchen/admin interfaces
- **Printer**: Thermal receipt printer (optional)

## Step 1: Server Setup

### Ubuntu/Debian Installation
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget gnupg2 software-properties-common

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
\`\`\`

### CentOS/RHEL Installation
\`\`\`bash
# Update system
sudo yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
\`\`\`

## Step 2: MongoDB Installation

### Ubuntu/Debian
\`\`\`bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
sudo systemctl status mongod
\`\`\`

### CentOS/RHEL
\`\`\`bash
# Create MongoDB repository file
sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo << EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF

# Install MongoDB
sudo yum install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
sudo systemctl status mongod
\`\`\`

## Step 3: MongoDB Configuration

### Secure MongoDB Installation
\`\`\`bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "SecurePassword123!",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Create application database and user
use platinum_lounge
db.createUser({
  user: "pl_user",
  pwd: "PLUser2025!",
  roles: ["readWrite"]
})

# Exit MongoDB shell
exit
\`\`\`

### Configure MongoDB Security
\`\`\`bash
# Edit MongoDB configuration
sudo nano /etc/mongod.conf

# Add/modify these settings:
security:
  authorization: enabled

net:
  port: 27017
  bindIp: 127.0.0.1,YOUR_SERVER_IP

# Restart MongoDB
sudo systemctl restart mongod
\`\`\`

## Step 4: Application Deployment

### Download and Setup Application
\`\`\`bash
# Create application directory
sudo mkdir -p /opt/platinum-lounge
sudo chown $USER:$USER /opt/platinum-lounge
cd /opt/platinum-lounge

# Clone or copy application files
# (Replace with your actual deployment method)
git clone <repository-url> .
# OR
# Copy files from development environment

# Install dependencies
npm install

# Install PM2 for process management
sudo npm install -g pm2
\`\`\`

### Environment Configuration
\`\`\`bash
# Create environment file
nano .env.local

# Add the following configuration:
MONGODB_URI=mongodb://pl_user:PLUser2025!@localhost:27017/platinum_lounge
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here
BACKUP_DIR=/opt/platinum-lounge/backups
NODE_ENV=production
PORT=3000
\`\`\`

### Create Backup Directory
\`\`\`bash
# Create backup directory
mkdir -p /opt/platinum-lounge/backups
chmod 755 /opt/platinum-lounge/backups

# Create backup script
nano /opt/platinum-lounge/backup.sh

# Add backup script content:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/platinum-lounge/backups"
mongodump --uri="mongodb://pl_user:PLUser2025!@localhost:27017/platinum_lounge" --out="$BACKUP_DIR/backup_$DATE"
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} \;

# Make script executable
chmod +x /opt/platinum-lounge/backup.sh
\`\`\`

## Step 5: Build and Start Application

### Build Application
\`\`\`bash
cd /opt/platinum-lounge

# Build the application
npm run build

# Test the application
npm start

# If successful, stop with Ctrl+C
\`\`\`

### Setup PM2 Process Manager
\`\`\`bash
# Create PM2 ecosystem file
nano ecosystem.config.js

# Add PM2 configuration:
module.exports = {
  apps: [{
    name: 'platinum-lounge',
    script: 'npm',
    args: 'start',
    cwd: '/opt/platinum-lounge',
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

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions provided by the command
\`\`\`

## Step 6: Firewall Configuration

### Ubuntu/Debian (UFW)
\`\`\`bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow application port
sudo ufw allow 3000

# Allow MongoDB (if needed for remote access)
sudo ufw allow from YOUR_NETWORK_RANGE to any port 27017

# Check status
sudo ufw status
\`\`\`

### CentOS/RHEL (firewalld)
\`\`\`bash
# Start and enable firewall
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow application port
sudo firewall-cmd --permanent --add-port=3000/tcp

# Allow MongoDB (if needed)
sudo firewall-cmd --permanent --add-port=27017/tcp

# Reload firewall
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
\`\`\`

## Step 7: Setup Automated Backups

### Create Cron Job for Backups
\`\`\`bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/platinum-lounge/backup.sh

# Add weekly full system backup (optional)
0 3 * * 0 tar -czf /opt/platinum-lounge/backups/full_backup_$(date +\%Y\%m\%d).tar.gz /opt/platinum-lounge
\`\`\`

## Step 8: SSL/TLS Setup (Optional but Recommended)

### Using Let's Encrypt with Nginx
\`\`\`bash
# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/platinum-lounge

# Add Nginx configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/platinum-lounge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
\`\`\`

## Step 9: Monitoring Setup

### Setup Log Monitoring
\`\`\`bash
# Create log directory
mkdir -p /opt/platinum-lounge/logs

# Setup log rotation
sudo nano /etc/logrotate.d/platinum-lounge

# Add logrotate configuration:
/opt/platinum-lounge/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reload platinum-lounge
    endscript
}
\`\`\`

### Setup System Monitoring
\`\`\`bash
# Install htop for system monitoring
sudo apt install -y htop

# Create monitoring script
nano /opt/platinum-lounge/monitor.sh

# Add monitoring script:
#!/bin/bash
echo "=== System Status ===" > /opt/platinum-lounge/logs/system.log
date >> /opt/platinum-lounge/logs/system.log
echo "CPU Usage:" >> /opt/platinum-lounge/logs/system.log
top -bn1 | grep "Cpu(s)" >> /opt/platinum-lounge/logs/system.log
echo "Memory Usage:" >> /opt/platinum-lounge/logs/system.log
free -h >> /opt/platinum-lounge/logs/system.log
echo "Disk Usage:" >> /opt/platinum-lounge/logs/system.log
df -h >> /opt/platinum-lounge/logs/system.log
echo "PM2 Status:" >> /opt/platinum-lounge/logs/system.log
pm2 status >> /opt/platinum-lounge/logs/system.log

chmod +x /opt/platinum-lounge/monitor.sh

# Add to crontab for hourly monitoring
crontab -e
# Add: 0 * * * * /opt/platinum-lounge/monitor.sh
\`\`\`

## Step 10: Final Verification

### Test Application Access
\`\`\`bash
# Check if application is running
pm2 status

# Test local access
curl http://localhost:3000

# Check logs
pm2 logs platinum-lounge

# Test database connection
mongosh "mongodb://pl_user:PLUser2025!@localhost:27017/platinum_lounge" --eval "db.runCommand({ping: 1})"
\`\`\`

### Network Access Test
1. Open web browser on client device
2. Navigate to `http://SERVER_IP:3000`
3. Verify login page loads
4. Test Super Admin login:
   - Username: `Elisbrown`
   - Password: `AdminPL2025$`
5. Verify forced password change prompt
6. Test all major functionalities

## Troubleshooting

### Common Issues

#### Application Won't Start
\`\`\`bash
# Check PM2 logs
pm2 logs platinum-lounge

# Check system logs
sudo journalctl -u mongod

# Verify environment variables
cat .env.local

# Check file permissions
ls -la /opt/platinum-lounge
\`\`\`

#### Database Connection Issues
\`\`\`bash
# Test MongoDB connection
mongosh "mongodb://pl_user:PLUser2025!@localhost:27017/platinum_lounge"

# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
\`\`\`

#### Network Access Issues
\`\`\`bash
# Check if port is open
sudo netstat -tlnp | grep 3000

# Check firewall status
sudo ufw status
# or
sudo firewall-cmd --list-all

# Test from server
curl http://localhost:3000
\`\`\`

### Performance Optimization

#### MongoDB Indexes
\`\`\`bash
# Connect to MongoDB
mongosh "mongodb://pl_user:PLUser2025!@localhost:27017/platinum_lounge"

# Create performance indexes
db.products.createIndex({ "nameEn": "text", "nameFr": "text", "sku": 1 })
db.users.createIndex({ "username": 1, "email": 1 })
db.orders.createIndex({ "orderNumber": 1, "createdAt": -1 })
db.login_logs.createIndex({ "timestamp": -1, "username": 1 })
\`\`\`

#### System Optimization
\`\`\`bash
# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize MongoDB
sudo nano /etc/mongod.conf
# Add:
# operationProfiling:
#   slowOpThresholdMs: 100
#   mode: slowOp
\`\`\`

## Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check application logs and system status
2. **Weekly**: Verify backups and test restore procedure
3. **Monthly**: Update system packages and security patches
4. **Quarterly**: Review and update security configurations

### Update Procedure
\`\`\`bash
# Backup current version
cp -r /opt/platinum-lounge /opt/platinum-lounge-backup-$(date +%Y%m%d)

# Stop application
pm2 stop platinum-lounge

# Update application files
# (Copy new version or pull from repository)

# Install new dependencies
npm install

# Build application
npm run build

# Start application
pm2 start platinum-lounge

# Verify functionality
curl http://localhost:3000
\`\`\`

This deployment guide ensures a robust, secure, and maintainable production environment for the Platinum Lounge Management System.
