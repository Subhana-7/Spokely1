<div align="center">

# 🗣️ Spokely  

**A real-time speaking-practice & mentorship platform for building spoken communication skills.**

Spokely connects learners with verified mentors and peers for live 1:1 and group speaking sessions — combining video calling, real-time chat, AI-generated daily practice tasks, subscriptions, and progress tracking into a single platform.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](#license)

[Live App](https://spokely.live) · [Report Bug](https://github.com/Subhana-7/Spokely/issues) · [Request Feature](https://github.com/Subhana-7/Spokely/issues)

</div>

---

## Table of Contents

- [About](#about)
- [Key Features](#key-features)
  - [Learner (User)](#learner-user)
  - [Mentor](#mentor)
  - [Admin](#admin)
  - [Platform-wide](#platform-wide)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [API Documentation](#api-documentation)
- [Core Domain Model](#core-domain-model)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## About

**Spokely** is a full-stack, TypeScript-first platform designed to help people improve spoken English and communication skills through live practice rather than passive lessons. Learners can:

- Get matched with **mentors** for structured, paid coaching sessions
- Practice with **peers** in free-form public or private speaking rooms
- Complete **AI-generated daily tasks** (writing, reading, speaking, listening) with automated feedback
- Track progress through streaks, levels, and completion rates

The backend is built as a **layered, dependency-injected TypeScript service** (Controller → Service → Repository → Model, with DTOs and mappers at each boundary) rather than a typical monolithic Express app — making the codebase testable, swappable, and easy to extend.

## Key Features

### Learner (User)

- 🔐 Email/password signup with OTP verification, plus Google OAuth login
- 🔑 Forgot-password flow via OTP
- 🧑‍🏫 Mentor discovery & listing, with mentor profile pages
- 🤝 Peer connections — send/accept/reject requests, block/unblock, remove
- 📅 Session scheduling — public, private, and peer-to-peer speaking sessions
- 🎥 Live video/audio calls powered by **Agora RTC**
- 💬 Real-time in-session chat (Socket.IO, persisted history)
- 🔔 Real-time notifications
- 🧠 AI-generated **daily language tasks** (writing / reading / speaking / listening) with feedback, powered by **Groq LLM**
- 📈 Gamification — streaks, levels, completion rate, sessions completed
- 💳 Subscribe to mentor plans (Daily / Weekly / Biweekly / Triweekly) with **PayPal** checkout
- 👛 Personal wallet with credit/debit transaction history
- 🚩 Flag inappropriate sessions/users, leave session feedback & ratings

### Mentor

- 📝 Mentor signup with **document verification** workflow (upload credentials for admin review)
- ✅ Resubmit rejected verification documents
- 📊 Mentor dashboard — students, sessions, earnings
- 🗓️ Define custom subscription plans and pricing tiers
- 👥 View and manage subscribed students
- 💬 Chat & video call with connected students
- ✏️ Profile management & password change

### Admin

- 📊 Central dashboard with platform analytics
- 👤 User & mentor management (list, block/unblock)
- 🪪 Review, approve, or reject mentor verification documents
- 📅 View all sessions across the platform
- 💰 View all payments / transaction records
- 🗂️ Monitor daily tasks generated across users
- 📄 Generate & download **PDF reports**
- 🔐 Dedicated JWT-based admin auth (separate from user/mentor auth)

### Platform-wide

- 🔒 Role-based JWT authentication (`user` / `mentor` / `admin`) with access + refresh tokens, delivered via `httpOnly` cookies
- 🌐 Google OAuth 2.0 single sign-on
- ⚡ Real-time layer via Socket.IO (chat, notifications, presence)
- 📹 Agora token generation for secure video/audio channels
- 💵 PayPal order & subscription payment capture
- 📧 Transactional email via Nodemailer / Resend (OTPs, verification, alerts)
- 🕐 Scheduled jobs (`node-cron`) for subscription expiry/renewal handling
- 🛡️ Hardened HTTP headers via Helmet, CORS locked to known origins
- 📜 Request logging with Morgan + rotating log files
- 📘 OpenAPI/Swagger specification for the REST API

## Architecture

The backend follows a **clean, layered architecture** with inversion of control, rather than putting logic directly in route handlers:

```
Request
  │
  ▼
Routes            → maps HTTP endpoints to controllers
  │
  ▼
Controllers        → parse/validate requests, call services, shape responses
  │
  ▼
Services            → business logic, orchestration
  │
  ▼
Repositories       → data access abstraction over Mongoose models
  │
  ▼
Models (MongoDB)   → schema definitions
```

Supporting patterns used throughout:

- **Dependency Injection** via [InversifyJS](https://inversify.io/) — controllers/services/repositories are bound as interfaces (`IUserService`, `IUserRepository`, …) in `config/inversify.config.ts`, making components mockable and swappable
- **DTOs** (`src/dto`) — define the shape of data crossing layer boundaries
- **Mappers** (`src/mappers`) — convert between persistence models and DTOs/response shapes
- **Interfaces** (`src/**/interfaces`) — every controller/service/repository is programmed against an interface, not a concrete class

Real-time features (chat, notifications) run over a single **Socket.IO** server attached to the same HTTP server as the REST API, sharing the DI container so socket handlers can call the same services as HTTP controllers.

## Tech Stack

### Backend

| Category | Technology |
|---|---|
| Language / Runtime | TypeScript, Node.js |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Architecture | Layered (Controller/Service/Repository) + InversifyJS (DI) |
| Auth | JWT (access + refresh), Passport.js (Google OAuth 2.0), bcrypt |
| Real-time | Socket.IO |
| Video/Audio | Agora RTC SDK + Agora Access Token |
| Payments | PayPal REST API |
| AI | Groq SDK (LLM-generated daily tasks) |
| Email | Nodemailer, Resend |
| Reporting | PDFKit, ExcelJS |
| Scheduling | node-cron |
| Security / Ops | Helmet, CORS, cookie-parser, Morgan + rotating-file-stream |
| API Docs | Swagger UI Express (OpenAPI 3.0) |

### Frontend

| Category | Technology |
|---|---|
| Language | TypeScript |
| Framework | React 19 + Vite |
| Styling | Tailwind CSS 4 |
| State Management | Zustand |
| Routing | React Router 7 |
| Real-time | Socket.IO Client |
| Video/Audio | Agora RTC SDK |
| Payments | PayPal JS SDK |
| Media Storage | Cloudinary |
| HTTP | Axios |
| UI/UX | Framer Motion, Lucide Icons, React Hot Toast, Recharts |

## Monorepo Structure

```
Spokely/
├── backend/
│   ├── src/
│   │   ├── app.ts                   # Express app, middleware, Socket.IO bootstrap
│   │   ├── config/                  # DB, Agora, Groq, PayPal, Passport, Socket, DI container
│   │   ├── controllers/             # Request handlers (+ interfaces/)
│   │   ├── services/                # Business logic (+ interfaces/)
│   │   ├── repositories/            # Data access layer (+ interfaces/)
│   │   ├── models/                  # Mongoose schemas
│   │   ├── dto/                     # Data transfer objects
│   │   ├── mappers/                 # Model <-> DTO transformation
│   │   ├── routes/                  # Express routers per domain
│   │   ├── middleware/              # Auth guard, request logger
│   │   ├── types/                   # Shared TS types (roles, tokens, requests)
│   │   ├── utilis/                  # Constants, status codes, token helpers
│   │   └── docs/                    # OpenAPI specification
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/                   # user/, mentor/, admin/, chat/, Sessions/
│   │   ├── components/              # Shared + role-specific components
│   │   ├── modals/                  # Auth, OTP, password, mentor-onboarding modals
│   │   ├── services/                # API clients per domain
│   │   ├── store/                   # Zustand auth stores (user, admin)
│   │   ├── hooks/                   # Custom hooks (auth init, debounce)
│   │   ├── api/                     # Axios instance/config
│   │   └── routes.tsx                # Route definitions & guards
│   └── package.json
└── config.yml                       # Cloudflare tunnel / ingress configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- Accounts/credentials for the third-party services below:
  - [Agora](https://www.agora.io/) (App ID + Certificate, for video calls)
  - [PayPal Developer](https://developer.paypal.com/) (REST app credentials)
  - [Groq](https://console.groq.com/) (API key for LLM task generation)
  - [Google Cloud Console](https://console.cloud.google.com/) (OAuth 2.0 credentials)
  - [Cloudinary](https://cloudinary.com/) (unsigned upload preset, for frontend image uploads)
  - [Resend](https://resend.com/) and/or a Gmail account (for transactional email)

### Installation

Spokely is split into two independent apps — install each separately.

```bash
git clone https://github.com/Subhana-7/Spokely.git
cd Spokely

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Environment Variables

**`backend/.env`**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URL=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_token_secret
SESSION_SECRET=your_session_secret
SESSION_MAX_AGE=86400000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/users/google/callback

# Email
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password
EMAIL_FROM=noreply@spokely.live
RESEND_API_KEY=your_resend_api_key

# Agora (video/audio calls)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
AGORA_EXPIRATION_TIME=3600

# PayPal
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Groq (AI daily tasks)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# CORS / Client
CLIENT_SIDE_URL=http://localhost:5173
```

**`frontend/.env`**

```env
VITE_SERVER_SIDE_URL=http://localhost:5000
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
VITE_CLOUDINARY_UPLOAD_URL=https://api.cloudinary.com/v1_1/your_cloud_name/image/upload
```

> ⚠️ Both `app.ts` and the session cookie config currently hardcode production values (`spokely.live` domain, `secure: true`, PayPal live URL patterns). When running locally, switch these back to the commented-out "system run" blocks in `app.ts`, or make them environment-driven — see [Roadmap](#roadmap).

### Running Locally

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

## API Documentation

The backend exposes a Swagger/OpenAPI specification (`backend/src/docs/openapi.yaml`) served via `swagger-ui-express`. Once the backend dependency wiring for the docs route is enabled, the interactive docs are available at:

```
http://localhost:5000/api-docs
```

> The current spec only documents a subset of endpoints. Given the number of domains (users, mentors, sessions, subscriptions, payments, chat, connections, daily tasks, notifications, admin), expanding this file is a high-value contribution — see [Roadmap](#roadmap).

## Core Domain Model

| Entity | Purpose |
|---|---|
| `User` | Learner accounts — profile, streak, level, completion rate |
| `Mentor` | Mentor accounts — profile, bio, tags, verification document/status |
| `Admin` | Platform administrator accounts |
| `Connection` | Peer relationship between two users (pending/accepted/blocked) |
| `Session` | A speaking session (public/private/peer-to-peer) with participants, status, feedback, flags |
| `Message` / `ChatSession` | Persisted chat messages tied to a session |
| `Notification` | User/mentor notifications (info/warning/success) |
| `Subscription` | A user's active subscription to a mentor's plan |
| `MentorPlan` | Pricing tiers a mentor offers (Daily/Weekly/Biweekly/Triweekly) |
| `Payment` | PayPal order/subscription payment records |
| `Wallet` | Per-user balance + credit/debit transaction ledger |
| `DailyTask` | AI-generated writing/reading/speaking/listening task + user responses + feedback |

## Available Scripts

**Backend** (`backend/package.json`)

| Command | Description |
|---|---|
| `npm run dev` | Start in watch mode with `ts-node-dev` |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`dist/app.js`) |
| `npm run lint` / `npm run lint:fix` | Lint (and auto-fix) with ESLint |

**Frontend** (`frontend/package.json`)

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint with ESLint |

## Deployment

- **Frontend** — deployed on [Vercel](https://vercel.com/) (`frontend/vercel.json` handles SPA rewrites)
- **Backend** — served behind a Cloudflare Tunnel (`config.yml`), proxying `spokely-frontend`/`spokely-api` hostnames to `api.spokely.live`
- Live at **[spokely.live](https://spokely.live)**

## Roadmap

- [ ] Add a root-level `.env.example` for both `backend/` and `frontend/`
- [ ] Move hardcoded production values (CORS origins, cookie domain, PayPal URL) fully behind environment variables
- [ ] Expand `openapi.yaml` to cover all route groups
- [ ] Add automated tests (unit + integration) — currently no test runner is configured
- [ ] Add CI (lint, type-check, build) on pull requests
- [ ] Dockerize backend + frontend for one-command local setup

## Contact

**Subhana** — [GitHub Profile](https://github.com/Subhana-7)

Project Link: [https://github.com/Subhana-7/Spokely](https://github.com/Subhana-7/Spokely)

Linkedin — [Linkedin Profile](https://www.linkedin.com/in/subhana-sn-4b4b50307/)
