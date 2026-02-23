# RuneCoins - Paulistinha Coins Marketplace

## Overview
A full-stack Tibia Coins buy/sell marketplace with a dark gaming theme featuring red and black colors. Built with React, Express, and PostgreSQL. Integrates Pagar.me for payment processing (PIX and credit card).

## Tech Stack
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Framer Motion
- Backend: Express.js + Drizzle ORM + Multer (file uploads)
- Database: PostgreSQL (Neon-backed)
- State: TanStack React Query
- Payment: MercadoPago API (via official SDK)
- Auth: bcryptjs + express-session + connect-pg-simple

## Project Structure
- `client/src/pages/home.tsx` - Main landing page
- `client/src/pages/admin.tsx` - Admin dashboard (protected)
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/components/` - All UI components (navbar, hero-section, coin-calculator, features, servers, faq, footer, auth-modals)
- `server/routes.ts` - API endpoints (auth, admin, buy payments, sell orders, webhooks)
- `server/pagarme.ts` - Pagar.me payment gateway integration
- `server/storage.ts` - Database storage layer
- `server/seed.ts` - Database seeding (includes default admin user)
- `shared/schema.ts` - Drizzle schemas and types

## Authentication & Permissions
- Two user roles: "user" (regular) and "admin"
- Session-based auth stored in PostgreSQL
- Regular users: can browse, buy, sell coins
- Admin users: full access to admin panel at /admin
- Default admin account: username="admin", password="admin123"
- Admin panel features: view all orders, filter/search, update order status, view screenshots, stats dashboard

## Key Features
- Hero section with RuneCoins logo, animated stats
- Coin buy calculator with PIX and credit card payment (5% surcharge on credit card)
- Coin sell wizard (6-step flow): quantity -> character/server -> screenshots -> personal info -> PIX key -> order summary
- Server listing (3 servers: Deletera, Lordebra, Dominium)
- FAQ accordion section
- Authentication modals (Login/Register) with real backend
- Admin dashboard with order management, filters, stats
- Dark/light theme toggle
- Responsive design

## Pricing
- Buy price: R$ 0.799 per coin (fixed)
- Sell price: R$ 0.0649 per coin (fixed)
- Payment method: PIX only

## API Endpoints
### Auth
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- GET /api/user - Get current user info

### Admin (require admin role)
- GET /api/admin/orders - List all orders
- GET /api/admin/stats - Get order statistics
- PATCH /api/admin/orders/:id/status - Update order status

### Public
- GET /api/packages - List coin packages
- GET /api/servers - List game servers
- POST /api/orders - Create a new order
- GET /api/orders/:id - Get order by ID
- POST /api/payments - Process buy payment (PIX via MercadoPago)
- GET /api/payments/:orderId/status - Check payment status
- POST /api/sell-orders - Create sell order (multipart/form-data with screenshots)
- POST /api/webhooks/mercadopago - MercadoPago webhook handler

## Database Tables
- users (id, username, password, email, full_name, phone, role, created_at)
- coin_packages, servers, orders (with pix_key, pix_account_holder, store_screenshot, market_screenshot fields)
- session (auto-created by connect-pg-simple)

## Theme
- Dark-first theme with red primary (0 hue) and black accents
- Uses ThemeProvider with localStorage sync

## Logo
- Main logo: attached_assets/920361e1-d9d6-42a7-b8f4-a1c173bc7ed1-removebg-preview_1771388848903.png
- Displayed in navbar and hero section
