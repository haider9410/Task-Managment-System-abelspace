# AbleSpace - Task & Project Management Workspace

A modern, full-stack **Task & Project Management System** built with **Next.js 16 (App Router)**, **NestJS (TypeScript)**, **MySQL**, and an **Autonomous AI Agent** powered by Groq LLM and Model Context Protocol (MCP).

---

## 👨‍💻 Author & Repository

- **Developer**: [Haider](https://github.com/haider9410)
- **GitHub Profile**: [https://github.com/haider9410](https://github.com/haider9410)
- **Repository**: [https://github.com/haider9410/Task-Managment-System-abelspace.git](https://github.com/haider9410/Task-Managment-System-abelspace.git)

---

## 🛠️ Tech Stack & Architecture

| Component      | Technology / Framework                                       | Port    |
| -------------- | ------------------------------------------------------------ | ------- |
| **Frontend**   | Next.js 16 (App Router) + Redux Toolkit + Tailwind CSS v4    | `3000`  |
| **Backend**    | NestJS (TypeScript) + MySQL Connection Pool                  | `5000`  |
| **AI Bridge**  | Node.js + Groq LLM Bridge + MCP Tool Calling                 | `5001`  |
| **MCP Server** | Model Context Protocol Server (`@modelcontextprotocol/sdk`)  | `stdio` |
| **Database**   | MySQL (`Task_Managment_System_db`)                           | `3306`  |

---

## 🌟 Key Features

1. **Kanban Board Workflow**:
   - Grouped status columns (`To Do`, `Doing`, `Completed`, `On Hold`).
   - Vertical task card drag-and-drop reordering (up & down within columns or across columns).
   - Horizontal column section reordering using the **6-dots (`::`) grip handle**.
   - Interactive **3-dots (`···`) action menus** for instant Task Edit Mode and Task/Column Deletion.

2. **NestJS TypeScript REST API**:
   - Clean, modular controllers, services, and modules (`TasksModule`, `ProjectsModule`, `ProfilesModule`, `HealthModule`).
   - Native MySQL `mysql2/promise` connection pool with auto-initialization for database tables and resilient in-memory fallback.

3. **Autonomous AI Assistant**:
   - AI panel powered by Groq LLM + MCP tools.
   - Execute natural language commands (e.g. *"Create a high priority task named Launch Release due tomorrow"*).

4. **Fully Responsive Design**:
   - Fluid support for phones (320px+), tablets, laptops, and ultra-wide screens.
   - Mobile overlay drawers for navigation sidebar and AI panel.

5. **User Profiles & Guest Mode**:
   - Auth0 Google OAuth integration alongside instant Guest login mode with custom profile picture avatars.
   - Customizable light/dark themes and color accent modes (Amber, Blue, Pink, Emerald, Rose).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (v22+ recommended)
- **MySQL**: Server running locally on port `3306`

### 2. Environment Setup

Create `.env` files in each service directory using the provided `.env.example` templates:

#### `backend/server/.env`
```env
PORT=5000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=Task_Managment_System_db
```

#### `backend/ai-server/.env`
```env
PORT=5001
GROQ_API_KEY=your_groq_api_key_here
```

#### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_URL=http://localhost:5001
```

### 3. Launching All Services

Run the single startup script from the root directory:

```powershell
.\run.ps1
```

- **Web App**: [http://localhost:3000](http://localhost:3000)
- **NestJS API**: [http://localhost:5000](http://localhost:5000)
- **AI Server**: [http://localhost:5001](http://localhost:5001)

---

## ☁️ Deploying to Cloudflare Pages

This repository is pre-configured with `wrangler.json`, `_routes.json`, and root build scripts so **Cloudflare Pages** builds and deploys your Next.js application without any configuration issues!

### Option A: Cloudflare Pages Dashboard (Automatic GitHub Deployment)

1. Log into your **Cloudflare Dashboard** -> **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
2. Select your repository: `haider9410/Task-Managment-System-abelspace`.
3. Configure build settings:
   - **Framework preset**: `Next.js`
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
4. Environment variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed API URL (e.g., `https://api.yourdomain.com`)
   - `NEXT_PUBLIC_AI_URL`: Your deployed AI Server URL
5. Click **Save and Deploy**!

### Option B: Deploy via Wrangler CLI

From your terminal, run:
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy .next --project-name=ablespace-frontend
```

---

## 📜 License

Created with ❤️ by [Haider](https://github.com/haider9410). Distributed under the MIT License.
