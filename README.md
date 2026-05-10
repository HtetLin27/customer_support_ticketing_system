# Customer Support Ticketing System

A full-stack helpdesk and ticket management platform built with React, Express, PostgreSQL, and Socket.IO.

The system supports role-based workflows for customers, agents, and admins, including real-time ticket updates, comment threads, internal notes, assignment flows, and reporting dashboards.

## Features

- Role-based access control for `customer`, `agent`, and `admin`
- End-to-end ticket lifecycle management:
  - create, assign, reassign, status transitions, delete
- Public comments and internal notes
- Real-time updates using Socket.IO:
  - ticket updates, comments, typing indicators, notifications
- Admin dashboards:
  - ticket volume, agent performance, status distribution, workload view
- Notification center with unread tracking
- PostgreSQL migrations and seeders for reproducible local setup

## Tech Stack

- Frontend: React, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express, Sequelize ORM, JWT auth
- Database: PostgreSQL
- Realtime: Socket.IO
- Tooling: Sequelize CLI, Prettier

## Repository Structure

```text
ticketing-system/
├─ client/      # React frontend
├─ server/      # Express API + Sequelize models/migrations
├─ docker-compose.yml
└─ package.json # root formatting scripts
```

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm
- Docker Desktop (for local PostgreSQL via Docker Compose)

## Environment Configuration

### Server

Copy `server/.env.example` to `server/.env` and set values:

```bash
cp server/.env.example server/.env
```

Minimum required:

- `JWT_SECRET`
- database values (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`)

### Client

Copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

Defaults target local backend:

- `REACT_APP_API_URL=http://localhost:5002/api`
- `REACT_APP_SOCKET_URL=http://localhost:5002`

## Local Development Setup

1. Install dependencies:

```bash
cd client && npm install
cd ../server && npm install
cd ..
```

2. Start PostgreSQL (and optional pgAdmin):

```bash
docker compose up -d postgres
# optional:
docker compose up -d pgadmin
```

3. Run migrations and seed data:

```bash
cd server
npm run migrate
npm run seed
```

4. Start backend:

```bash
cd server
npm run dev
```

5. Start frontend (new terminal):

```bash
cd client
npm start
```

## Application URLs

- Frontend: `http://localhost:3000`
- API health: `http://localhost:5002/health`
- pgAdmin (optional): `http://localhost:5050`

## Demo Accounts (Seeded)

After `npm run seed`, you can log in with:

- Admin: `admin@ticketing.dev`
- Agent: `alice@ticketing.dev`
- Customer: `bob@ticketing.dev`
- Password for all: `password123`

## Scripts

### Root

```bash
npm run format
npm run format:check
```

### Client

```bash
cd client
npm start
npm run build
npm run format
npm run format:check
```

### Server

```bash
cd server
npm run dev
npm run start
npm run migrate
npm run seed
npm run format
npm run format:check
```

## API Overview

Base URL: `http://localhost:5002/api`

- Auth: `/auth/*`
- Tickets: `/tickets/*`
- Ticket comments: `/tickets/:ticketId/comments/*`
- Notifications: `/notifications/*`
- Admin routes: `/admin/*`
- Users/workload routes: `/users/*`

## Troubleshooting

- Socket connection refused (`/socket.io`):
  - ensure backend is running on `:5002`
  - verify `REACT_APP_SOCKET_URL` in `client/.env`
- DB or relation errors:
  - rerun migrations: `cd server && npm run migrate`
- Auth errors (`401/403`):
  - verify token is present and user role has access to the route

## Notes

- This project currently uses JavaScript in both frontend and backend.
- Formatting is managed through Prettier with shared root config.
