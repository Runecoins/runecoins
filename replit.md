# RuneCoins - Paulistinha Coins Marketplace

## Overview
A full-stack Tibia Coins buy/sell marketplace inspired by dracoins.com.br. Features a dark gaming theme with purple and green neon accents. Built with React, Express, and PostgreSQL.

## Tech Stack
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Framer Motion
- Backend: Express.js + Drizzle ORM
- Database: PostgreSQL (Neon-backed)
- State: TanStack React Query

## Project Structure
- `client/src/pages/home.tsx` - Main landing page
- `client/src/components/` - All UI components (navbar, hero, calculator, features, servers, faq, footer)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database storage layer
- `server/seed.ts` - Database seeding
- `shared/schema.ts` - Drizzle schemas and types

## Key Features
- Hero section with animated stats
- Coin buy/sell calculator with order form
- Server listing (16 Tibia servers)
- FAQ accordion section
- Dark/light theme toggle
- Responsive design

## API Endpoints
- GET /api/packages - List coin packages
- GET /api/servers - List game servers
- POST /api/orders - Create a new order
- GET /api/orders/:id - Get order by ID

## Database Tables
- users, coin_packages, servers, orders

## Theme
- Dark-first theme with purple primary (270 hue) and green accent (150 hue)
- Uses ThemeProvider with localStorage sync
