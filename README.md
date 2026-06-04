<<<<<<< HEAD
# OPSFlow
OPS Flow for Biostacks
=======
# 🚀 OpsFlow ERP v2 — Enterprise Operations Platform

A complete, production-ready Enterprise Resource Planning system built with TypeScript, React, Node.js, PostgreSQL, and Prisma. Comparable to Jira, ClickUp, and Monday.com — focused on internal IT operations management.

---

## 🏗️ Architecture

```
opsflow-v2/
├── backend/                    # Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma       # Complete DB schema (25+ tables)
│   │   └── seed.ts             # Demo data seed
│   ├── src/
│   │   ├── index.ts            # Express app entry
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # JWT auth + refresh tokens
│   │   │   ├── users/          # User management
│   │   │   ├── employees/      # Employee profiles
│   │   │   ├── assets/         # IT asset tracking
│   │   │   ├── sims/           # SIM + camera management
│   │   │   ├── credentials/    # AES-256 credential vault
│   │   │   ├── projects/       # Project management
│   │   │   ├── tasks/          # Kanban task system
│   │   │   ├── todos/          # Daily operations
│   │   │   ├── files/          # File management
│   │   │   ├── notifications/  # In-app notifications
│   │   │   ├── audit/          # Immutable audit logs
│   │   │   ├── dashboard/      # Stats + charts
│   │   │   └── tickets/        # Support tickets
│   │   └── shared/
│   │       ├── middleware/     # Auth, error, logger
│   │       ├── prisma/         # DB client singleton
│   │       ├── types/          # TypeScript interfaces
│   │       └── utils/          # Helpers, encryption, pagination
│   └── uploads/                # File storage
│
└── frontend/                   # React + TypeScript + Tailwind
    └── src/
        ├── modules/
        │   ├── auth/           # Login page
        │   ├── dashboard/      # Main dashboard
        │   └── pages.tsx       # All feature pages
        └── shared/
            ├── components/
            │   ├── ui/         # Reusable UI components
            │   └── layout/     # Sidebar, Header, AppLayout
            ├── lib/
            │   ├── api.ts      # Axios API client
            │   ├── helpers.ts  # Formatters, colors
            │   └── utils.ts    # cn() utility
            └── store/
                ├── auth.store.tsx
                └── theme.store.tsx
```

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🔐 **Auth** | JWT + Refresh Tokens, RBAC, session tracking |
| 📊 **Dashboard** | Live KPIs, 4 charts, activity feed, deadline tracker |
| 👥 **Employees** | Profiles, documents, device/SIM linking |
| 💻 **Assets** | Laptops, tablets, phones, routers — assignment history |
| 📱 **SIMs & Cameras** | Expiry alerts, device linking, camera grid |
| 🔑 **Credentials** | AES-256 vault, access logging, reveal tracking |
| 📁 **Projects** | Cards, milestones, team, discussions, progress |
| ✅ **Tasks** | Drag-and-drop Kanban, comments, list view |
| 📋 **Daily Ops** | One-time & recurring todos, overdue tracking |
| 🎫 **Tickets** | Support tickets, categories, comments |
| 🗂️ **Files** | Folder system, grid/list, upload/download |
| 📋 **Audit Log** | Immutable, filterable, complete trail |
| 🔔 **Notifications** | In-app bell, mark read, grouped by type |
| ⚙️ **Settings** | Profile, password, dark/light mode |

---

## 🛠️ Tech Stack

**Backend:** Node.js · Express · TypeScript · Prisma · PostgreSQL · JWT · bcryptjs · CryptoJS · Multer  
**Frontend:** React 18 · TypeScript · Tailwind CSS · React Router · Axios · Recharts · date-fns · react-hot-toast

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Install

```bash
git clone <repo>
cd opsflow-v2
npm run setup
# OR manually:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/opsflow_v2"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-chars"
ENCRYPTION_KEY="opsflow-aes-256-secret-key-32chars!!"
PORT=5000
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Create database in PostgreSQL
psql -U postgres -c "CREATE DATABASE opsflow_v2;"

# Run migrations
cd backend
npx prisma generate
npx prisma migrate dev --name init

# Seed demo data
npx ts-node prisma/seed.ts
```

### 4. Configure Frontend

```bash
cd frontend
cp .env.example .env
# .env: REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd frontend && npm start
# → http://localhost:3000
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@opsflow.com | Admin@2024 |
| Admin | admin@opsflow.com | Admin@2024 |
| Team Lead | teamlead@opsflow.com | Employee@2024 |
| Employee | sara@opsflow.com | Employee@2024 |

> Login page has **Quick Demo Access** buttons to auto-fill credentials.

---

## 🔐 RBAC Permissions

| Permission | Super Admin | Admin | Team Lead | Employee |
|-----------|:-----------:|:-----:|:---------:|:--------:|
| user.view/create/edit | ✅ | ✅ | ❌ | ❌ |
| employee.view | ✅ | ✅ | ✅ | ✅ |
| employee.create/edit | ✅ | ✅ | ❌ | ❌ |
| employee.delete | ✅ | ❌ | ❌ | ❌ |
| asset.view | ✅ | ✅ | ✅ | ❌ |
| asset.create/edit | ✅ | ✅ | ❌ | ❌ |
| credential.view | ✅ | ✅ | ❌ | ❌ |
| project.create/edit | ✅ | ✅ | ✅ | ❌ |
| task.create/edit | ✅ | ✅ | ✅ | ✅ |
| audit.view | ✅ | ✅ | ❌ | ❌ |

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/change-password
```

### Core Modules (all require Bearer token)
```
GET/POST   /api/employees
GET/PUT    /api/employees/:id
POST       /api/employees/:id/documents

GET/POST   /api/assets
PUT        /api/assets/:id
POST       /api/assets/:id/assign

GET/POST   /api/sims
GET/POST   /api/sims/cameras

GET/POST   /api/credentials
GET        /api/credentials/:id/reveal

GET/POST   /api/projects
GET        /api/projects/:id
POST       /api/projects/:id/discussions
POST       /api/projects/:id/milestones

GET/POST   /api/tasks
GET        /api/tasks/kanban
PATCH      /api/tasks/:id/status
POST       /api/tasks/:id/comments

GET/POST   /api/todos
PATCH      /api/todos/:id/complete

POST       /api/files/upload
GET/DELETE /api/files/:id

GET        /api/dashboard/stats
GET        /api/dashboard/charts

GET        /api/audit
GET        /api/notifications
GET/POST   /api/tickets
```

---

## 🔒 Security Features

- **JWT** access tokens (7d) + refresh tokens (30d)
- **bcrypt** password hashing (12 rounds)
- **AES-256** encryption for credentials
- **RBAC** with granular permission system
- **Rate limiting** (500/15min general, 20/15min auth)
- **Helmet.js** security headers
- **CORS** with origin whitelist
- **Input validation** with Zod
- **Audit logs** for every sensitive action
- **Credential access logs** for every password reveal
- **Soft deletes** for employees, assets, projects, tasks

---

## 🚀 Production Deployment

### Backend with PM2
```bash
cd backend
npm run build
pm2 start dist/index.js --name opsflow-api
pm2 save
```

### Frontend with Nginx
```bash
cd frontend
npm run build
# serve /build with nginx
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        root /var/www/opsflow/build;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        proxy_pass http://localhost:5000/uploads/;
    }
}
```

---

## 📄 License

MIT — Free for internal and commercial use.

**Built for IT Operations Teams** 🛠️
>>>>>>> d16fedf (Initial project upload)
