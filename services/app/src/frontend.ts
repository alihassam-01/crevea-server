// FRONTEND_URL may hold several comma-separated origins (storefront, admin portal, ...).
// All of them are allowed by CORS; the first one is the storefront that links and redirects point to.
export const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:9011')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const frontendUrl = frontendOrigins[0];
