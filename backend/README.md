# Skillmate Backend

This folder contains a minimal Express backend that connects to Supabase (Postgres) to implement users, services, orders, messaging and admin actions.

Quick setup:

1. Copy `.env.example` to `.env` and fill `SUPABASE_URL`, `SUPABASE_KEY` (service_role key recommended for server-side), and `JWT_SECRET`.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Create the database schema in your Supabase project: run the SQL in `db/schema.sql` via the SQL editor in Supabase.

4. Start the server:

```bash
npm start
```

Where to put Supabase credentials:
- Put `SUPABASE_URL` and `SUPABASE_KEY` in your `.env` file at `backend/.env`.
- The backend reads them from environment variables.

Notes about payments simulation:
- The DB includes an atomic function `create_order_with_transfer(buyer_id, service_id)` which creates the order and transfers funds between buyer and seller balances. This simulates real payment logic while remaining UI-only for third-party payment providers.
