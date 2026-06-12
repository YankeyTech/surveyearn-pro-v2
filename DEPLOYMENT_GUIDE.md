# SurveyEarn Pro - Deployment & Setup Guide

## Overview

SurveyEarn Pro is a full-stack survey rewards platform built with React 19, Express 4, tRPC 11, and MySQL. This guide covers everything needed to deploy and operate the platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                      │
│  Landing | Surveys | Wallet | Referrals | Admin Dashboard   │
└──────────────────────┬──────────────────────────────────────┘
                       │ tRPC Client
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (Express 4 + tRPC 11)                   │
│  Auth | Surveys | Wallet | Referrals | Admin | Fraud        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Drizzle ORM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   MySQL Database                             │
│  Users | Surveys | Responses | Wallets | Transactions       │
│  Referrals | Withdrawals | Notifications | Fraud Logs        │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 22.13.0 or later
- MySQL 8.0+ or TiDB compatible database
- AWS S3 bucket (for file storage)
- Manus OAuth credentials (for authentication)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://username:password@host:3306/surveyearn_pro

# Manus OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
JWT_SECRET=your_jwt_secret_key

# Owner Info
OWNER_OPEN_ID=your_open_id
OWNER_NAME=Your Name

# Frontend URLs
VITE_FRONTEND_URL=https://yourdomain.com
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_api_key

# Backend APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_backend_api_key

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE surveyearn_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE surveyearn_pro;
```

### 2. Run Migrations

```bash
cd /path/to/surveyearn-pro
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 3. Verify Tables

The following tables will be created:

- `users` - User accounts and profiles
- `surveys` - Survey definitions
- `survey_questions` - Survey questions
- `survey_responses` - User survey responses
- `wallets` - User point balances
- `transactions` - Point transactions
- `referrals` - Referral links and tracking
- `referral_signups` - Referral signup records
- `withdrawal_requests` - Withdrawal requests
- `notifications` - User notifications
- `fraud_logs` - Fraud detection logs
- `daily_earning_caps` - Daily earning tracking
- `audit_logs` - Admin action logs

## Installation & Development

### 1. Install Dependencies

```bash
cd /path/to/surveyearn-pro
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000` with hot reload enabled.

### 3. Run Tests

```bash
pnpm test
```

## Project Structure

```
surveyearn-pro/
├── client/                      # React frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable UI components
│   │   ├── lib/                # Utilities and tRPC client
│   │   └── index.css           # Global styles
│   └── public/                 # Static assets
├── server/                      # Express backend
│   ├── routers.ts              # tRPC procedure definitions
│   ├── db.ts                   # Database query helpers
│   ├── storage.ts              # S3 storage helpers
│   └── _core/                  # Framework core
├── drizzle/                     # Database schema & migrations
│   ├── schema.ts               # Table definitions
│   └── migrations/             # Generated SQL migrations
├── shared/                      # Shared types and constants
└── package.json                # Dependencies
```

## Core Features Implementation

### 1. User Authentication

- Manus OAuth integration
- Role-based access control (user/admin)
- Session management with JWT

**Key Files:**
- `server/_core/oauth.ts` - OAuth flow
- `server/_core/context.ts` - Request context
- `client/src/_core/hooks/useAuth.ts` - Auth hook

### 2. Survey System

- Multi-step survey interface
- Multiple question types (multiple choice, rating, open text, dropdown, checkbox)
- One completion per user per survey
- Automatic point calculation

**Key Files:**
- `server/routers.ts` - Survey procedures
- `client/src/pages/SurveyDetail.tsx` - Survey UI
- `drizzle/schema.ts` - Survey tables

### 3. Points & Wallet

- Real-time point balance tracking
- Transaction history with expiry dates
- Point-to-cash conversion (1 point = $0.01)

**Key Files:**
- `server/routers.ts` - Wallet procedures
- `client/src/pages/Wallet.tsx` - Wallet UI
- `drizzle/schema.ts` - Wallet tables

### 4. Withdrawal System

- Multiple withdrawal methods (PayPal, bank transfer, gift cards)
- Admin approval workflow
- Automatic point deduction on approval

**Key Files:**
- `server/routers.ts` - Withdrawal procedures
- `client/src/pages/Withdraw.tsx` - Withdrawal UI
- `drizzle/schema.ts` - Withdrawal tables

### 5. Referral System

- Unique referral codes per user
- Referral link tracking (clicks, signups)
- 10% commission on referred user earnings
- Automatic bonus on first survey completion

**Key Files:**
- `server/routers.ts` - Referral procedures
- `client/src/pages/Referrals.tsx` - Referral UI
- `drizzle/schema.ts` - Referral tables

### 6. Anti-Fraud System

- IP address tracking
- Device fingerprinting
- Duplicate account detection
- Daily earning caps (5 surveys max per day)
- Fraud risk scoring

**Key Files:**
- `server/routers.ts` - Fraud checks
- `drizzle/schema.ts` - Fraud logging tables

### 7. Admin Panel

- User management (view, suspend, ban)
- Survey management (create, publish, edit)
- Withdrawal approval/rejection
- Platform analytics

**Key Files:**
- `server/routers.ts` - Admin procedures
- `client/src/pages/AdminDashboard.tsx` - Admin UI

### 8. Notifications

- In-app notification system
- Survey availability alerts
- Withdrawal status updates
- Referral bonus notifications

**Key Files:**
- `server/routers.ts` - Notification procedures
- `drizzle/schema.ts` - Notification tables

## Deployment

### Option 1: Manus Platform (Recommended)

The project is pre-configured for Manus hosting:

1. Click "Publish" button in the Management UI
2. Create a checkpoint first if not already done
3. Platform handles deployment automatically

### Option 2: Self-Hosted (Cloud Run, Heroku, etc.)

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

The application will listen on the port specified by `PORT` environment variable (default: 3000).

### Option 3: Docker

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

## Database Backup & Recovery

### Backup

```bash
mysqldump -u username -p surveyearn_pro > backup.sql
```

### Restore

```bash
mysql -u username -p surveyearn_pro < backup.sql
```

## Monitoring & Maintenance

### Health Check

```bash
curl http://localhost:3000/api/health
```

### Database Optimization

```sql
-- Analyze tables
ANALYZE TABLE users, surveys, survey_responses;

-- Check table status
SHOW TABLE STATUS FROM surveyearn_pro;
```

### Log Files

Logs are stored in `.manus-logs/`:
- `devserver.log` - Server startup and runtime
- `browserConsole.log` - Client-side errors
- `networkRequests.log` - API requests
- `sessionReplay.log` - User interactions

## API Documentation

### tRPC Routes

All API calls use tRPC with the following routers:

- `auth.*` - Authentication
- `user.*` - User profile
- `survey.*` - Survey operations
- `wallet.*` - Wallet and points
- `referral.*` - Referral system
- `withdrawal.*` - Withdrawal requests
- `admin.*` - Admin operations
- `notification.*` - Notifications

### Example API Call (Frontend)

```typescript
import { trpc } from "@/lib/trpc";

// Query
const { data: surveys } = trpc.survey.list.useQuery({ limit: 20 });

// Mutation
const submitSurvey = trpc.survey.submitResponse.useMutation({
  onSuccess: () => console.log("Survey submitted!"),
});

submitSurvey.mutate({
  surveyId: 1,
  answers: [{ questionId: 1, answer: "Option A" }],
});
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
- Verify MySQL is running
- Check DATABASE_URL is correct
- Ensure database exists

### OAuth Error

```
Error: Invalid OAuth credentials
```

**Solution:**
- Verify VITE_APP_ID matches Manus app
- Check OAUTH_SERVER_URL is correct
- Regenerate JWT_SECRET if needed

### Build Error

```
Error: Transform failed
```

**Solution:**
- Clear node_modules: `rm -rf node_modules pnpm-lock.yaml`
- Reinstall: `pnpm install`
- Rebuild: `pnpm build`

## Performance Optimization

### Frontend

- Code splitting with React Router
- Image optimization with WebP
- CSS minification with Tailwind
- Bundle analysis: `pnpm build --analyze`

### Backend

- Database query optimization with indexes
- Connection pooling with MySQL2
- tRPC caching with React Query
- Rate limiting on sensitive endpoints

### Database

```sql
-- Add indexes for common queries
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_survey_status ON surveys(status);
CREATE INDEX idx_response_user ON survey_responses(userId);
CREATE INDEX idx_transaction_user ON transactions(userId);
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Enable HTTPS in production
- [ ] Set secure cookies (httpOnly, secure, sameSite)
- [ ] Implement rate limiting
- [ ] Validate all user inputs
- [ ] Use parameterized queries (Drizzle ORM handles this)
- [ ] Enable CORS only for trusted domains
- [ ] Rotate database credentials regularly
- [ ] Monitor fraud logs for suspicious activity
- [ ] Implement audit logging for admin actions

## Support & Maintenance

### Regular Maintenance

- Monitor database size and growth
- Review fraud logs weekly
- Check withdrawal processing times
- Verify referral system accuracy
- Monitor server performance metrics

### Scaling Considerations

- Database replication for high traffic
- Redis caching for frequently accessed data
- CDN for static assets
- Load balancing for multiple server instances
- Async job processing for heavy operations

## License

MIT

## Contact

For support, visit https://help.manus.im
