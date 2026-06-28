# Tongues Trend — Backend API

NestJS REST API for the Tongues Trend language learning platform.

## Stack
- **Framework:** NestJS 10
- **Database:** MongoDB + Mongoose
- **Auth:** Custom JWT (Passport.js)
- **Payments:** M-Pesa Daraja + Stripe
- **Storage:** Cloudinary
- **Email:** Nodemailer
- **Docs:** Swagger at `/api/docs`

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Fill in your values in .env

# Run in development
npm run start:dev

# API: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

## Modules
| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | /api/v1/auth | Register, login, refresh, logout |
| Users | /api/v1/users | User management |
| Courses | /api/v1/courses | Language courses |
| Modules | /api/v1/modules | Course modules by CEFR level |
| Materials | /api/v1/materials | Uploaded learning materials |
| Enrollments | /api/v1/enrollments | Learner enrollments |
| Sessions | /api/v1/sessions | Booking & scheduling |
| Payments | /api/v1/payments | M-Pesa + Stripe |
| Certificates | /api/v1/certificates | Auto-generated on completion |

## Scripts
```bash
npm run start:dev    # development with watch
npm run build        # production build
npm run start:prod   # run production build
npm run test         # unit tests
npm run test:e2e     # end-to-end tests
npm run lint         # eslint
```
