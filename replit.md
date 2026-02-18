# RuneCoins - Paulistinha Coins Marketplace

## Overview
A full-stack Tibia Coins buy/sell marketplace with a dark gaming theme featuring red and black colors. Built with React, Express, and PostgreSQL. Integrates Pagar.me for payment processing (PIX and credit card).

## Tech Stack
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Framer Motion
- Backend: Express.js + Drizzle ORM + Multer (file uploads)
- Database: PostgreSQL (Neon-backed)
- State: TanStack React Query
- Payment: Pagar.me API v5 (via axios)

## Project Structure
- `client/src/pages/home.tsx` - Main landing page
- `client/src/components/` - All UI components (navbar, hero-section, coin-calculator, features, servers, faq, footer, auth-modals)
- `server/routes.ts` - API endpoints (buy payments, sell orders, webhooks)
- `server/pagarme.ts` - Pagar.me payment gateway integration
- `server/storage.ts` - Database storage layer
- `server/seed.ts` - Database seeding
- `shared/schema.ts` - Drizzle schemas and types

## Key Features
- Hero section with RuneCoins logo, animated stats
- Coin buy calculator with PIX and credit card payment (5% surcharge on credit card)
- Coin sell wizard (6-step flow): quantity → character/server → screenshots → personal info → PIX key → order summary
- Server listing (3 servers: Deletera, Lordebra, Dominium)
- FAQ accordion section
- Authentication modals (Login/Register)
- Dark/light theme toggle
- Responsive design

## Pricing
- Buy price: R$ 0.0799 per coin (fixed)
- Sell price: R$ 0.06 per coin (fixed)
- Credit card surcharge: +5% on buy orders

## API Endpoints
- GET /api/packages - List coin packages
- GET /api/servers - List game servers
- POST /api/orders - Create a new order
- GET /api/orders/:id - Get order by ID
- POST /api/payments - Process buy payment (PIX or credit card via Pagar.me)
- GET /api/payments/:orderId/status - Check payment status
- POST /api/sell-orders - Create sell order (multipart/form-data with screenshots)
- POST /api/webhooks/pagarme - Pagar.me webhook handler

## Database Tables
- users, coin_packages, servers, orders (with pix_key, pix_account_holder, store_screenshot, market_screenshot fields)

## Theme
- Dark-first theme with red primary (0° hue) and black accents
- Uses ThemeProvider with localStorage sync

## Logo
- Main logo: attached_assets/image_1771387321993.png (RuneCoins golden emblem)
- Displayed in navbar and hero section
