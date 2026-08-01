# Crevea Backend - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL and Redis running locally
- npm 9+

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd d:\Crevea\crevea-server
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
crevea-server/
├── packages/shared/          ✅ Complete - Types, errors, utilities
├── services/app/
│   ├── src/index.ts          ✅ Single application entrypoint (port 3000)
│   ├── src/database.ts       ✅ Single PostgreSQL connection and repositories
│   ├── src/redis.ts          ✅ Single Redis connection
│   └── src/modules/          ✅ Auth, shop, product, order, payment, etc.
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
└── .env                      ✅ Local configuration

## 🔑 Key Features Implemented

### ✅ Shared Package
- **Types**: All domain models (10+ type files)
- **Errors**: Complete error hierarchy (10+ error classes)
- **Utils**: Logger, security, validation, date, response, helpers
- **Events**: Kafka event definitions
- **Middleware**: Auth, error handling, logging, rate limiting

### ✅ Authentication module
- JWT authentication with refresh tokens
- OAuth2 (Google)
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

### 🔄 Shop module
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

### Local infrastructure
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- The backend itself runs as one application on **localhost:3000**.

### Database Schema
All modules use the same PostgreSQL database:
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

1. **Complete Shop module**: Add routes, controllers, services
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
12. **Split services later only when scale requires it**

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running locally
pg_isready -h localhost -p 5432
```

Redis is currently still used for sessions, carts, and the in-process event handlers, so run Redis locally until that dependency is deliberately replaced.

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
