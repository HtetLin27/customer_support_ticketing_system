# Customer Support Ticketing System

Full-stack customer support platform with role-based workflows, real-time updates, and operational dashboards.

## Overview

This project simulates a production-style support desk where:

- Customers create and track support tickets
- Agents work assigned tickets and reply to customers
- Admins manage assignment, user roles, and reporting

The app includes real-time ticket updates, comment threads, internal notes, workload visibility, and analytics endpoints for reporting views.

## Core Features

- Authentication with JWT (`register`, `login`, `me`)
- Role-based access (`customer`, `agent`, `admin`)
- Ticket lifecycle:
  - Create, update, assign, auto-assign, reassign, status transitions, history
- Commenting system:
  - Public replies and internal notes
  - Edit/delete constraints by role
- Real-time Socket.IO events:
  - Ticket updates
  - Comment events
  - Typing indicators
  - Notifications
- Admin dashboards:
  - Ticket volume report
  - Agent performance report
  - Ticket status distribution
  - Agent workload

## Tech Stack

- Frontend: React, React Router, Tailwind CSS, Axios, Socket.IO Client
- Backend: Node.js, Express, Sequelize ORM, Socket.IO, JWT
- Database: PostgreSQL
- Tooling: Docker Compose, Sequelize CLI, Prettier

## Monorepo Structure

```text
ticketing-system/
├── client/                 # React frontend
├── server/                 # Express + Sequelize backend
├── docker-compose.yml      # Local PostgreSQL + pgAdmin
├── package.json            # Root format scripts
├── .prettierrc.json
└── .prettierignore
```

## Local Setup

### 1. Prerequisites

- Node.js 18+
- npm
- Docker Desktop

### 2. Install Dependencies

```bash
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Environment Variables

Create env files from examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Important values:

- `server/.env`
  - `JWT_SECRET` (required)
  - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `client/.env`
  - `REACT_APP_API_URL=http://localhost:5002/api`
  - `REACT_APP_SOCKET_URL=http://localhost:5002`

### 4. Start Database

```bash
docker compose up -d postgres
```

Optional:

```bash
docker compose up -d pgadmin
```

### 5. Run Migrations + Seed Data

```bash
cd server
npm run migrate
npm run seed
```

### 6. Run the App

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
npm start
```

## Default URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002`
- Health check: `http://localhost:5002/health`
- pgAdmin: `http://localhost:5050`

## Seeded Demo Accounts

After running seeders:

- Admin: `admin@ticketing.dev`
- Agent: `alice@ticketing.dev`
- Customer: `bob@ticketing.dev`
- Password: `password123`

## Available Scripts

### Root

```bash
npm run format
npm run format:check
```

### Client (`client/package.json`)

```bash
npm start
npm run build
npm run test
npm run format
npm run format:check
```

### Server (`server/package.json`)

```bash
npm run dev
npm run start
npm run test
npm run migrate
npm run seed
npm run format
npm run format:check
```

## API Surface (High-Level)

Base: `/api`

- Auth: `/auth`
- Tickets: `/tickets`
- Comments: `/tickets/:ticketId/comments`
- Notifications: `/notifications`
- Admin: `/admin`
- Users: `/users`

## Production Notes

- Configure secure values for:
  - `JWT_SECRET`
  - DB credentials
  - Mail credentials
- Use HTTPS and stricter CORS rules
- Add monitoring, rate limiting, and structured logging
- Add CI checks for tests + formatting

## License

This project is currently unlicensed for public reuse.
