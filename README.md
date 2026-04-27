# TradeReplica

TradeReplica is a full-stack copy trading platform for Indian Stock Market, Forex, and Crypto. It includes:

- Next.js + Tailwind frontend with a modern trading dashboard
- Express.js + MongoDB backend
- JWT authentication
- Email OTP verification with Nodemailer
- Mock Aadhaar verification flow
- Trader discovery, favorites, copy/mock-copy actions, charts, and responsive dark/light UI

## Tech Stack

- Frontend: Next.js (React) + Tailwind CSS + Recharts
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT
- Email: Nodemailer

## Project Structure

```text
tradereplica/
  apps/
    api/   # Express + MongoDB backend
    web/   # Next.js + Tailwind frontend
```

## Features

- Signup with:
  - username
  - email
  - password / confirm password
  - 12-digit Aadhaar validation
  - mock Aadhaar verification
  - OTP email verification before activation
- Login with email or username
- Forgot password with OTP reset flow
- Protected JWT-based trader actions
- Portfolio discovery with:
  - All Portfolios / My Favorites
  - 30-day time filter
  - PnL filter
  - smart filter
  - search
  - compare basket
  - daily picks
- Trader cards with:
  - capacity
  - ROI
  - AUM
  - Sharpe ratio
  - MDD
  - mini performance chart
  - favorite / mock copy / copy actions
- Trader detail page with:
  - header summary
  - full stats
  - ROI/PnL performance chart
  - overview metrics
  - asset allocation donut chart
  - tabs for positions, history, and copy traders
- Light/dark mode
- Loading skeletons
- Error handling

## Environment Setup

### 1. Backend env

Copy [apps/api/.env.example](/C:/Users/ratho/OneDrive/Documents/tech/apps/api/.env.example) to `apps/api/.env` and update values as needed.

Important values:

- `MONGODB_URI`
- `JWT_SECRET`
- `AADHAAR_ENCRYPTION_KEY`
- `CLIENT_URL`
- SMTP credentials if you want real email delivery

If SMTP is not configured, Nodemailer falls back to a local preview transport and returns the mail content in API responses so OTP testing still works in development.

### 2. Frontend env

Copy [apps/web/.env.local.example](/C:/Users/ratho/OneDrive/Documents/tech/apps/web/.env.local.example) to `apps/web/.env.local`.

Default:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Run Locally

Make sure MongoDB is running first.

```bash
npm install
npm run dev
```

This starts:

- frontend: `http://localhost:3000`
- backend: `http://localhost:5000`

## Deploy To Firebase

TradeReplica is configured for Firebase App Hosting as two backends in the same Firebase project:

- `tradereplica-api` -> [apps/api](/C:/Users/ratho/OneDrive/Documents/tech/apps/api)
- `tradereplica-web` -> [apps/web](/C:/Users/ratho/OneDrive/Documents/tech/apps/web)

### Production requirements

Before deploying, make sure you have:

- a Firebase project on the Blaze plan
- a real MongoDB connection string, preferably MongoDB Atlas
- SMTP credentials for OTP delivery

### Secrets and environment

The API App Hosting config expects these Firebase secrets:

- `MONGODB_URI`
- `JWT_SECRET`
- `AADHAAR_ENCRYPTION_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Important:

- Production startup now refuses `USE_IN_MEMORY_MONGO=true`
- Production signup/forgot-password no longer exposes preview OTPs on screen

### App Hosting config files

- [firebase.json](/C:/Users/ratho/OneDrive/Documents/tech/firebase.json)
- [apps/api/apphosting.yaml](/C:/Users/ratho/OneDrive/Documents/tech/apps/api/apphosting.yaml)
- [apps/web/apphosting.yaml](/C:/Users/ratho/OneDrive/Documents/tech/apps/web/apphosting.yaml)

### Deploy steps

1. Sign in with Firebase CLI:

```bash
npx firebase-tools login
```

2. Create both App Hosting backends in project `tradereplica-46bd0` if they don't already exist.

3. Set the API secrets in Firebase Secret Manager or with Firebase CLI.

4. Update:

- `apps/api/apphosting.yaml`
  - replace `https://replace-with-web-backend-url`
- `apps/web/apphosting.yaml`
  - replace `https://replace-with-api-backend-url/api`

5. Deploy:

```bash
npm run firebase:deploy:api
npm run firebase:deploy:web
```

Or deploy both:

```bash
npm run firebase:deploy
```

## Seed Data

The API auto-seeds sample traders on first start when `SEED_SAMPLE_DATA=true`.

You can also seed manually:

```bash
npm run seed
```

## Main API Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-otp`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Traders

- `GET /api/traders`
- `GET /api/traders/:id`
- `POST /api/traders/:id/favorite`
- `POST /api/traders/:id/copy`

### Dashboard

- `GET /api/dashboard/summary`

### Mock Services

- `POST /api/mock/aadhaar/verify`

## Notes

- Aadhaar integration is mocked and intentionally not connected to any real identity provider.
- User passwords are hashed with `bcryptjs`.
- Aadhaar numbers are encrypted before storage.
- OTP codes are stored temporarily in MongoDB with expiry.

## Suggested Local Test Flow

1. Open the signup page and create an account.
2. Use the OTP from your real SMTP inbox or the dev preview shown in the UI.
3. Verify the account and log in.
4. Explore trader cards, add favorites, and start mock/live copy actions.
5. Open a trader details page and review positions, history, and copy trader tabs.
