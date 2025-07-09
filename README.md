# Platinum Lounge Restaurant Management System

A comprehensive restaurant management solution built with Next.js, featuring POS, inventory management, staff management, kitchen operations, and advanced analytics.

## 🚀 Features

- **Point of Sale (POS)** - Complete order taking and transaction processing
- **Inventory Management** - Product catalog, stock tracking, and supplier management
- **Staff Management** - Employee records, roles, and activity tracking
- **Kitchen Management** - Order tracking and kitchen display system
- **Table Management** - Visual table layout and reservation system
- **Analytics & Reports** - Comprehensive business intelligence
- **Multi-language Support** - English and French localization
- **Security** - Role-based access control and data encryption
- **Performance** - Optimized for speed with caching and search optimization

## 📋 Requirements

- Node.js 18.0 or higher
- MongoDB 5.0 or higher
- npm or yarn package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🛠️ Installation

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-org/platinum-lounge.git
cd platinum-lounge
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Environment Setup

Create a `.env.local` file in the root directory:

\`\`\`env
# Database
MONGODB_URI=mongodb://localhost:27017/platinum-lounge

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Security
ENCRYPTION_KEY=your-32-character-encryption-key

# Backup
BACKUP_DIR=./backups

# Optional: External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
\`\`\`

### 4. Database Setup

#### Option A: Local MongoDB Installation

1. Install MongoDB Community Edition
2. Start MongoDB service:
   \`\`\`bash
   # On macOS with Homebrew
   brew services start mongodb-community
   
   # On Ubuntu/Debian
   sudo systemctl start mongod
   
   # On Windows
   net start MongoDB
   \`\`\`

#### Option B: Docker MongoDB

\`\`\`bash
docker run -d \
  --name platinum-lounge-db \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:5.0
\`\`\`

### 5. Initialize Database

\`\`\`bash
npm run db:init
\`\`\`

This will create the initial database structure and Super Admin account:
- **Username**: admin
- **Password**: admin123
- **Role**: Super Admin

⚠️ **Important**: Change the default password immediately after first login!

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose

1. Create `docker-compose.yml`:

\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/platinum-lounge
      - JWT_SECRET=your-jwt-secret
      - ENCRYPTION_KEY=your-encryption-key
    depends_on:
      - mongo
    volumes:
      - ./backups:/app/backups

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
\`\`\`

2. Deploy:

\`\`\`bash
docker-compose up -d
\`\`\`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `ENCRYPTION_KEY` | AES-256 encryption key | Yes | - |
| `BACKUP_DIR` | Backup storage directory | No | `./backups` |
| `NODE_ENV` | Environment mode | No | `development` |

### Security Configuration

The system includes several security features:

- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, numbers, and special characters
- **Rate Limiting**: 100 requests per minute per IP
- **Session Timeout**: 24 hours (configurable)
- **Data Encryption**: AES-256 for sensitive data
- **Security Headers**: CSRF, XSS, and clickjacking protection

## 📊 Database Schema

### Collections

- `users` - Staff accounts and authentication
- `products` - Inventory items and pricing
- `categories` - Product categorization
- `suppliers` - Vendor information
- `tables` - Restaurant table configuration
- `orders` - Customer orders and transactions
- `payments` - Payment records
- `stock_movements` - Inventory tracking
- `activity_logs` - System audit trail

## 🧪 Testing

### Run Tests

\`\`\`bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
\`\`\`

### Test Data

Load sample data for testing:

\`\`\`bash
npm run db:seed
\`\`\`

## 📈 Performance Optimization

### Caching Strategy

- **Application Cache**: LRU cache with 5-minute TTL
- **Database Queries**: Indexed collections for fast lookups
- **Static Assets**: CDN-ready with proper headers
- **Search**: Debounced with sub-millisecond response times

### Monitoring

Access system metrics at `/dashboard/system` (Super Admin only):

- Memory usage and performance metrics
- Database connection status
- Cache hit/miss ratios
- Security event logs

## 🔒 Security Best Practices

### Authentication

1. Change default admin password immediately
2. Use strong passwords for all accounts
3. Enable two-factor authentication (if configured)
4. Regular password rotation policy

### Data Protection

1. Regular database backups (automated daily at 2 AM)
2. Encrypted sensitive data at rest
3. Secure API endpoints with JWT tokens
4. Input validation and sanitization

### Network Security

1. Use HTTPS in production
2. Configure firewall rules
3. Regular security updates
4. Monitor access logs

## 🚀 Production Deployment

### Linux Server Setup

1. **System Requirements**:
   \`\`\`bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nodejs npm mongodb-server nginx
   
   # CentOS/RHEL
   sudo yum install nodejs npm mongodb-server nginx
   \`\`\`

2. **Application Setup**:
   \`\`\`bash
   # Clone and build
   git clone https://github.com/your-org/platinum-lounge.git
   cd platinum-lounge
   npm install
   npm run build
   
   # Create systemd service
   sudo cp scripts/platinum-lounge.service /etc/systemd/system/
   sudo systemctl enable platinum-lounge
   sudo systemctl start platinum-lounge
   \`\`\`

3. **Nginx Configuration**:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   \`\`\`

### SSL Certificate

\`\`\`bash
# Using Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

## 📱 Mobile Optimization

The application is fully responsive and optimized for:

- **Phones**: 6.7" and smaller screens
- **Tablets**: 7" to 12" screens
- **Desktop**: 13" to 27" screens

### Touch Optimization

- Minimum 44px touch targets
- Swipe gestures for navigation
- Optimized keyboard inputs
- Fast tap responses

## 🌍 Localization

### Supported Languages

- English (en)
- French (fr)

### Adding New Languages

1. Create translation file: `lib/translations/[locale].json`
2. Add language option in `components/language-switcher.tsx`
3. Update `lib/i18n.ts` configuration

## 🔧 Troubleshooting

See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for common issues and solutions.

## 📚 API Documentation

API endpoints documentation available at `/api/docs` when running in development mode.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/platinum-lounge/issues)
- **Email**: support@platinumlounge.com
- **Phone**: +1 (555) 123-4567

## 🔄 Version History

- **v1.0.0** - Initial release with core POS functionality
- **v1.1.0** - Added inventory management
- **v1.2.0** - Staff management and reporting
- **v1.3.0** - Kitchen management system
- **v1.4.0** - Advanced table management
- **v1.5.0** - Analytics and reporting dashboard
- **v1.6.0** - Performance optimizations and security enhancements
- **v1.7.0** - Complete documentation and support system
