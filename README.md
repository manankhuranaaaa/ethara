# ⚡ Team Task Manager

A team task management web application built with React, Node.js, and PostgreSQL.

**Live:**
- Frontend: https://ethara-nine-gold.vercel.app
- Backend API: https://ethara-backend-jyyx.onrender.com

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Zustand (state management)
- Axios (with auto token refresh interceptor)
- Tailwind CSS
- Recharts (dashboard charts)
- React Hook Form + Zod (form validation)
- React Hot Toast (notifications)

**Backend**
- Node.js + Express.js
- PostgreSQL + Sequelize ORM
- JWT (access token 15m + refresh token 7d via httpOnly cookie)
- bcryptjs (password hashing, 12 rounds)
- express-validator (input validation)
- helmet + cors + rate-limiter-flexible (security)
- node-cron (overdue task detection)
- winston (structured logging)

---

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+

### Backend

```bash
cd backend
cp .env.example .env    # fill in your values
npm install
npm run migrate         # run DB migrations
npm run seed            # load demo data
npm run dev             # nodemon on :5000
```

### Frontend

```bash
cd frontend
cp .env.example .env    # set VITE_API_URL
npm install
npm run dev             # vite on :3000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://localhost:5432/project_management` |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | `https://ethara-nine-gold.vercel.app` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL — **must end with `/api`** | `https://ethara-backend-jyyx.onrender.com/api` |

---

## 🧪 Tests

```bash
cd backend
npm test
```

Covers: auth (register, login, duplicate email, weak password, invalid token), projects, tasks, dashboard stats, RBAC enforcement.

---

## 📡 API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login (rate limited 5/15min) |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | ✅ | Invalidate refresh token |
| GET | `/api/auth/me` | ✅ | Current user |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List all users (paginated) |
| GET | `/api/users/:id` | Get user |
| PATCH | `/api/users/:id/role` | Change role |
| DELETE | `/api/users/:id` | Deactivate (soft delete) |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List own projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project detail |
| PATCH | `/api/projects/:id` | Update (project admin) |
| DELETE | `/api/projects/:id` | Archive (project admin) |
| GET/POST | `/api/projects/:id/members` | List / add members |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/tasks` | List tasks (filter: status, priority, assignee, overdue, search) |
| POST | `/api/projects/:id/tasks` | Create task |
| GET | `/api/tasks/:id` | Task detail with comments |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PATCH | `/api/tasks/:id/status` | Update status |
| PATCH | `/api/tasks/:id/assign` | Assign task |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/tasks/:id/comments` | Add comment |
| PATCH | `/api/comments/:id` | Edit own comment |
| DELETE | `/api/comments/:id` | Delete own comment |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Stats + recent activity + upcoming due dates |

---

## 🔒 Role Permissions

### Global
| Action | Admin | Member |
|---|---|---|
| Manage users | ✅ | ❌ |
| View all projects | ✅ | ❌ |
| Create projects | ✅ | ✅ |

### Project-level
| Action | Project Admin | Project Member |
|---|---|---|
| Edit project / manage members | ✅ | ❌ |
| Delete tasks | ✅ | ❌ |
| Create tasks / add comments | ✅ | ✅ |
| Update own assigned tasks | ✅ | ✅ |

---

## 🗄️ Database Schema

```
users            id, name, email, password_hash, role, avatar_url, is_active, refresh_token
projects         id, name, description, owner_id, status, due_date
project_members  id, project_id, user_id, role, joined_at  — UNIQUE(project_id, user_id)
tasks            id, title, description, project_id, assignee_id, created_by, status, priority, due_date, is_overdue
task_comments    id, task_id, user_id, content
activity_logs    id, user_id, entity_type, entity_id, action, meta (JSONB)
```

---

## 🎯 Demo Credentials

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
├── backend/
│   ├── src/
│   │   ├── config/        # database, jwt, logger
│   │   ├── middleware/    # authenticate, rbac, errorHandler, validate
│   │   ├── models/        # Sequelize models + associations
│   │   ├── modules/       # auth, users, projects, tasks, comments, dashboard
│   │   ├── jobs/          # overdue detection cron
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── utils/
│   └── tests/
└── frontend/
    └── src/
        ├── api/           # axios instance + endpoint functions
        ├── components/    # ui + layout components
        ├── pages/         # auth, dashboard, projects, tasks, users
        ├── store/         # Zustand stores
        └── utils/
```
