# Smart Campus Lost & Found

A cross-platform lost-and-found system for ITUM: an Expo mobile app for reporting and browsing items, plus a Node.js API that ranks possible matches between lost and found reports.

![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)

## Overview

Students report an item as **LOST** or **FOUND** with its category, campus zone, date, colour, description, and a private identifying detail. The API scores every opposing active report using a weighted similarity function and notifies both owners when the score passes a configurable threshold. The finder can then claim the item by reproducing the private detail, and both listings are closed in one transaction.

Accounts are restricted to a university email domain (`itum.mrt.ac.lk` by default).

## Features

- Email/password authentication with scrypt password hashing and HMAC-signed access tokens (30-minute lifetime).
- Browse, search, and filter listings by kind.
- Report an item with a camera or gallery photo, uploaded to Cloudinary when configured.
- Deterministic weighted matching with persisted match records and in-app notifications.
- Claim flow with a hashed private detail, three verification attempts, and atomic status updates.
- Responsive Expo Router UI built with HeroUI Native, Uniwind, and Tailwind CSS, with automatic light/dark mode.
- Token storage in Expo SecureStore on iOS and Android.

## Repository layout

```text
.
├── mobile/                  Expo app (Expo Router, TypeScript)
│   ├── src/app/             Screens and route layouts
│   ├── src/components/      Shared UI components
│   ├── src/providers/       Auth and listing data providers
│   ├── src/api.ts           API client, session storage, photo upload
│   ├── src/domain.ts        Listing types, categories, campus zones
│   ├── DESIGN.md            Visual and interaction contract
│   └── global.css           Theme tokens
└── server/                  Node.js API
    ├── src/server.js        HTTP server and routes
    ├── src/auth.js          Password hashing and access tokens
    ├── src/matching.js      Match scoring and claim lookup
    ├── src/matching.test.js Unit tests
    ├── src/evaluation.js    Threshold evaluation on a synthetic dataset
    └── prisma/              Schema and seed data
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- PostgreSQL (local instance or hosted)
- Expo Go on a phone, or an Android/iOS simulator

### 1. API

```bash
cd server
npm install
cp .env.example .env
```

Set `DATABASE_URL` and `JWT_SECRET` in `server/.env`, create the database, then apply the schema and seed the campus categories and zones:

```bash
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

The API listens on `http://localhost:43127` (port 4000 is commonly reserved on Windows). Use `npm start` instead of `npm run dev` to run without file watching.

### 2. Mobile app

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

Press `a` for Android, `i` for iOS, or `w` for the web build, or scan the QR code with Expo Go.

Point the app at the API from `mobile/.env`:

```text
EXPO_PUBLIC_API_URL=http://localhost:43127
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset
```

- On a physical phone, replace `localhost` with the host machine's LAN address, e.g. `http://192.168.1.20:43127`.
- The Android emulator reaches the host at `http://10.0.2.2:43127`.
- Photo upload is optional; without the Cloudinary values, reports can still be filed without an image.
- For the web build, add the web origin to `ALLOWED_ORIGINS` on the server (defaults to `http://localhost:8081`).

## Environment variables

### `server/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `43127` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `DATABASE_URL` | — | PostgreSQL connection string (required) |
| `JWT_SECRET` | random per start | Token signing secret; set it so tokens survive restarts |
| `UNIVERSITY_EMAIL_DOMAIN` | `itum.mrt.ac.lk` | Domain allowed to register |
| `MATCH_THRESHOLD` | `0.6` | Minimum score (0–1) for a match |
| `ALLOWED_ORIGINS` | `http://localhost:8081` | Comma-separated CORS allowlist |

### `mobile/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://localhost:43127` | API base URL |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | — | Cloudinary cloud name |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | — | Unsigned upload preset |

Never commit real `.env` files or secrets.

## API

All responses wrap payloads in `{ "data": ... }`. Errors use:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid listing data", "details": {} } }
```

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Service and database status |
| `POST` | `/api/auth/register` | — | Register with university email, display name, password (8+ characters) |
| `POST` | `/api/auth/login` | — | Sign in and receive an access token |
| `GET` | `/api/listings?kind=LOST\|FOUND` | — | List reports, newest first |
| `POST` | `/api/listings` | Bearer | Create a report and return its matches |
| `GET` | `/api/listings/:id/matches` | — | Ranked matches for a report |
| `GET` | `/api/notifications` | Bearer | Match and claim notifications for the current user |
| `POST` | `/api/listings/:id/claims` | Bearer | Claim an item with the private detail |

Authenticated requests use `Authorization: Bearer <accessToken>`.

## How matching works

Only reports of opposite kinds (`LOST` vs `FOUND`) are compared, and only `ACTIVE` listings are candidates. The score is a weighted sum of four signals:

| Signal | Weight | Rule |
| --- | --- | --- |
| Category | 0.35 | Exact match or nothing |
| Location | 0.25 | Same zone scores 1, adjacent zones 0.6, otherwise 0 |
| Date | 0.15 | Linear decay over 14 days |
| Text | 0.25 | Jaro–Winkler similarity of title, description, and colour |

Matches at or above `MATCH_THRESHOLD` are persisted and both owners receive a notification. A claim is accepted only when the claimant owns the counterpart report of an existing match, and the private detail matches the scrypt hash stored when the listing was created.

## Evaluation and tests

```bash
cd server
npm test                       # matching, auth, and claim-lookup tests
node src/evaluation.js         # precision/recall/F1 across thresholds on a synthetic dataset
```

The evaluation sweeps thresholds from 0.60 to 0.85 and prints the best F1 alongside all results.

## Notes and limitations

- Claim attempt counters are kept in memory and reset when the API restarts.
- Listing responses are not paginated yet; the API returns page 1 of all results.
- Prisma migrations are generated locally (`prisma/migrations/` is gitignored).
- If `JWT_SECRET` is unset, a random secret is generated at startup and existing tokens are invalidated on restart.

## Tech stack

**Mobile:** Expo SDK 58, React Native 0.88, React 19, Expo Router, TypeScript, HeroUI Native, Uniwind, Tailwind CSS 4, Reanimated, Expo SecureStore, Expo Image Picker.

**Server:** Node.js HTTP module, Prisma 6, PostgreSQL, Node test runner.
