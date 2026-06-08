# 🏁 TaskLine

> A priority queue task manager where your work lines up — so you always know what's next.

---

## The Problem

Every task app gives you a list.  
Lists don't tell you *order*.  
You open the app, see 30 tasks, and freeze.

**TaskLine fixes that.**  
Your tasks queue up like people in a line — one clear thing is always UP NEXT.

---

## Features

- **🏁 Finish Line Ribbon** — click it on the front card to complete a task with a celebration burst
- **🌡️ Deadline Glow** — card borders shift color as time runs out (blue → yellow → orange → red → pulsing red)
- **🖱️ Drag to Reorder** — grab any card and drop it anywhere in the queue
- **⏮⏭ Move to Front / Back** — one click to reprioritize instantly
- **🔴 Priority Badges** — Critical, High, Normal, Low with color coding
- **⇅ Sort by Priority** — auto-reorder the entire queue in one click
- **⏰ Urgency Tags** — ON TRACK / THIS WEEK / TODAY / DUE SOON / OVERDUE
- **📊 Live Stats** — queue depth, estimated time, urgent task count
- **🔐 Authentication** — Clerk OAuth with Google + GitHub login
- **👤 User Queues** — each user has their own isolated queue
- **☁️ Cloud Sync** — data persisted in MongoDB Atlas

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | CSS-in-JS (inline styles) |
| Drag & Drop | Native HTML5 Drag API |
| Authentication | Clerk (Google + GitHub OAuth) |
| Backend | FastAPI (Python) |
| Database | MongoDB Atlas (Motor async driver) |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## Project Structure

```
Taskline/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js           # Axios instance + API functions
│   │   ├── components/
│   │   │   ├── PersonCard.jsx   # Queue card with avatar, priority, deadline
│   │   │   └── CelebrationBurst.jsx
│   │   ├── hooks/
│   │   │   └── useQueue.js      # Queue state management
│   │   ├── App.jsx              # ClerkProvider + routing
│   │   ├── QueueApp.jsx         # Main queue page
│   │   ├── SignInPage.jsx       # Clerk sign-in
│   │   └── index.css            # Global styles + animations
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + CORS
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # MongoDB connection (Motor)
│   │   ├── models.py            # Pydantic schemas
│   │   ├── auth.py              # Clerk JWT verification
│   │   └── routes/
│   │       └── queue.py         # Queue CRUD endpoints
│   ├── requirements.txt
│   ├── render.yaml              # Render deploy config
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Python 3.11+**
- **MongoDB Atlas** account with a cluster
- **Clerk** account with an application (Google + GitHub OAuth enabled)

### 1. Clone the Repo

```bash
git clone https://github.com/ramprakash-07/Taskline.git
cd Taskline
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB Atlas URI, Clerk JWKS URL, etc.

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Visit `/docs` for interactive Swagger UI.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Clerk publishable key and API URL

# Run the dev server
npm run dev
```

The app runs at `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URL` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/taskline` |
| `DATABASE_NAME` | Database name | `taskline` |
| `CLERK_JWKS_URL` | Clerk JWKS endpoint | `https://your-app.clerk.accounts.dev/.well-known/jwks.json` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

---

## API Endpoints

All endpoints require authentication via Clerk JWT token in `Authorization: Bearer <token>` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/queue` | Get user's queue items (ordered) |
| `POST` | `/api/queue` | Create a new queue item |
| `PUT` | `/api/queue/reorder` | Reorder items |
| `PUT` | `/api/queue/{id}` | Update a queue item |
| `DELETE` | `/api/queue/{id}` | Delete a queue item |
| `POST` | `/api/queue/{id}/complete` | Complete a queue item |
| `GET` | `/health` | Health check |

---

## Deploy to Render (Backend)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New > Blueprint** and connect your repo
4. Render will detect `backend/render.yaml` and set up the service
5. Add environment variables in the Render dashboard:
   - `MONGODB_URL`
   - `CLERK_JWKS_URL`
   - `FRONTEND_URL` (your Vercel frontend URL)

Or manually create a **Web Service**:
- **Root Directory**: `backend`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## Deploy to Vercel (Frontend)

1. Import the repo on [Vercel](https://vercel.com/)
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_URL` (your Render backend URL)
4. Deploy!

---

## Roadmap

### ✅ Phase 1 — Frontend
- [x] Visual horizontal queue
- [x] Drag to reorder
- [x] Priority badges + sorting
- [x] Deadline glow system
- [x] Finish line ribbon + celebration

### ✅ Phase 2 — Backend
- [x] FastAPI backend with queue CRUD
- [x] MongoDB Atlas integration
- [x] Deploy-ready for Render

### ✅ Phase 3 — Auth & Users
- [x] Clerk OAuth (Google + GitHub login)
- [x] Per-user isolated queues
- [x] Persistent queue state across sessions

### 💡 Phase 4 — Collaboration
- [ ] Shareable queues with invite links
- [ ] Real-time sync for team queues
- [ ] 3D character avatars (Three.js + Mixamo)

---

## License

MIT — free to use, modify, and distribute.

---

## Author

Built by **Ram Prakash**  
[GitHub](https://github.com/ramprakash-07)

---

<div align="center">
  <strong>If this helped you, drop a ⭐ on the repo — it means a lot!</strong>
</div>
