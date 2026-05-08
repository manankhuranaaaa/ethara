# ⚡ Team Task Manager

A production-grade, enterprise-level team task management application built with Node.js, React, and PostgreSQL.

---

## 🚀 Quick Start (Docker)

```bash
# 1. Clone and enter the project
cd Ethara

# 2. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Start everything with one command
docker-compose up --build

# 4. Run migrations and seed data
docker exec taskmanager_backend npm run migrate
docker exec taskmanager_backend npm run seed
```

App will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm

### Backend

```bash
cd backend
cp .env.example .env        # Fill in your values
npm install
npm run migrate             # Run DB migrations
npm run seed                # Seed demo data
npm run dev                 # Start with nodemon
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # Vite dev server on :3000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `taskmanager` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 32 chars) | `your_secret_here` |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 32 chars) | `your_secret_here` |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |
| `RATE_LIMIT_LOGIN_MAX` | Max login attempts per window | `5` |
| `RATE_LIMIT_LOGIN_WINDOW_MS` | Rate limit window in ms | `900000` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover:
- Auth: register, login, duplicate email, weak password, invalid token
- Projects: create, validation
- Tasks: create, list, status update, validation
- Dashboard: stats endpoint
- RBAC: member cannot access admin routes or other users' projects

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login (rate limited: 5/15min) |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Invalidate refresh token |
| GET | `/api/auth/me` | ✅ | Get current user |

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users (paginated) |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id/role` | Change user role |
| DELETE | `/api/users/:id` | Deactivate user (soft delete) |

### Projects

| Method | Endpoint | Auth Level | Description |
|---|---|---|---|
| GET | `/api/projects` | Member | List own projects |
| POST | `/api/projects` | Member | Create project |
| GET | `/api/projects/:id` | Project Member | Get project details |
| PATCH | `/api/projects/:id` | Project Admin | Update project |
| DELETE | `/api/projects/:id` | Project Admin | Archive project |
| GET | `/api/projects/:id/members` | Project Member | List members |
| POST | `/api/projects/:id/members` | Project Admin | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Project Admin | Remove member |

### Tasks

| Method | Endpoint | Auth Level | Description |
|---|---|---|---|
| GET | `/api/projects/:id/tasks` | Project Member | List tasks (filterable) |
| POST | `/api/projects/:id/tasks` | Project Member | Create task |
| GET | `/api/tasks/:id` | Authenticated | Get task with comments |
| PATCH | `/api/tasks/:id` | Assignee/Admin | Update task |
| DELETE | `/api/tasks/:id` | Project Admin | Delete task |
| PATCH | `/api/tasks/:id/status` | Authenticated | Update status |
| PATCH | `/api/tasks/:id/assign` | Project Admin | Assign task |

### Comments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks/:id/comments` | Add comment |
| PATCH | `/api/comments/:id` | Edit own comment |
| DELETE | `/api/comments/:id` | Delete own comment |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Get dashboard statistics |

### Query Parameters (Tasks)

```
GET /api/projects/:id/tasks?status=todo&priority=high&assignee_id=uuid&is_overdue=true&search=keyword&page=1&limit=20
```

### Response Format

All endpoints return:
```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Valid email required" }]
}
```

---

## 🔒 Role Permission Table

### Global Roles

| Action | Admin | Member |
|---|---|---|
| View all users | ✅ | ❌ |
| Change user roles | ✅ | ❌ |
| Deactivate users | ✅ | ❌ |
| View all projects | ✅ | ❌ |
| View own projects | ✅ | ✅ |
| Create projects | ✅ | ✅ |

### Project-Level Roles

| Action | Project Admin | Project Member |
|---|---|---|
| Edit project details | ✅ | ❌ |
| Add/remove members | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Change any task status | ✅ | ❌ |
| Create tasks | ✅ | ✅ |
| Update assigned tasks | ✅ | ✅ (own only) |
| Add comments | ✅ | ✅ |
| Edit own comments | ✅ | ✅ |

---

## 🗄️ Database Schema

```
users ──────────────────────────────────────────────────────────
  id (UUID PK), name, email (UNIQUE), password_hash, role ENUM,
  avatar_url, is_active, refresh_token, created_at, updated_at

projects ───────────────────────────────────────────────────────
  id (UUID PK), name, description, owner_id (FK→users),
  status ENUM, due_date, created_at, updated_at

project_members ────────────────────────────────────────────────
  id (UUID PK), project_id (FK→projects), user_id (FK→users),
  role ENUM, joined_at
  UNIQUE(project_id, user_id)

tasks ──────────────────────────────────────────────────────────
  id (UUID PK), title, description, project_id (FK→projects),
  assignee_id (FK→users nullable), created_by (FK→users),
  status ENUM, priority ENUM, due_date, is_overdue,
  created_at, updated_at

task_comments ──────────────────────────────────────────────────
  id (UUID PK), task_id (FK→tasks CASCADE), user_id (FK→users),
  content, created_at, updated_at

activity_logs ──────────────────────────────────────────────────
  id (UUID PK), user_id (FK→users nullable), entity_type,
  entity_id (UUID), action, meta (JSONB), created_at
```

---

## 🎯 Demo Credentials

After running seeds:

| Role | Email | Password |
|---|---|---|
| Admin | admin@taskmanager.com | Password123! |
| Member | alice@taskmanager.com | Password123! |
| Member | bob@taskmanager.com | Password123! |
| Member | carol@taskmanager.com | Password123! |

---

## 📁 Project Structure

```
Ethara/
├── docker-compose.yml
├── backend/
│   ├── src/
│   │   ├── config/          # DB, JWT, Logger configs
│   │   ├── middleware/      # authenticate, rbac, errorHandler, validate
│   │   ├── models/          # Sequelize models + associations
│   │   ├── modules/
│   │   │   ├── auth/        # controller, service, routes, validators
│   │   │   ├── users/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── comments/
│   │   │   └── dashboard/
│   │   ├── jobs/            # Overdue detection cron
│   │   ├── migrations/      # Sequelize migrations
│   │   ├── seeders/         # Demo data
│   │   └── utils/           # response, pagination, activityLogger, asyncHandler
│   └── tests/
└── frontend/
    └── src/
        ├── api/             # Axios instance + endpoint functions
        ├── components/
        │   ├── ui/          # Reusable UI components
        │   └── layout/      # Navbar, Sidebar, AppLayout, ProtectedRoute
        ├── pages/           # auth, dashboard, projects, tasks, users
        ├── store/           # Zustand stores (auth, project, task)
        └── utils/           # formatters, constants, error helpers
```

---

## ⚙️ Advanced Features

- **Overdue Detection**: Cron job runs daily at midnight UTC, marks tasks as overdue, logs to activity_logs
- **Optimistic UI**: Task status changes update the UI immediately, revert on failure
- **Token Auto-Refresh**: Axios interceptor catches 401, silently refreshes token, retries original request
- **Soft Delete**: Users are never hard deleted, only `is_active = false`
- **Activity Logging**: Every create/update/delete writes to activity_logs with diff metadata
- **N+1 Prevention**: All list endpoints use Sequelize eager loading with `include`
- **Search & Filter**: Tasks support simultaneous filtering by status, priority, assignee, overdue, and text search
