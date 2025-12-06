# Crevea API Routes Documentation

> **Base URL**: `http://localhost:3001` (Auth Service), `http://localhost:3002` (Shop Service), etc.
>
> **Version**: 1.0.0
>
> **Last Updated**: 2025-12-04

## Table of Contents

- [Authentication](#authentication)
- [Auth Service (Port 3001)](#auth-service-port-3001)
  - [Authentication Endpoints](#authentication-endpoints)
  - [OAuth Endpoints](#oauth-endpoints)
  - [Multi-Factor Authentication](#multi-factor-authentication)
- [Shop Service (Port 3002)](#shop-service-port-3002)
- [Product Service (Port 3003)](#product-service-port-3003)
- [Order Service (Port 3004)](#order-service-port-3004)
- [Cart Service (Port 3004)](#cart-service-port-3004)
- [Payment Service (Port 3005)](#payment-service-port-3005)
- [Review Service (Port 3008)](#review-service-port-3008)
- [Notification Service (Port 3006)](#notification-service-port-3006)
- [Admin Service (Port 3009)](#admin-service-port-3009)
- [Promotion Service (Port 3010)](#promotion-service-port-3010)
- [Common Response Formats](#common-response-formats)
- [Error Codes](#error-codes)

---

## Authentication

### Authorization Header

For protected endpoints, include the JWT access token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### User Roles

- `CUSTOMER` - Regular buyers
- `SELLER` - Shop owners who can sell products
- `ADMIN` - Platform administrators

### Permissions

Different roles have different permissions. See the [Permission Matrix](#permission-matrix) section.

---

## Auth Service (Port 3001)

Base URL: `http://localhost:3001`

### Authentication Endpoints

#### 1. Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**

```json
{
  "email": "ali.hassam1@gmail.com",
  "password": "Hello@1234",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}
```

**Validation Rules:**

- `email`: Valid email format
- `password`: Min 8 characters, must contain uppercase, lowercase, number, and special character
- `firstName`: 1-100 characters
- `lastName`: 1-100 characters
- `role`: Either `CUSTOMER` or `SELLER` (default: `CUSTOMER`)

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "ali.hassam1@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "status": "PENDING_VERIFICATION",
      "emailVerified": false,
      "createdAt": "2025-12-04T10:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 2. Login

**POST** `/api/auth/login`

Authenticate user and receive tokens.

**Request Body:**

```json
{
  "email": "ali.hassam1@gmail.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "ali.hassam1@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "emailVerified": true,
      "mfaEnabled": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** If MFA is enabled, the response will include `requiresMFA: true` and you'll need to call `/api/auth/mfa/verify`.

---

#### 3. Refresh Token

**POST** `/api/auth/refresh`

Get a new access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 4. Logout

**POST** `/api/auth/logout`

🔒 **Requires Authentication**

Invalidate current session.

**Response (204 No Content)**

---

#### 5. Forgot Password

**POST** `/api/auth/forgot-password`

Request password reset email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### 6. Reset Password

**POST** `/api/auth/reset-password`

Reset password using token from email.

**Request Body:**

```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

#### 7. Verify Email

**POST** `/api/auth/verify-email`

Verify email address using token.

**Request Body:**

```json
{
  "token": "verification_token_from_email"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

#### 8. Get Current User

**GET** `/api/auth/me`

🔒 **Requires Authentication**

Get current authenticated user details.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "ali.hassam1@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "status": "ACTIVE",
    "emailVerified": true,
    "phoneVerified": false,
    "mfaEnabled": false,
    "avatar": "https://example.com/avatar.jpg",
    "createdAt": "2025-12-04T10:00:00Z",
    "updatedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

### OAuth Endpoints

#### 1. Google OAuth

**GET** `/api/oauth/google`

Redirect to Google OAuth consent screen.

**Response:** Redirects to Google

---

**GET** `/api/oauth/google/callback`

Google OAuth callback (handled automatically).

**Query Parameters:**

- `code`: Authorization code from Google

**Response:** Redirects to frontend with tokens:

```
{FRONTEND_URL}/api/auth/callback?accessToken={token}&refreshToken={token}
```

---

#### 2. Facebook OAuth

**GET** `/api/oauth/facebook`

Redirect to Facebook OAuth consent screen.

---

**GET** `/api/oauth/facebook/callback`

Facebook OAuth callback.

---

#### 3. Apple OAuth

**GET** `/api/oauth/apple`

Redirect to Apple OAuth consent screen.

---

**POST** `/api/oauth/apple/callback`

Apple OAuth callback.

---

### Multi-Factor Authentication

#### 1. Enable MFA

**POST** `/api/auth/mfa/enable`

🔒 **Requires Authentication**

Enable two-factor authentication.

**Request Body:**

```json
{
  "password": "current_password"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**Note:** Display the QR code to the user to scan with their authenticator app.

---

#### 2. Verify MFA

**POST** `/api/auth/mfa/verify`

🔒 **Requires Authentication**

Verify MFA token during login or setup.

**Request Body:**

```json
{
  "token": "123456"
}
```

**Validation:**

- `token`: Exactly 6 digits

**Response (200 OK):**

```json
{
  "success": true,
  "message": "MFA verified successfully"
}
```

---

#### 3. Disable MFA

**POST** `/api/auth/mfa/disable`

🔒 **Requires Authentication**

Disable two-factor authentication.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "MFA disabled successfully"
}
```

---

## Shop Service (Port 3002)

Base URL: `http://localhost:3002`

### Shop Endpoints

#### 1. Create Shop

**POST** `/api/shops`

🔒 **Requires Authentication** | **Role:** SELLER

Create a new shop.

**Request Body:**

```json
{
  "name": "Handmade Crafts",
  "description": "Beautiful handmade crafts and art",
  "category": "HANDCRAFT",
  "logo": "https://example.com/logo.jpg",
  "banner": "https://example.com/banner.jpg",
  "contactEmail": "shop@example.com",
  "contactPhone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001"
  },
  "socialLinks": {
    "facebook": "https://facebook.com/myshop",
    "instagram": "https://instagram.com/myshop",
    "twitter": "https://twitter.com/myshop",
    "website": "https://myshop.com"
  }
}
```

**Categories:**

- `CROCHET`
- `ART`
- `PAINTING`
- `HANDCRAFT`

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Handmade Crafts",
    "slug": "handmade-crafts",
    "ownerId": "uuid",
    "category": "HANDCRAFT",
    "status": "PENDING",
    "verificationStatus": "UNVERIFIED",
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 2. Get Shop

**GET** `/api/shops/:id`

Get shop details by ID.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Handmade Crafts",
    "slug": "handmade-crafts",
    "description": "Beautiful handmade crafts",
    "category": "HANDCRAFT",
    "logo": "https://example.com/logo.jpg",
    "banner": "https://example.com/banner.jpg",
    "status": "ACTIVE",
    "verificationStatus": "VERIFIED",
    "rating": 4.8,
    "totalReviews": 150,
    "totalProducts": 45,
    "totalSales": 1250,
    "contactEmail": "shop@example.com",
    "contactPhone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postalCode": "10001"
    },
    "socialLinks": {
      "facebook": "https://facebook.com/myshop",
      "instagram": "https://instagram.com/myshop"
    },
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 3. Update Shop

**PUT** `/api/shops/:id`

🔒 **Requires Authentication** | **Permission:** SHOP_WRITE

Update shop details.

**Request Body:** (All fields optional)

```json
{
  "name": "Updated Shop Name",
  "description": "Updated description",
  "logo": "https://example.com/new-logo.jpg"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Shop Name",
    ...
  }
}
```

---

#### 4. Delete Shop

**DELETE** `/api/shops/:id`

🔒 **Requires Authentication** | **Permission:** SHOP_DELETE

Delete a shop.

**Response (204 No Content)**

---

#### 5. List Shops

**GET** `/api/shops`

Get list of shops with pagination and filters.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `category` (optional): Filter by category
- `status` (optional): Filter by status
- `search` (optional): Search by name

**Example:**

```
GET /api/shops?page=1&limit=20&category=HANDCRAFT&search=craft
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Handmade Crafts",
        "slug": "handmade-crafts",
        "category": "HANDCRAFT",
        "logo": "https://example.com/logo.jpg",
        "rating": 4.8,
        "totalProducts": 45
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

#### 6. Submit Shop Verification

**POST** `/api/shops/:id/verify`

🔒 **Requires Authentication** | **Permission:** SHOP_WRITE

Submit documents for shop verification.

**Request Body:**

```json
{
  "documents": [
    "https://example.com/document1.pdf",
    "https://example.com/document2.pdf"
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "verificationStatus": "PENDING",
    "submittedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 7. Update Shop Status (Admin)

**PUT** `/api/shops/:id/status`

🔒 **Requires Authentication** | **Permission:** SHOP_APPROVE

Update shop status (admin only).

**Request Body:**

```json
{
  "status": "ACTIVE",
  "notes": "Shop approved after review"
}
```

**Status Options:**

- `PENDING`
- `ACTIVE`
- `SUSPENDED`
- `CLOSED`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ACTIVE",
    "updatedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 8. Get Shop Analytics

**GET** `/api/shops/:id/analytics`

🔒 **Requires Authentication** | **Permission:** SHOP_READ

Get shop analytics and statistics.

**Query Parameters:**

- `period` (default: "month"): "week", "month", "year"

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalSales": 15000,
    "totalOrders": 250,
    "totalRevenue": 18500,
    "averageOrderValue": 74,
    "topProducts": [
      {
        "productId": "uuid",
        "name": "Handmade Scarf",
        "sales": 45,
        "revenue": 2250
      }
    ],
    "salesByDay": [
      { "date": "2025-12-01", "sales": 500 },
      { "date": "2025-12-02", "sales": 750 }
    ]
  }
}
```

---

#### 9. Get Seller's Shops

**GET** `/api/shops/seller/my-shops`

🔒 **Requires Authentication** | **Role:** SELLER

Get all shops owned by the authenticated seller.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My First Shop",
      "status": "ACTIVE",
      "totalProducts": 25,
      "totalSales": 500
    }
  ]
}
```

---

## Product Service (Port 3003)

Base URL: `http://localhost:3003`

### Product Endpoints

#### 1. Create Product

**POST** `/api/products`

🔒 **Requires Authentication** | **Permission:** PRODUCT_WRITE

Create a new product.

**Request Body:**

```json
{
  "name": "Handmade Crochet Scarf",
  "description": "Beautiful handmade scarf made with premium yarn",
  "shortDescription": "Cozy winter scarf",
  "type": "PHYSICAL",
  "category": "CROCHET",
  "tags": ["scarf", "winter", "handmade"],
  "images": [
    "https://example.com/product1.jpg",
    "https://example.com/product2.jpg"
  ],
  "price": 49.99,
  "compareAtPrice": 69.99,
  "sku": "SCARF-001",
  "weight": 0.3,
  "attributes": {
    "color": "Blue",
    "size": "Medium",
    "material": "Wool"
  }
}
```

**Product Types:**

- `PHYSICAL` - Physical products that need shipping
- `DIGITAL` - Digital downloads

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Handmade Crochet Scarf",
    "slug": "handmade-crochet-scarf",
    "price": 49.99,
    "status": "DRAFT",
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 2. Get Product

**GET** `/api/products/:id`

Get product details.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Handmade Crochet Scarf",
    "slug": "handmade-crochet-scarf",
    "description": "Beautiful handmade scarf",
    "shortDescription": "Cozy winter scarf",
    "type": "PHYSICAL",
    "category": "CROCHET",
    "tags": ["scarf", "winter"],
    "images": ["https://example.com/product1.jpg"],
    "price": 49.99,
    "compareAtPrice": 69.99,
    "sku": "SCARF-001",
    "stock": 15,
    "status": "ACTIVE",
    "rating": 4.7,
    "totalReviews": 23,
    "shop": {
      "id": "uuid",
      "name": "Handmade Crafts",
      "logo": "https://example.com/logo.jpg"
    },
    "attributes": {
      "color": "Blue",
      "size": "Medium"
    },
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 3. Update Product

**PUT** `/api/products/:id`

🔒 **Requires Authentication** | **Permission:** PRODUCT_WRITE

Update product details.

**Request Body:** (All fields optional)

```json
{
  "name": "Updated Product Name",
  "price": 54.99,
  "stock": 20
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Product Name",
    ...
  }
}
```

---

#### 4. Delete Product

**DELETE** `/api/products/:id`

🔒 **Requires Authentication** | **Permission:** PRODUCT_DELETE

Delete a product.

**Response (204 No Content)**

---

#### 5. List Products

**GET** `/api/products`

Get list of products with pagination and filters.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `category` (optional)
- `minPrice` (optional)
- `maxPrice` (optional)
- `search` (optional)
- `sortBy` (optional): "price", "createdAt", "rating"
- `sortOrder` (optional): "asc", "desc"

**Example:**

```
GET /api/products?page=1&limit=20&category=CROCHET&minPrice=20&maxPrice=100&sortBy=price&sortOrder=asc
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Handmade Scarf",
        "slug": "handmade-scarf",
        "price": 49.99,
        "images": ["https://example.com/product.jpg"],
        "rating": 4.7,
        "shop": {
          "id": "uuid",
          "name": "Handmade Crafts"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

#### 6. Get Shop Products

**GET** `/api/products/shops/:shopId`

Get all products from a specific shop.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)

**Response:** Same format as List Products

---

#### 7. Update Inventory

**PUT** `/api/products/:id/inventory`

🔒 **Requires Authentication** | **Permission:** PRODUCT_WRITE

Update product inventory.

**Request Body:**

```json
{
  "stock": 25,
  "lowStockThreshold": 5
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "stock": 25,
    "lowStockThreshold": 5,
    "updatedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 8. Add Product Variation

**POST** `/api/products/:id/variations`

🔒 **Requires Authentication** | **Permission:** PRODUCT_WRITE

Add a product variation (e.g., different size/color).

**Request Body:**

```json
{
  "name": "Large Blue Scarf",
  "sku": "SCARF-001-L-BLUE",
  "price": 59.99,
  "stock": 10,
  "attributes": {
    "size": "Large",
    "color": "Blue"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "productId": "uuid",
    "name": "Large Blue Scarf",
    "price": 59.99,
    "stock": 10
  }
}
```

---

## Order Service (Port 3004)

Base URL: `http://localhost:3004`

### Order Endpoints

#### 1. Create Order

**POST** `/api/orders`

🔒 **Requires Authentication**

Create order from cart.

**Request Body:**

```json
{
  "shippingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "street": "123 Main St",
    "apartment": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001"
  },
  "billingAddress": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postalCode": "10001"
  },
  "paymentMethod": "CARD"
}
```

**Payment Methods:**

- `CARD`
- `CASH_ON_DELIVERY`
- `BANK_TRANSFER`
- `WALLET`

**Note:** If `billingAddress` is omitted, shipping address will be used.

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "orderNumber": "ORD-20251204-001",
    "total": 149.97,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "items": [
      {
        "productId": "uuid",
        "name": "Handmade Scarf",
        "quantity": 3,
        "price": 49.99,
        "subtotal": 149.97
      }
    ],
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 2. Get Order

**GET** `/api/orders/:id`

🔒 **Requires Authentication**

Get order details.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-20251204-001",
    "status": "PROCESSING",
    "paymentStatus": "PAID",
    "total": 149.97,
    "subtotal": 149.97,
    "tax": 0,
    "shipping": 0,
    "items": [
      {
        "productId": "uuid",
        "name": "Handmade Scarf",
        "image": "https://example.com/product.jpg",
        "quantity": 3,
        "price": 49.99,
        "subtotal": 149.97
      }
    ],
    "shippingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "country": "USA",
      "postalCode": "10001"
    },
    "createdAt": "2025-12-04T10:00:00Z",
    "updatedAt": "2025-12-04T10:30:00Z"
  }
}
```

---

#### 3. Get User Orders

**GET** `/api/orders`

🔒 **Requires Authentication**

Get all orders for the authenticated user.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orderNumber": "ORD-20251204-001",
        "status": "DELIVERED",
        "total": 149.97,
        "itemCount": 3,
        "createdAt": "2025-12-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

---

#### 4. Update Order Status

**PUT** `/api/orders/:id/status`

🔒 **Requires Authentication**

Update order status (seller/api/admin only).

**Request Body:**

```json
{
  "status": "SHIPPED"
}
```

**Order Statuses:**

- `PENDING`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELLED`
- `REFUNDED`

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "SHIPPED",
    "updatedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 5. Cancel Order

**POST** `/api/orders/:id/cancel`

🔒 **Requires Authentication**

Cancel an order.

**Request Body:**

```json
{
  "reason": "Changed my mind"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 6. Get Order Tracking

**GET** `/api/orders/:id/tracking`

🔒 **Requires Authentication**

Get order tracking information.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "orderId": "uuid",
    "status": "SHIPPED",
    "trackingNumber": "1Z999AA10123456784",
    "carrier": "UPS",
    "estimatedDelivery": "2025-12-10T00:00:00Z",
    "history": [
      {
        "status": "PENDING",
        "timestamp": "2025-12-04T10:00:00Z",
        "note": "Order placed"
      },
      {
        "status": "PROCESSING",
        "timestamp": "2025-12-04T11:00:00Z",
        "note": "Order confirmed"
      },
      {
        "status": "SHIPPED",
        "timestamp": "2025-12-05T09:00:00Z",
        "note": "Package shipped"
      }
    ]
  }
}
```

---

## Cart Service (Port 3004)

Base URL: `http://localhost:3004`

### Cart Endpoints

#### 1. Get Cart

**GET** `/api/cart`

🔒 **Requires Authentication**

Get user's shopping cart.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "items": [
      {
        "productId": "uuid",
        "shopId": "uuid",
        "variationId": "uuid",
        "productName": "Handmade Scarf",
        "productImage": "https://example.com/product.jpg",
        "quantity": 2,
        "price": 49.99,
        "subtotal": 99.98
      }
    ],
    "total": 99.98,
    "itemCount": 2,
    "updatedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 2. Add Item to Cart

**POST** `/api/cart/items`

🔒 **Requires Authentication**

Add product to cart.

**Request Body:**

```json
{
  "productId": "uuid",
  "shopId": "uuid",
  "variationId": "uuid",
  "quantity": 2,
  "price": 49.99,
  "productName": "Handmade Scarf",
  "productImage": "https://example.com/product.jpg"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 99.98,
    "itemCount": 2
  }
}
```

---

#### 3. Update Cart Item

**PUT** `/api/cart/items/:productId`

🔒 **Requires Authentication**

Update item quantity in cart.

**Request Body:**

```json
{
  "quantity": 3,
  "variationId": "uuid"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 149.97,
    "itemCount": 3
  }
}
```

---

#### 4. Remove Cart Item

**DELETE** `/api/cart/items/:productId`

🔒 **Requires Authentication**

Remove item from cart.

**Query Parameters:**

- `variationId` (optional)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 0,
    "itemCount": 0
  }
}
```

---

#### 5. Clear Cart

**DELETE** `/api/cart`

🔒 **Requires Authentication**

Remove all items from cart.

**Response (204 No Content)**

---

## Payment Service (Port 3005)

Base URL: `http://localhost:3005`

### Payment Endpoints

#### 1. Process Payment

**POST** `/api/payments/process`

🔒 **Requires Authentication**

Process payment for an order.

**Request Body:**

```json
{
  "paymentId": "uuid",
  "method": "CARD"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "COMPLETED",
    "amount": 149.97,
    "method": "CARD",
    "transactionId": "txn_123456",
    "processedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 2. Get Payment

**GET** `/api/payments/:id`

🔒 **Requires Authentication**

Get payment details.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "amount": 149.97,
    "method": "CARD",
    "status": "COMPLETED",
    "transactionId": "txn_123456",
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 3. Get Payment by Order

**GET** `/api/payments/orders/:orderId`

🔒 **Requires Authentication**

Get payment for a specific order.

**Response:** Same as Get Payment

---

#### 4. PayFast Webhook

**POST** `/api/payments/payfast/notify`

PayFast payment notification webhook (no authentication required).

**Note:** This is called by PayFast payment gateway.

---

## Review Service (Port 3008)

Base URL: `http://localhost:3008`

### Review Endpoints

#### 1. Create Review

**POST** `/api/reviews`

🔒 **Requires Authentication**

Create a product or shop review.

**Request Body:**

```json
{
  "type": "PRODUCT",
  "targetId": "uuid",
  "orderId": "uuid",
  "rating": 5,
  "title": "Amazing product!",
  "comment": "This is the best handmade scarf I've ever bought.",
  "images": [
    "https://example.com/review1.jpg",
    "https://example.com/review2.jpg"
  ]
}
```

**Review Types:**

- `PRODUCT` - Product review
- `SHOP` - Shop review

**Validation:**

- `rating`: Integer between 1-5
- `title`: Max 255 characters (optional)

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "PRODUCT",
    "targetId": "uuid",
    "userId": "uuid",
    "rating": 5,
    "title": "Amazing product!",
    "comment": "This is the best handmade scarf...",
    "status": "PENDING",
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 2. Get Reviews

**GET** `/api/reviews/target/:targetId`

Get reviews for a product or shop.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "rating": 5,
        "title": "Amazing product!",
        "comment": "This is the best...",
        "images": ["https://example.com/review1.jpg"],
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "D.",
          "avatar": "https://example.com/avatar.jpg"
        },
        "createdAt": "2025-12-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "summary": {
      "averageRating": 4.7,
      "totalReviews": 45,
      "ratingDistribution": {
        "5": 30,
        "4": 10,
        "3": 3,
        "2": 1,
        "1": 1
      }
    }
  }
}
```

---

#### 3. Approve Review (Admin)

**PUT** `/api/reviews/:id/approve`

🔒 **Requires Authentication** | **Permission:** REVIEW_MODERATE

Approve a pending review.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "approvedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 4. Reject Review (Admin)

**PUT** `/api/reviews/:id/reject`

🔒 **Requires Authentication** | **Permission:** REVIEW_MODERATE

Reject a review.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectedAt": "2025-12-04T10:00:00Z"
  }
}
```

---

## Notification Service (Port 3006)

Base URL: `http://localhost:3006`

### Notification Endpoints

#### 1. Get Notifications

**GET** `/api/notifications`

🔒 **Requires Authentication**

Get user notifications.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)
- `unreadOnly` (optional): "true" or "false"

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "ORDER_SHIPPED",
        "title": "Your order has been shipped",
        "message": "Order #ORD-20251204-001 is on its way!",
        "data": {
          "orderId": "uuid",
          "trackingNumber": "1Z999AA10123456784"
        },
        "read": false,
        "createdAt": "2025-12-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    },
    "unreadCount": 12
  }
}
```

---

#### 2. Mark Notification as Read

**PUT** `/api/notifications/:id/read`

🔒 **Requires Authentication**

Mark a notification as read.

**Response (204 No Content)**

---

#### 3. Mark All as Read

**PUT** `/api/notifications/read-all`

🔒 **Requires Authentication**

Mark all notifications as read.

**Response (204 No Content)**

---

#### 4. WebSocket Connection

**GET** `/api/notifications/ws` (WebSocket)

🔒 **Requires Authentication** (via query param or initial message)

Real-time notification updates.

**Connection:**

```javascript
const ws = new WebSocket('ws://localhost:3006/api/notifications/ws');

ws.onopen = () => {
  console.log('Connected to notifications');
};

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  console.log('New notification:', notification);
};
```

**Message Format:**

```json
{
  "type": "ORDER_SHIPPED",
  "title": "Your order has been shipped",
  "message": "Order #ORD-20251204-001 is on its way!",
  "data": {
    "orderId": "uuid"
  }
}
```

---

---

## Admin Service (Port 3009)

Base URL: `http://localhost:3009`

### Admin Endpoints

#### 1. Get Dashboard Stats

**GET** `/api/admin/dashboard`

🔒 **Requires Authentication** | **Permission:** ADMIN_DASHBOARD

Get admin dashboard statistics.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1500,
    "totalShops": 50,
    "totalOrders": 3200,
    "totalRevenue": 150000,
    "pendingShops": 5,
    "pendingReviews": 12
  }
}
```

---

#### 2. Get Users

**GET** `/api/admin/users`

🔒 **Requires Authentication** | **Permission:** USER_READ

Get list of users.

**Query Parameters:**

- `page` (default: 1)
- `limit` (default: 20)

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "ali.hassam1@gmail.com",
        "role": "CUSTOMER",
        "status": "ACTIVE",
        "createdAt": "2025-12-04T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1500,
      "totalPages": 75
    }
  }
}
```

---

#### 3. Get Pending Shops

**GET** `/api/admin/shops/pending`

🔒 **Requires Authentication** | **Permission:** SHOP_APPROVE

Get shops waiting for approval.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "New Shop",
      "ownerId": "uuid",
      "submittedAt": "2025-12-04T10:00:00Z"
    }
  ]
}
```

---

#### 4. Get Pending Reviews

**GET** `/api/admin/reviews/pending`

🔒 **Requires Authentication** | **Permission:** REVIEW_MODERATE

Get reviews waiting for moderation.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "PRODUCT",
      "rating": 1,
      "comment": "Spam review...",
      "createdAt": "2025-12-04T10:00:00Z"
    }
  ]
}
```

---

#### 5. System Health

**GET** `/api/admin/health/system`

🔒 **Requires Authentication** | **Permission:** ADMIN_DASHBOARD

Get system health status.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "cpu": 45,
    "memory": 60,
    "uptime": 3600,
    "services": {
      "auth": "UP",
      "shop": "UP",
      "product": "UP"
    }
  }
}
```

---

## Promotion Service (Port 3010)

Base URL: `http://localhost:3010`

### Promotion Endpoints

#### 1. Create Discount Code

**POST** `/api/promotions/discounts`

🔒 **Requires Authentication**

Create a new discount code.

**Request Body:**

```json
{
  "code": "SUMMER2025",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "minPurchaseAmount": 50,
  "validFrom": "2025-06-01T00:00:00Z",
  "validTo": "2025-08-31T23:59:59Z",
  "usageLimit": 1000
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "SUMMER2025",
    "createdAt": "2025-12-04T10:00:00Z"
  }
}
```

---

#### 2. Validate Discount Code

**POST** `/api/promotions/discounts/validate`

Validate a discount code.

**Request Body:**

```json
{
  "code": "SUMMER2025"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountType": "PERCENTAGE",
    "discountValue": 20,
    "minPurchaseAmount": 50
  }
}
```

---

#### 3. Get Active Promotions

**GET** `/api/promotions/active`

Get list of active promotions.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Summer Sale",
      "description": "20% off all summer items",
      "banner": "https://example.com/summer.jpg"
    }
  ]
}
```

---

#### 4. Get Featured Products

**GET** `/api/promotions/featured`

Get list of featured products.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Featured Product",
      "price": 99.99,
      "image": "https://example.com/product.jpg"
    }
  ]
}
```

---

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ]
  }
}
```

---

## Error Codes

| Code                       | HTTP Status | Description                       |
| -------------------------- | ----------- | --------------------------------- |
| `VALIDATION_ERROR`       | 400         | Request validation failed         |
| `AUTHENTICATION_ERROR`   | 401         | Invalid or missing authentication |
| `AUTHORIZATION_ERROR`    | 403         | Insufficient permissions          |
| `NOT_FOUND`              | 404         | Resource not found                |
| `CONFLICT`               | 409         | Resource already exists           |
| `RATE_LIMIT_ERROR`       | 429         | Too many requests                 |
| `PAYMENT_ERROR`          | 402         | Payment processing failed         |
| `INVENTORY_ERROR`        | 400         | Insufficient stock                |
| `BUSINESS_LOGIC_ERROR`   | 400         | Business rule violation           |
| `EXTERNAL_SERVICE_ERROR` | 502         | External service unavailable      |
| `INTERNAL_SERVER_ERROR`  | 500         | Server error                      |

---

## Permission Matrix

### Customer Permissions

- `PRODUCT_READ`
- `SHOP_READ`
- `ORDER_READ`
- `ORDER_WRITE`
- `REVIEW_READ`

### Seller Permissions

- All Customer permissions
- `PRODUCT_WRITE`
- `PRODUCT_DELETE`
- `SHOP_WRITE`
- `PAYMENT_READ`

### Admin Permissions

- All permissions

---

## Rate Limiting

All endpoints are rate-limited:

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **Payment endpoints**: 20 requests per minute per user

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701691200
```

---

## Testing

### Health Check

Each service has a health check endpoint:

```
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "service": "auth",
  "timestamp": "2025-12-04T10:00:00Z"
}
```

---

## Notes for Frontend Implementation

1. **Token Management**: Store `accessToken` and `refreshToken` securely (e.g., httpOnly cookies or secure storage)
2. **Token Refresh**: Implement automatic token refresh when receiving 401 errors
3. **Error Handling**: Handle all error codes appropriately with user-friendly messages
4. **Loading States**: Show loading indicators during API calls
5. **Pagination**: Implement infinite scroll or pagination for list endpoints
6. **WebSocket**: Use WebSocket for real-time notifications
7. **File Uploads**: For image uploads, first upload to file service, then use the URL in product/shop creation
8. **Validation**: Implement client-side validation matching server-side rules
9. **CORS**: Frontend URL must be configured in `.env` as `FRONTEND_URL`

---

## Environment Variables

Required environment variables for each service:

```env
# Common
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crevea

# Redis
REDIS_URL=redis://localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:9011

# OAuth (Auth Service)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
```

---

## Support

For questions or issues, please contact the backend team or refer to the main [README.md](./README.md).

**Last Updated**: December 4, 2025
