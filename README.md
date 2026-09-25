# Isa Moh Mobile Shop — MERN Stack

A full-featured e-commerce platform for mobile phones and accessories built with MongoDB, Express, React, and Node.js.

## Project Structure

```
isamoh-mobile-shop/
├── backend/          Express API + MongoDB
│   ├── models/       Mongoose schemas
│   ├── routes/       REST API routes
│   ├── middleware/   JWT auth, file upload
│   ├── utils/        Mailer, token helpers
│   └── server.js     Entry point
└── frontend/         React + Vite
    └── src/
        ├── pages/    All frontend pages
        ├── admin/    Admin panel
        ├── components/
        ├── context/  Auth, Cart, Currency, Theme, Language
        ├── hooks/    usePageTitle
        └── i18n/     English + Amharic translations
```

## Features

- 🛍️ Product catalog with search, filter, sort
- 🛒 Cart, Wishlist, Checkout
- 👤 User auth (JWT + httpOnly cookies)
- 🔐 Admin panel (products, orders, users, blog, coupons, banners, settings)
- 🌙 Dark mode
- 🌐 English / Amharic language switch
- 📱 Fully responsive (mobile-first)
- 📧 Order confirmation emails
- 💳 Multiple payment methods (COD, Bank, Telebirr, CBE Birr)

## Local Development

### Step 1 — Backend
```bash
cd backend
npm install
cp .env.example .env    # fill in your values
npm run dev             # starts on http://localhost:5000
```

### Step 2 — Frontend
```bash
cd frontend
npm install
npm run dev             # starts on http://localhost:5173
```

### Step 3 — Open in browser
- Shop:  http://localhost:5173
- Admin: http://localhost:5173/admin

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random secret (min 32 chars) |
| `NODE_ENV` | `development` or `production` |
| `CLIENT_URL` | Your frontend URL (for CORS) |
| `SMTP_USER` | Gmail address for sending emails |
| `SMTP_PASS` | Gmail App Password |

## Deployment (Railway)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set root directory to `backend/`
4. Add all `.env` variables in the Railway dashboard
5. For the frontend: build with `npm run build` and serve from `backend/public/client/`

## Admin Access

Register an account on the site, then promote it to `superadmin` directly in MongoDB:

```
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "superadmin" } })
```
