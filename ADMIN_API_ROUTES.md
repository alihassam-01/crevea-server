# Admin API Routes Documentation

> **Authentication Required:** All routes require admin authentication and specific permissions.

## Base URL
```
/api/admin
```

---

## 1. Dashboard Statistics

### Endpoint
```http
GET /api/admin/dashboard
```

### Required Permission
`ADMIN_DASHBOARD`

### Request
**Query Parameters:** None

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

### Response
**Status:** `200 OK`

**Body:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 0,
    "totalShops": 0,
    "totalProducts": 0,
    "totalOrders": 0,
    "totalRevenue": 0,
    "pendingShops": 0,
    "pendingReviews": 0
  }
}
```

**Field Descriptions:**
- `totalUsers` (number): Total registered users
- `totalShops` (number): Total number of shops
- `totalProducts` (number): Total products in marketplace
- `totalOrders` (number): Total orders placed
- `totalRevenue` (number): Total platform revenue
- `pendingShops` (number): Shops awaiting verification
- `pendingReviews` (number): Reviews awaiting moderation

---

## 2. List All Users

### Endpoint
```http
GET /api/admin/users
```

### Required Permission
`USER_READ`

### Request
**Query Parameters:**

| Parameter | Type   | Required | Default | Description           |
|-----------|--------|----------|---------|----------------------|
| `page`    | number | No       | 1       | Page number          |
| `limit`   | number | No       | 20      | Items per page       |

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

**Example:**
```http
GET /api/admin/users?page=1&limit=20
```

### Response
**Status:** `200 OK`

**Body:**
```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

**Field Descriptions:**
- `data` (array): Array of user objects
- `meta.page` (number): Current page number
- `meta.limit` (number): Items per page
- `meta.total` (number): Total number of users
- `meta.totalPages` (number): Total pages available

---

## 3. Get Pending Shops

### Endpoint
```http
GET /api/admin/shops/pending
```

### Required Permission
`SHOP_APPROVE`

### Request
**Query Parameters:** None

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

### Response
**Status:** `200 OK`

**Body:**
```json
{
  "success": true,
  "data": []
}
```

**Field Descriptions:**
- `data` (array): Array of shop objects pending verification

**Shop Object Structure:**
```json
{
  "id": "uuid",
  "sellerId": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string",
  "category": "CROCHET | ART | PAINTING | HANDCRAFT",
  "logo": "string (url)",
  "banner": "string (url)",
  "status": "PENDING",
  "verificationStatus": "PENDING",
  "verificationDocuments": {},
  "commissionRate": 10,
  "rating": 0,
  "totalReviews": 0,
  "totalSales": 0,
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

---

## 4. Get Pending Reviews

### Endpoint
```http
GET /api/admin/reviews/pending
```

### Required Permission
`REVIEW_MODERATE`

### Request
**Query Parameters:** None

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

### Response
**Status:** `200 OK`

**Body:**
```json
{
  "success": true,
  "data": []
}
```

**Field Descriptions:**
- `data` (array): Array of review objects pending moderation

**Review Object Structure:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "productId": "uuid",
  "shopId": "uuid",
  "orderId": "uuid",
  "rating": 1-5,
  "title": "string",
  "comment": "string",
  "images": ["url"],
  "status": "PENDING",
  "createdAt": "ISO 8601 date",
  "updatedAt": "ISO 8601 date"
}
```

---

## 5. System Health Check

### Endpoint
```http
GET /api/admin/health/system
```

### Required Permission
`ADMIN_DASHBOARD`

### Request
**Query Parameters:** None

**Headers:**
```json
{
  "Authorization": "Bearer {admin_token}"
}
```

### Response
**Status:** `200 OK`

**Body:**
```json
{
  "success": true,
  "data": {
    "redis": true,
    "database": true,
    "kafka": true,
    "timestamp": "2025-12-07T14:12:20.000Z"
  }
}
```

**Field Descriptions:**
- `redis` (boolean): Redis connection status
- `database` (boolean): Database connection status
- `kafka` (boolean): Kafka connection status
- `timestamp` (string): Health check timestamp (ISO 8601)

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "No token provided"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## Permission Types

| Permission           | Description                          |
|---------------------|--------------------------------------|
| `ADMIN_DASHBOARD`   | Access to admin dashboard and stats |
| `USER_READ`         | Read user information               |
| `SHOP_APPROVE`      | Approve/reject shop applications    |
| `REVIEW_MODERATE`   | Moderate user reviews               |

---

## Authentication

All admin routes require JWT authentication with admin role. Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token must contain:
- Valid admin user ID
- Admin role claim
- Required permissions for the specific endpoint
