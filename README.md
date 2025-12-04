# Crevea Backend - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm 9+

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd d:\Crevea\crevea-server
   npm install
   ```

2. **Start infrastructure services:**
   ```bash
   npm run docker:up
   ```
   This starts PostgreSQL, Redis, Kafka, Zookeeper, and Elasticsearch.

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build shared package:**
   ```bash
   npm run build --filter=@crevea/shared
   ```

5. **Run services:**
   ```bash
   # Run all services
   npm run dev

   # Or run specific service
   npm run dev --filter=@crevea/auth
   npm run dev --filter=@crevea/shop
   ```

## 📁 Project Structure

```
crevea-server/
├── packages/shared/          ✅ Complete - Types, errors, utilities
├── services/
│   ├── auth/                 ✅ Complete - JWT, OAuth2, MFA
│   ├── shop/                 🔄 In Progress
│   ├── product/              📦 Skeleton ready
│   ├── payment/              📦 Skeleton ready
│   ├── order/                📦 Skeleton ready
│   ├── notification/         📦 Skeleton ready
│   ├── email/                📦 Skeleton ready
│   ├── admin/                📦 Skeleton ready
│   ├── promotion/            📦 Skeleton ready
│   ├── review/               📦 Skeleton ready
│   ├── file/                 📦 Skeleton ready
│   ├── search/               📦 Skeleton ready
│   └── gateway/              📦 Skeleton ready
└── docker-compose.yml        ✅ Complete

## 🔑 Key Features Implemented

### ✅ Shared Package
- **Types**: All domain models (10+ type files)
- **Errors**: Complete error hierarchy (10+ error classes)
- **Utils**: Logger, security, validation, date, response, helpers
- **Events**: Kafka event definitions
- **Middleware**: Auth, error handling, logging, rate limiting

### ✅ Authentication Service (Port 3001)
- JWT authentication with refresh tokens
- OAuth2 (Google, Facebook, Apple)
- Multi-factor authentication (TOTP)
- Session management with Redis
- Password reset with email verification
- Email verification
- Role-based access control

**Endpoints:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/verify-email` - Verify email
- `POST /auth/mfa/enable` - Enable MFA
- `POST /auth/mfa/verify` - Verify MFA token
- `GET /auth/me` - Get current user
- `GET /oauth/google` - Google OAuth
- `GET /oauth/facebook` - Facebook OAuth

### 🔄 Shop Service (Port 3002)
- Database schema created
- Infrastructure configured
- Ready for implementation

## 🛠️ Development

### Running Tests
```bash
npm run test
```

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 📊 Infrastructure

### Services Running (Docker Compose)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Kafka**: localhost:9092
- **Zookeeper**: localhost:2181
- **Elasticsearch**: localhost:9200

### Database Schema
Each service manages its own tables:
- **Auth**: users, oauth_accounts, sessions, password_reset_tokens, email_verification_tokens
- **Shop**: shops (with full schema)
- **Product**: products, inventory, variations (to be created)
- **Order**: orders, order_items, cart (to be created)
- **Payment**: payments, refunds, wallets, payouts (to be created)

## 🔐 Environment Variables

Key variables to configure in `.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crevea

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... (see .env.example for full list)
```

## 📝 Next Steps

1. **Complete Shop Service**: Add routes, controllers, services
2. **Build Product Service**: Product catalog with category-specific attributes
3. **Build Payment Service**: PayFast integration, split payments, escrow
4. **Build Order Service**: Cart, order lifecycle, shipping
5. **Build Notification Service**: WebSocket, email, SMS, push
6. **Build Email Service**: Transactional and marketing emails
7. **Build Admin Service**: Dashboard, moderation, reporting
8. **Build Promotion Service**: Discounts, flash sales, loyalty
9. **Build Review Service**: Product and shop reviews
10. **Build File Service**: Cloudflare R2, image optimization
11. **Build Search Service**: Elasticsearch integration
12. **Build API Gateway**: Request routing, service discovery

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View logs
npm run docker:logs
```

### Kafka Connection Issues
```bash
# Restart Kafka
docker-compose restart kafka zookeeper
```

## 📚 Documentation

### For Developers
- [Implementation Plan](./brain/implementation_plan.md)
- [Task Checklist](./brain/task.md)
- [Walkthrough](./brain/walkthrough.md)
- [Implementation Status](./STATUS.md)

### For Frontend Developers
- **[Frontend Documentation Hub](./FRONTEND_DOCS.md)** - Start here!
- [Complete API Routes Reference](./API_ROUTES.md)
- [Frontend Integration Guide](./FRONTEND_INTEGRATION_GUIDE.md)
- [Postman Collection](./postman_collection.json)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit PR

## 📄 License

MIT
