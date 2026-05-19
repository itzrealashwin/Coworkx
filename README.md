<div align="center">

![CoworkX Cover](https://itzrealashwin.vercel.app/cover/coworkx.png)

# CoworkX

### GitHub Issue Intelligence Platform

*Transform scattered GitHub Issues into organized, sprint-driven engineering workflows*

[![Tech Stack](https://img.shields.io/badge/Stack-PERN-blue?style=for-the-badge)](#tech-stack)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)](#)

[Features](#-core-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 🎯 What is CoworkX?

CoworkX is an **intelligence layer** built on top of GitHub Issues, designed for engineering teams who've outgrown basic issue tracking but don't want the overhead of full-blown project management tools. 

GitHub gives you issues. CoworkX gives you **workflows**.

### The Problem We Solve

- ❌ GitHub Issues scattered across multiple repos
- ❌ No sprint planning or velocity tracking
- ❌ Zero visibility into team workload distribution
- ❌ Manual triage = chaos for growing teams
- ❌ Can't prioritize without context

### The Solution

- ✅ Unified workspace across repositories
- ✅ Sprint-based execution with drag-and-drop planning
- ✅ Smart Issue Inbox for triaging incoming work
- ✅ Real-time sync with GitHub via webhooks
- ✅ Workload visibility and dependency tracking

---

## ✨ Core Features

### 🎫 **Issue Intelligence**
Convert GitHub issues into actionable tasks with context. Import from connected repos, auto-sync status changes, and maintain bidirectional GitHub integration.

### 📥 **Smart Inbox**
Triage new issues before they hit your sprint. Accept, dismiss, or defer — keep your backlog clean and your team focused.

### 🏃 **Sprint Execution**
Plan sprints with drag-and-drop Kanban boards. Track progress across customizable stages, assign owners, set priorities, and ship faster.

### 🔗 **Cross-Repo Planning**
Manage issues from multiple repositories in one unified workspace. No more context switching between 10 different GitHub projects.

### 👥 **Team Collaboration**
Role-based access control (Owner, Admin, Member), workspace-level permissions, and real-time updates keep everyone aligned.

### 📊 **Operational Visibility**
See who's working on what, track sprint velocity, identify blockers, and make data-driven planning decisions.

---

## 🚀 Quick Start

### Prerequisites

Make sure you have these bad boys installed:

```bash
node -v  # v18+ (LTS recommended)
npm -v   # v9+
psql --version  # PostgreSQL 14+
```

### Installation

**1️⃣ Clone the repo**

```bash
git clone https://github.com/itzrealashwin/Coworkx.git
cd Coworkx
```

**2️⃣ Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials (see Environment Setup below)

# Run Prisma migrations
npm run db:migrate

# Generate Prisma Client
npm run db:generate

# Start the server
npm run dev
```

**3️⃣ Frontend Setup**

```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your backend URL

# Start the dev server
npm run dev
```

**4️⃣ Access the app**

```
🎉 Frontend: http://localhost:5173
🔧 Backend:  http://localhost:5000
🗄️  Prisma Studio: npm run db:studio (from backend/)
```

---

## 🔐 Environment Setup

### Backend `.env`

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/coworkx

# Server
PORT=5000
NODE_ENV=development

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_super_secret_key
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_RESET_SECRET=your_reset_secret
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=your_email@gmail.com

# Frontend URL
CLIENT_URL=http://localhost:5173

# Cookie
COOKIE_SECRET=your_cookie_secret

# Cloudinary (optional, for file uploads)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Gemini API (optional, for AI features)
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000
```

> 💡 **Pro Tip**: Never commit `.env` files. Use strong, randomly generated secrets for production.

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- ⚛️ React 18 + Vite
- 🎨 Tailwind CSS + shadcn/ui
- 🔄 TanStack Query (React Query)
- 🧭 React Router v6
- 🎭 Zustand (State Management)

**Backend**
- 🟢 Node.js + Express
- 🗄️ PostgreSQL + Prisma ORM
- 🔐 JWT Authentication
- 🔌 Socket.io (Real-time)
- 🪝 GitHub Webhooks

**DevOps**
- 🐳 Docker Ready
- 🔄 GitHub Actions CI/CD
- 📊 Prisma Studio

---

## 📁 Project Structure

```
COWORKX/
├── backend/
│   ├── config/           # Database & service configs
│   ├── controller/       # Route controllers
│   ├── middlewares/      # Auth, validation, error handling
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic layer
│   ├── utils/            # Helper functions
│   ├── validators/       # Request validation schemas
│   ├── prisma/           # Prisma schema & migrations
│   │   └── schema.prisma
│   ├── App.js            # Express app entry
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/       # Images, icons, static files
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── layouts/      # Page layout components
│   │   ├── lib/          # Third-party integrations
│   │   ├── pages/        # Route-level components
│   │   ├── services/     # API service layer
│   │   ├── App.jsx       # Root component
│   │   └── main.jsx      # React entry point
│   ├── public/           # Static assets
│   └── package.json
│
├── .gitignore
└── README.md
```

### Key Directories Explained

| Directory | Purpose |
|-----------|---------|
| `backend/controller/` | HTTP request handlers - thin layer that delegates to services |
| `backend/services/` | Business logic - where the magic happens |
| `backend/middlewares/` | Auth guards, validators, error handlers |
| `backend/routes/` | API route definitions |
| `frontend/components/` | Reusable UI building blocks (buttons, modals, cards) |
| `frontend/pages/` | Full page components mapped to routes |
| `frontend/hooks/` | Custom React hooks for shared logic |

---

## 🛠️ Available Scripts

### Backend

```bash
npm run dev          # Start dev server with nodemon
npm start            # Production server
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma Client
npm run db:studio    # Open Prisma Studio GUI
```

### Frontend

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 🗄️ Database Schema

CoworkX uses Prisma ORM with PostgreSQL. Key models include:

- **User** - Authentication & profile
- **Organization** - Workspace container
- **Workspace** - Repository grouping
- **Repository** - GitHub repo connection
- **Issue** - Imported GitHub issues
- **Sprint** - Sprint planning cycles
- **Task** - Issues converted to actionable tasks
- **Stage** - Kanban board stages

To visualize the schema:

```bash
cd backend
npm run db:studio
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code structure and naming conventions
- Write meaningful commit messages
- Test your changes locally before submitting
- Update documentation if adding new features

---

## 🐛 Known Issues & Roadmap

### Current Limitations
- Single GitHub account per user (multi-account support coming soon)
- Limited GitHub Enterprise support
- No mobile app (yet)

### Roadmap
- [ ] GitHub Enterprise integration
- [ ] Advanced analytics dashboard
- [ ] Slack/Discord notifications
- [ ] Custom workflow automation
- [ ] Mobile apps (iOS/Android)
- [ ] AI-powered issue prioritization

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ashwin Mali**

- Portfolio: [itzrealashwin.vercel.app](https://itzrealashwin.vercel.app)
- GitHub: [@itzrealashwin](https://github.com/itzrealashwin)

---

## ⭐ Show Your Support

If CoworkX helped streamline your workflow, give it a ⭐️ on GitHub!

---

<div align="center">

**Built with 💙 for engineering teams who ship fast**

[Report Bug](https://github.com/itzrealashwin/Coworkx/issues) • [Request Feature](https://github.com/itzrealashwin/Coworkx/issues)

</div>