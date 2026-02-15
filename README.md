# OpsBoard - Enterprise Platform

A production-ready, lightweight Kanban board for internal team management. 

## Features

- **Users**: Simple user management and switching.
- **Boards**: Multiple boards with customizable columns.
- **Tasks**: Drag & drop tasks, priorities, due dates, labels.
- **Files**: Unlimited file uploads for tasks (stored locally).
- **Activity Log**: Track who did what.
- **Dark Mode**: Professional dark UI.

## Project Structure

This project is contained entirely within the `test` folder.

```
test/
├── backend/            # Express + SQLite
│   ├── data/           # Persistent DB and Uploads
│   └── src/            # Source code
├── frontend/           # React + Vite + Tailwind
│   └── src/            # Components and Pages
├── docker-compose.yml  # Container orchestration
└── README.md
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- npm

### 1. Setup Backend

```bash
cd test/backend
npm install
npm run dev
```
Backend runs on `http://localhost:3000`

### 2. Setup Frontend

Open a new terminal:

```bash
cd test/frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## Deployment (Docker / Podman)

To deploy using Docker Compose:

```bash
cd test
docker-compose up -d --build
```

The application will be available at `http://localhost:80`.

## Data Persistence

- Database is stored in `test/backend/data/database.sqlite`
- Uploaded files are stored in `test/backend/data/uploads`

Ensure these directories are backed up if deploying to production.
