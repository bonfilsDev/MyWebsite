 HEAD
# Stream Pharmacy - Cashier & Sales Management System

A web-based daily reporting system for a pharmacy with role-based access (Admin & Cashier).

## Tech Stack

- **Backend:** Node.js, Express, MySQL (mysql2), JWT authentication (bcryptjs)
- **Frontend:** React.js, Vite, React Router, TailwindCSS
- **Database:** MySQL

## Features

### Admin
- Login to dashboard with **username OR email** (plus a dedicated **"Continue with Email"** option on the login form)
- **Notification bell** in the header — shows login/log email notifications with an unread badge
- After logging in, a **notification is recorded** in-app, and a **login notification email** is sent to your email address (once SMTP is configured)
- Manage cashier accounts (create, edit, delete; give username, **email** & password)
- **My Account** page — set your own email/password so you can log in with email
- View all daily reports and payment breakdown
- See everything cashiers enter: sales reports, **expenses, cashouts, insurance** (new pages)
- **Daily Activity** page — one view of a whole day across all cashiers (sales by shift, expenses, insurance, purchases, cashouts) with cashier filter
- **Purchases**: filterable list plus a **Supplier Balance** report showing total amount, total paid, and **total remain to pay per supplier**
- Manage insurance company names (add / delete) — new options appear instantly on cashier Insurance screen
- Filter reports by date range and cashier
- Weekly & daily statistics (cash, momo, credit, POS, E-Kashi, insurance credit, total, balance)

### Cashier
- Login with credentials given by admin
- Professional dashboard with left-side menu: **Sales, Expenses, Purchases, Cashout, Insurance, Report**
- **Sales:** choose date, choose shift (Morning / Evening / Night), enter cash, momo, e-kashi, credit, POS — total calculated automatically, enter balance remaining
- **Expenses:** number, date, reasons, amount, way — with edit/delete actions
- **Purchases:** date, shift (Morning / Evening / Night), payment (in cash / in credit), amount, invoice number, supplier name — with edit/delete actions
- **Cashout:** date, cashout amount, cashout account, cashout person/reason
- **Insurance:** select insurance company (RSSB, OLDMUTUAL, PRIME INSURANCE, RADIANT, SANLAM, EDEN CARE, BRITAM, UBUZIMA BWIZA FOUNDATION, MMI, EQUITY), enter multiple clients with name & amount per company, auto-summed per day with grand total
- **Report:** view all details of a chosen day — sales by shift, expenses, insurance, purchases, cashouts — with search by date

## Folder Structure

```
bonfilskamugisha/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── server.js           # App entry
│   │   ├── config/db.js        # MySQL connection pool
│   │   ├── middleware/auth.js  # JWT auth
│   │   └── routes/             # auth, cashiers, reports, stats, expenses, purchases, cashouts, insurance
│   ├── database/schema.sql     # DB schema & seed data
│   ├── .env                    # DB + JWT config
│   └── package.json
├── frontend/                   # React.js + Vite app
│   ├── src/
│   │   ├── api/client.js       # Axios instance with JWT header
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   ├── pages/admin/        # Overview, Cashiers, Reports, Purchases, Expenses, Cashouts, Insurance, Insurance Companies, Daily Activity
│   │   └── pages/cashier/      # modules: Sales, Expenses, Purchases, Cashout, Insurance, Report
│   └── package.json
└── package.json                # Root convenience scripts
```

## Installation

1. **Create Database:**
   - Open phpMyAdmin or MySQL CLI
   - Import `backend/database/schema.sql`
   - This creates database `stream_pharmacy`, all tables, default admin user, and DB user `pharmacy_user` (password `pharmacy_pass_2026`)

2. **Configure backend (if different):**
   - Edit `backend/.env` with your MySQL credentials and JWT secret
   - To receive **email notifications on login**, uncomment the `SMTP_*` lines in `backend/.env` and fill in your SMTP credentials (e.g. Gmail: enable 2-Step Verification, create an **App Password**, use `smtp.gmail.com`, port `587`). Emails are skipped until SMTP is configured — in-app notifications still work.

3. **Install dependencies:**
   ```
   npm run install:all
   ```

4. **Start the app (development):**
   ```
   npm run dev
   ```
   - Backend runs on `http://localhost:5000`
   - Frontend runs on `http://localhost:5173` (proxy forwards `/api` to the backend)

## Default Admin Login

- **Username:** `admin` (or the email set under **My Account**, e.g. `admin@streampharmacy.com`)
- **Password:** `password`

> Important: Change the default admin password after first login by editing the DB or extend the app with a change-password feature.

## Shifts

- Morning (1)
- Evening (2)
- Night (3)

## Notes

- Total is calculated automatically server-side and client-side as the sum of cash + momo + credit + pos + e-kashi + insurance credit.
- Unique constraint prevents duplicate reports for the same cashier, date, and shift.
- Insurance credit in the Sales module is auto-loaded from the same date's insurance records.
=======
# MyWebsite
stream pharmacie project
 f8e72017fc1b9fded8747d479342304825992a83
