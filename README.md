# Central Admin Platform

Secure central dashboard to manage **Budgeting Sathi** and **YantraMed** without merging their Firebase projects.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- PostgreSQL + Prisma 6
- Firebase Admin SDK (named apps per project)
- Local disk media storage (`storage/`)
- Custom admin sessions (bcrypt + jose httpOnly cookies)

## Prerequisites

1. Install **PostgreSQL** locally and create a database, e.g. `central_admin`
2. Copy env file and edit credentials:

```bash
copy .env.example .env
```

Set at least:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/central_admin?schema=public"
SESSION_SECRET="a-long-random-secret-at-least-32-characters"
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
```

Optional Firebase Admin credentials for each app (leave empty until ready):

```env
BUDGETING_SATHI_FIREBASE_PROJECT_ID=
BUDGETING_SATHI_FIREBASE_CLIENT_EMAIL=
BUDGETING_SATHI_FIREBASE_PRIVATE_KEY=

YANTRAMED_FIREBASE_PROJECT_ID=
YANTRAMED_FIREBASE_CLIENT_EMAIL=
YANTRAMED_FIREBASE_PRIVATE_KEY=
```

Use `\n` for newlines inside `PRIVATE_KEY` in `.env`.

## Setup

```bash
npm install
npx prisma migrate deploy
# or during development:
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

## Public mobile APIs

- `GET /api/v1/budgeting-sathi/banners`
- `GET /api/v1/yantramed/music`
- `GET /api/v1/yantramed/mantras`
- Media: `GET /api/storage/...`

When `PUBLIC_API_REQUIRE_KEY=true`, send `X-API-Key`.

## Account deletion (soft request)

- [http://localhost:3000/delete-account/budgeting-sathi](http://localhost:3000/delete-account/budgeting-sathi)
- [http://localhost:3000/delete-account/yantramed](http://localhost:3000/delete-account/yantramed)

Requests appear under **Account Deletion** in the admin dashboard for approve/reject.

## Storage layout

```text
storage/
  banners/budgeting-sathi/
  yantramed/music/
  yantramed/mantras/
```

## Firebase note

This admin app does **not** embed the Firebase Web CDN `<script>`.

- Banner / music / mantra APIs and disk storage work with **zero** Firebase traffic.
- Listing Auth users is optional and only runs when you open a Users page (or click “Test connection”).
- Keep the Web SDK/`apiKey` config inside Budgeting Sathi and YantraMed mobile/web clients.
