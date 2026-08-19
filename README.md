# AbleSpace - Task & Project Management Workspace

A full-stack **Task & Project Management Application** with a Figma-matched modern UI, a REST API backed by **MySQL**, and an **AI Chat Agent** powered by Groq + Model Context Protocol (MCP).

---

## 🛠️ Architecture & Services

The project is structured into clean **`frontend/`** and **`backend/`** directories:

| Service Location    | Role                                                         | Port  |
| ------------------- | ------------------------------------------------------------ | ----- |
| `frontend/`         | Next.js 16 (App Router) + Redux Toolkit + Tailwind CSS v4    | 3000  |
| `backend/server/`   | Express + MySQL REST API (Tasks, Projects, Profiles)          | 5000  |
| `backend/ai-server/`| AI Bridge: Groq LLM + MCP Tool Calling                       | 5001  |
| `backend/mcp-server/`| Model Context Protocol Server for AI Task/Project execution | stdio |

---

## ✨ Features

- **Kanban Board & Grouped Views**: Full Kanban drag-and-drop workflow (`todo`, `doing`, `completed`, `onhold`) with task filters and field customizers.
- **Project Management**: Create, update, and manage private/public projects with priority levels, colors, and due dates.
- **MySQL Integration**: Fast, reliable database connection pool with automatic schema/table creation (`pyramid_task_db`).
- **Autonomous AI Chat Agent**: Sidebar AI assistant using MCP tools to directly create, update, and query tasks and projects.
- **Custom Themes**: Light and dark modes with multiple custom color accents (Amber, Blue, Pink, Emerald, Rose).
- **Authentication**: Auth0 Google login integration alongside instant Guest mode login.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js v18+** (v22+ recommended)
- **MySQL Server** running locally on port 3306 (or configured in `backend/server/.env`)

### 2. Running All Services

Run one command from the project root:

```powershell
# Start all services simultaneously
.\run.ps1
```

- Web App UI: **http://localhost:3000**
- API Health Endpoint: **http://localhost:5000/api/health**
- AI Server Health: **http://localhost:5001/api/health**

---

## ⚙️ Environment Variables

### Backend Server (`backend/server/.env`)
```env
PORT=5000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=pyramid_task_db
CLIENT_ORIGIN=http://localhost:3000
```

### AI Server (`backend/ai-server/.env`)
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
API_BASE_URL=http://localhost:5000
MCP_SERVER_PATH=../mcp-server/index.js
CLIENT_ORIGIN=http://localhost:3000
PORT=5001
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_URL=http://localhost:5001
```
