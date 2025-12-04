# Frontend Integration Guide

Quick reference for common frontend integration patterns with the Crevea API.

## Table of Contents

- [Authentication Flow](#authentication-flow)
- [Common Workflows](#common-workflows)
- [API Client Setup](#api-client-setup)
- [TypeScript Types](#typescript-types)
- [Best Practices](#best-practices)

---

## Authentication Flow

### 1. User Registration & Login

```typescript
// Register new user
const register = async (userData) => {
  const response = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'CUSTOMER' // or 'SELLER'
    })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store tokens
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.user;
  }
  
  throw new Error(data.error.message);
};

// Login
const login = async (email, password) => {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.user;
  }
  
  throw new Error(data.error.message);
};
```

### 2. Token Refresh

```typescript
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('http://localhost:3001/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    return data.data.accessToken;
  }
  
  // Refresh failed, logout user
  logout();
  throw new Error('Session expired');
};
```

### 3. Authenticated Requests

```typescript
const fetchWithAuth = async (url, options = {}) => {
  const accessToken = localStorage.getItem('accessToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  // Handle 401 - token expired
  if (response.status === 401) {
    try {
      const newToken = await refreshToken();
      // Retry request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Refresh failed, redirect to login
      window.location.href = '/login';
      throw error;
    }
  }
  
  return response;
};
```

### 4. OAuth Login

```typescript
// Redirect to OAuth provider
const loginWithGoogle = () => {
  window.location.href = 'http://localhost:3001/oauth/google';
};

const loginWithFacebook = () => {
  window.location.href = 'http://localhost:3001/oauth/facebook';
};

// Handle OAuth callback (on /auth/callback page)
const handleOAuthCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  
  if (accessToken && refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    window.location.href = '/dashboard';
  } else {
    window.location.href = '/login?error=oauth_failed';
  }
};
```

---

## Common Workflows

### Shopping Cart Flow

```typescript
// 1. Add item to cart
const addToCart = async (productId, shopId, quantity, price, productName, productImage) => {
  const response = await fetchWithAuth('http://localhost:3004/cart/items', {
    method: 'POST',
    body: JSON.stringify({
      productId,
      shopId,
      quantity,
      price,
      productName,
      productImage
    })
  });
  
  return response.json();
};

// 2. Get cart
const getCart = async () => {
  const response = await fetchWithAuth('http://localhost:3004/cart');
  return response.json();
};

// 3. Update quantity
const updateCartItem = async (productId, quantity) => {
  const response = await fetchWithAuth(`http://localhost:3004/cart/items/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity })
  });
  
  return response.json();
};

// 4. Remove item
const removeFromCart = async (productId) => {
  const response = await fetchWithAuth(`http://localhost:3004/cart/items/${productId}`, {
    method: 'DELETE'
  });
  
  return response.json();
};

// 5. Create order from cart
const checkout = async (shippingAddress, paymentMethod) => {
  const response = await fetchWithAuth('http://localhost:3004/order', {
    method: 'POST',
    body: JSON.stringify({
      shippingAddress,
      paymentMethod
    })
  });
  
  return response.json();
};
```

### Product Listing & Search

```typescript
// Get products with filters
const getProducts = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...(filters.category && { category: filters.category }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    ...(filters.search && { search: filters.search }),
    ...(filters.sortBy && { sortBy: filters.sortBy }),
    ...(filters.sortOrder && { sortOrder: filters.sortOrder })
  });
  
  const response = await fetch(`http://localhost:3003/product?${params}`);
  return response.json();
};

// Get single product
const getProduct = async (productId) => {
  const response = await fetch(`http://localhost:3003/product/${productId}`);
  return response.json();
};

// Get shop products
const getShopProducts = async (shopId, page = 1) => {
  const response = await fetch(`http://localhost:3003/product/shop/${shopId}?page=${page}`);
  return response.json();
};
```

### Shop Management (Seller)

```typescript
// Create shop
const createShop = async (shopData) => {
  const response = await fetchWithAuth('http://localhost:3002/shop', {
    method: 'POST',
    body: JSON.stringify(shopData)
  });
  
  return response.json();
};

// Get seller's shops
const getMyShops = async () => {
  const response = await fetchWithAuth('http://localhost:3002/shop/seller/my-shops');
  return response.json();
};

// Update shop
const updateShop = async (shopId, updates) => {
  const response = await fetchWithAuth(`http://localhost:3002/shop/${shopId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  
  return response.json();
};

// Get shop analytics
const getShopAnalytics = async (shopId, period = 'month') => {
  const response = await fetchWithAuth(
    `http://localhost:3002/shop/${shopId}/analytics?period=${period}`
  );
  return response.json();
};
```

### Product Management (Seller)

```typescript
// Create product
const createProduct = async (productData) => {
  const response = await fetchWithAuth('http://localhost:3003/product', {
    method: 'POST',
    body: JSON.stringify(productData)
  });
  
  return response.json();
};

// Update product
const updateProduct = async (productId, updates) => {
  const response = await fetchWithAuth(`http://localhost:3003/product/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
  
  return response.json();
};

// Update inventory
const updateInventory = async (productId, stock, lowStockThreshold) => {
  const response = await fetchWithAuth(`http://localhost:3003/product/${productId}/inventory`, {
    method: 'PUT',
    body: JSON.stringify({ stock, lowStockThreshold })
  });
  
  return response.json();
};
```

### Order Management

```typescript
// Get user orders
const getMyOrders = async (page = 1) => {
  const response = await fetchWithAuth(`http://localhost:3004/order?page=${page}`);
  return response.json();
};

// Get order details
const getOrder = async (orderId) => {
  const response = await fetchWithAuth(`http://localhost:3004/order/${orderId}`);
  return response.json();
};

// Track order
const trackOrder = async (orderId) => {
  const response = await fetchWithAuth(`http://localhost:3004/order/${orderId}/tracking`);
  return response.json();
};

// Cancel order
const cancelOrder = async (orderId, reason) => {
  const response = await fetchWithAuth(`http://localhost:3004/order/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  
  return response.json();
};
```

### Reviews

```typescript
// Create review
const createReview = async (reviewData) => {
  const response = await fetchWithAuth('http://localhost:3008/review', {
    method: 'POST',
    body: JSON.stringify({
      type: 'PRODUCT', // or 'SHOP'
      targetId: reviewData.productId,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment,
      images: reviewData.images
    })
  });
  
  return response.json();
};

// Get product reviews
const getProductReviews = async (productId, page = 1) => {
  const response = await fetch(
    `http://localhost:3008/review/target/${productId}?page=${page}`
  );
  return response.json();
};
```

### Notifications

```typescript
// Get notifications
const getNotifications = async (page = 1, unreadOnly = false) => {
  const params = new URLSearchParams({
    page,
    limit: 20,
    ...(unreadOnly && { unreadOnly: 'true' })
  });
  
  const response = await fetchWithAuth(`http://localhost:3006/notification?${params}`);
  return response.json();
};

// Mark as read
const markNotificationAsRead = async (notificationId) => {
  await fetchWithAuth(`http://localhost:3006/notification/${notificationId}/read`, {
    method: 'PUT'
  });
};

// Mark all as read
const markAllNotificationsAsRead = async () => {
  await fetchWithAuth('http://localhost:3006/notification/read-all', {
    method: 'PUT'
  });
};

// WebSocket for real-time notifications
const connectNotifications = () => {
  const ws = new WebSocket('ws://localhost:3006/notification/ws');
  
  ws.onopen = () => {
    console.log('Connected to notifications');
  };
  
  ws.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    // Show notification to user
    showNotification(notification);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('Disconnected from notifications');
    // Reconnect after 5 seconds
    setTimeout(connectNotifications, 5000);
  };
  
  return ws;
};
```

---

## API Client Setup

### React Example with Axios

```typescript
// api/client.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Service Layer Example

```typescript
// services/authService.ts
import apiClient from './client';

export const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  
  logout: async () => {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

// services/productService.ts
export const productService = {
  getProducts: async (filters) => {
    const response = await apiClient.get('http://localhost:3003/product', {
      params: filters
    });
    return response.data;
  },
  
  getProduct: async (id) => {
    const response = await apiClient.get(`http://localhost:3003/product/${id}`);
    return response.data;
  }
};
```

---

## TypeScript Types

```typescript
// types/user.ts
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// types/product.ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  type: 'PHYSICAL' | 'DIGITAL';
  category: string;
  tags: string[];
  images: string[];
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stock: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  rating: number;
  totalReviews: number;
  shop: {
    id: string;
    name: string;
    logo?: string;
  };
  attributes: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// types/cart.ts
export interface CartItem {
  productId: string;
  shopId: string;
  variationId?: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  total: number;
  itemCount: number;
  updatedAt: string;
}

// types/order.ts
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  items: OrderItem[];
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## Best Practices

### 1. Error Handling

```typescript
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { code, message, details } = error.response.data.error;
    
    switch (code) {
      case 'VALIDATION_ERROR':
        // Show field-specific errors
        details?.forEach(({ field, message }) => {
          showFieldError(field, message);
        });
        break;
      
      case 'AUTHENTICATION_ERROR':
        // Redirect to login
        window.location.href = '/login';
        break;
      
      case 'AUTHORIZATION_ERROR':
        // Show permission error
        showError('You do not have permission to perform this action');
        break;
      
      case 'NOT_FOUND':
        // Show 404 page
        showError('Resource not found');
        break;
      
      default:
        showError(message || 'An error occurred');
    }
  } else if (error.request) {
    // Request made but no response
    showError('Network error. Please check your connection.');
  } else {
    // Something else happened
    showError('An unexpected error occurred');
  }
};
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await apiClient.get('/products');
    setData(response.data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. Pagination

```typescript
const [products, setProducts] = useState([]);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const response = await productService.getProducts({ page, limit: 20 });
  
  setProducts([...products, ...response.data.items]);
  setHasMore(page < response.data.pagination.totalPages);
  setPage(page + 1);
};

// Infinite scroll
useEffect(() => {
  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      if (hasMore && !loading) {
        loadMore();
      }
    }
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [hasMore, loading]);
```

### 4. Optimistic Updates

```typescript
const addToCart = async (product) => {
  // Optimistically update UI
  const optimisticCart = {
    ...cart,
    items: [...cart.items, { ...product, quantity: 1 }],
    itemCount: cart.itemCount + 1
  };
  setCart(optimisticCart);
  
  try {
    // Make API call
    const response = await cartService.addItem(product);
    // Update with server response
    setCart(response.data);
  } catch (error) {
    // Revert on error
    setCart(cart);
    showError('Failed to add item to cart');
  }
};
```

### 5. Debouncing Search

```typescript
import { debounce } from 'lodash';

const searchProducts = debounce(async (query) => {
  if (query.length < 3) return;
  
  const response = await productService.getProducts({ search: query });
  setSearchResults(response.data.items);
}, 300);

// Usage
<input 
  type="text" 
  onChange={(e) => searchProducts(e.target.value)}
  placeholder="Search products..."
/>
```

---

## Environment Configuration

Create a `.env` file in your frontend project:

```env
VITE_API_AUTH_URL=http://localhost:3001
VITE_API_SHOP_URL=http://localhost:3002
VITE_API_PRODUCT_URL=http://localhost:3003
VITE_API_ORDER_URL=http://localhost:3004
VITE_API_PAYMENT_URL=http://localhost:3005
VITE_API_NOTIFICATION_URL=http://localhost:3006
VITE_API_REVIEW_URL=http://localhost:3008

VITE_WS_NOTIFICATION_URL=ws://localhost:3006
```

Use in code:

```typescript
const API_URLS = {
  auth: import.meta.env.VITE_API_AUTH_URL,
  shop: import.meta.env.VITE_API_SHOP_URL,
  product: import.meta.env.VITE_API_PRODUCT_URL,
  order: import.meta.env.VITE_API_ORDER_URL,
  payment: import.meta.env.VITE_API_PAYMENT_URL,
  notification: import.meta.env.VITE_API_NOTIFICATION_URL,
  review: import.meta.env.VITE_API_REVIEW_URL
};
```

---

## Testing API Endpoints

Use tools like:
- **Postman**: Import the API routes and test endpoints
- **Thunder Client** (VS Code extension): Test directly in VS Code
- **curl**: Command-line testing

Example curl commands:

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"John","lastName":"Doe","role":"CUSTOMER"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get products
curl http://localhost:3003/product?page=1&limit=20
```

---

For complete API documentation, see [API_ROUTES.md](./API_ROUTES.md).
