# 📚 Frontend Developer Documentation

Welcome to the Crevea API documentation! This guide will help you integrate the frontend with our microservices backend.

## 📖 Documentation Files

### 1. **[API_ROUTES.md](./API_ROUTES.md)** - Complete API Reference
The comprehensive API documentation covering all endpoints across all services.

**What's inside:**
- ✅ All available endpoints with detailed request/response schemas
- ✅ Authentication requirements for each endpoint
- ✅ Query parameters and filters
- ✅ Error codes and handling
- ✅ Permission matrix
- ✅ Rate limiting information
- ✅ Example requests and responses

**Use this when:** You need to know the exact structure of API requests/responses.

---

### 2. **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** - Quick Start Guide
Practical examples and code snippets for common integration patterns.

**What's inside:**
- ✅ Authentication flow implementation
- ✅ Common workflows (cart, checkout, orders, etc.)
- ✅ API client setup with Axios
- ✅ TypeScript type definitions
- ✅ Best practices (error handling, loading states, pagination)
- ✅ WebSocket integration for real-time notifications

**Use this when:** You're implementing specific features and need working code examples.

---

### 3. **[postman_collection.json](./postman_collection.json)** - Postman Collection
Ready-to-import Postman collection for testing all API endpoints.

**How to use:**
1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `postman_collection.json`
4. Start testing endpoints!

**Features:**
- ✅ Pre-configured requests for all services
- ✅ Environment variables for base URLs
- ✅ Automatic token management (saves tokens after login)
- ✅ Example request bodies

---

## 🚀 Quick Start

### Step 1: Start the Backend Services

```bash
# Start infrastructure (PostgreSQL, Redis, Kafka, etc.)
npm run docker:up

# Build shared package
npm run build --filter=@crevea/shared

# Run all services
npm run dev
```

**Services will be available at:**
- Auth Service: `http://localhost:3000`
- Shop Service: `http://localhost:3000`
- Product Service: `http://localhost:3000`
- Order/Cart Service: `http://localhost:3000`
- Payment Service: `http://localhost:3000`
- Notification Service: `http://localhost:3000`
- Review Service: `http://localhost:3000`

### Step 2: Test the API

**Option A: Using Postman**
1. Import `postman_collection.json`
2. Register a new user
3. Login (tokens will be saved automatically)
4. Test other endpoints

**Option B: Using curl**
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"John","lastName":"Doe","role":"CUSTOMER"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Step 3: Integrate with Frontend

See [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) for detailed code examples.

---

## 🔑 Key Concepts

### Authentication Flow

```
1. User registers/logs in
   ↓
2. Backend returns accessToken + refreshToken
   ↓
3. Store tokens (localStorage/cookies)
   ↓
4. Include accessToken in Authorization header for protected requests
   ↓
5. When accessToken expires (401 error), use refreshToken to get new tokens
   ↓
6. If refresh fails, redirect to login
```

### Service Architecture

The backend uses a **microservices architecture**:

```
┌─────────────────┐
│  Frontend App   │
└────────┬────────┘
         │
    ┌────┴────┐
    │ API Calls│
    └────┬────┘
         │
    ┌────┴──────────────────────────────────┐
    │                                        │
┌───▼────┐  ┌──────┐  ┌─────────┐  ┌──────┐
│  Auth  │  │ Shop │  │ Product │  │ Order│ ...
│ :3001  │  │:3002 │  │  :3003  │  │:3004 │
└────────┘  └──────┘  └─────────┘  └──────┘
```

Each service is independent and has its own:
- Database tables
- Business logic
- API endpoints

### User Roles & Permissions

| Role | Can Do |
|------|--------|
| **CUSTOMER** | Browse products, add to cart, place orders, write reviews |
| **VENDOR** | Everything CUSTOMER can do + Create/manage shops and products |
| **EXECUTIVE** | Platform operations, moderation, reporting, and vendor approvals |

---

## 📋 Common Tasks

### Task: Implement User Registration

1. **Read:** [API_ROUTES.md](./API_ROUTES.md#1-register-user) - Register endpoint
2. **Code:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md#1-user-registration--login) - Implementation example
3. **Test:** Use Postman collection → Auth Service → Register

### Task: Build Shopping Cart

1. **Read:** [API_ROUTES.md](./API_ROUTES.md#cart-service-port-3004) - Cart endpoints
2. **Code:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md#shopping-cart-flow) - Cart workflow
3. **Test:** Use Postman collection → Cart Service

### Task: Display Product Listings

1. **Read:** [API_ROUTES.md](./API_ROUTES.md#5-list-products) - List products endpoint
2. **Code:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md#product-listing--search) - Product listing
3. **Test:** Use Postman collection → Product Service → List Products

### Task: Implement Real-time Notifications

1. **Read:** [API_ROUTES.md](./API_ROUTES.md#4-websocket-connection) - WebSocket endpoint
2. **Code:** [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md#notifications) - WebSocket integration
3. **Test:** Connect to `ws://localhost:3000/notification/ws`

---

## 🛠️ Development Tips

### Environment Variables

Create a `.env` file in your frontend project:

```env
VITE_API_AUTH_URL=http://localhost:3000
VITE_API_SHOP_URL=http://localhost:3000
VITE_API_PRODUCT_URL=http://localhost:3000
VITE_API_ORDER_URL=http://localhost:3000
VITE_API_PAYMENT_URL=http://localhost:3000
VITE_API_NOTIFICATION_URL=http://localhost:3000
VITE_API_REVIEW_URL=http://localhost:3000
```

### TypeScript Types

All TypeScript types are available in the shared package. You can copy them from:
- `packages/shared/src/types/user.types.ts`
- `packages/shared/src/types/product.types.ts`
- `packages/shared/src/types/order.types.ts`
- etc.

Or see examples in [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md#typescript-types).

### Error Handling

Always handle these error codes:
- `VALIDATION_ERROR` (400) - Show field-specific errors
- `AUTHENTICATION_ERROR` (401) - Redirect to login
- `AUTHORIZATION_ERROR` (403) - Show permission denied
- `NOT_FOUND` (404) - Show not found page
- `RATE_LIMIT_ERROR` (429) - Show "too many requests" message

See [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md#1-error-handling) for implementation.

---

## 📞 Support & Resources

### Documentation
- **Main README**: [README.md](./README.md) - Project overview and setup
- **API Routes**: [API_ROUTES.md](./API_ROUTES.md) - Complete API reference
- **Integration Guide**: [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) - Code examples
- **Status**: [STATUS.md](./STATUS.md) - Implementation status

### Testing Tools
- **Postman Collection**: [postman_collection.json](./postman_collection.json)
- **Health Checks**: `http://localhost:300X/health` (where X is service port)

### Need Help?
1. Check the documentation files above
2. Test endpoints using Postman collection
3. Review code examples in the integration guide
4. Contact the backend team

---

## 🎯 Implementation Checklist

Use this checklist when building your frontend:

### Authentication
- [ ] User registration
- [ ] User login
- [ ] OAuth (Google)
- [ ] Token refresh mechanism
- [ ] Logout
- [ ] Password reset flow
- [ ] Email verification
- [ ] MFA (optional)

### User Features
- [ ] Product browsing and search
- [ ] Product details page
- [ ] Shopping cart
- [ ] Checkout flow
- [ ] Order history
- [ ] Order tracking
- [ ] Write reviews
- [ ] Notifications (real-time)

### Seller Features
- [ ] Create/manage shop
- [ ] Create/manage products
- [ ] Inventory management
- [ ] Shop analytics
- [ ] Order management
- [ ] Shop verification

### Admin Features (if applicable)
- [ ] User management
- [ ] Shop moderation
- [ ] Review moderation
- [ ] Reports and analytics

---

## 🔄 API Versioning

Current API version: **v1.0.0**

All endpoints are currently unversioned. When we introduce breaking changes, we'll add version prefixes like `/v2/auth/login`.

---

## 📊 Rate Limits

Be aware of rate limits:
- **Default**: 100 requests/minute per IP
- **Auth endpoints**: 10 requests/minute per IP
- **Payment endpoints**: 20 requests/minute per user

Response headers will include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701691200
```

---

## 🚦 Service Status

Check service health:
```bash
curl http://localhost:3000/health  # Auth
curl http://localhost:3000/health  # Shop
curl http://localhost:3000/health  # Product
# etc.
```

Response:
```json
{
  "status": "ok",
  "service": "auth",
  "timestamp": "2025-12-04T10:00:00Z"
}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
- All prices are in decimal format (e.g., 49.99)
- File uploads should be done through the File Service (to be implemented)
- WebSocket connections require authentication
- CORS is configured to allow requests from `FRONTEND_URL` environment variable

---

**Happy coding! 🚀**

For detailed information, refer to the specific documentation files linked above.
