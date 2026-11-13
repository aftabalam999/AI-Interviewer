# AI Interviewer

<div align="center">

![AI Interviewer](https://img.shields.io/badge/AI-Interviewer-6C63FF?style=for-the-badge&logo=robot&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white)

**Practice smarter. Interview with confidence.**

An AI-powered mock interview platform that turns a resume and job description into a personalized, real-time interview experience with actionable feedback.

</div>

---

## Overview

AI Interviewer is a full-stack application for candidates who want to prepare for interviews with realistic, AI-guided practice. Candidates can upload resumes, create role-specific interviews, answer generated questions, receive per-answer evaluation, and review their performance over time.

The project also includes a separate administrator console for managing users, interview data, resumes, prompts, templates, subscription plans, payments, analytics, platform settings, and audit logs.

## What it can do

### Candidate experience

- Register and sign in with email/password or Google OAuth
- Upload and manage resumes
- Parse resume content with AI
- Create interviews from a job title, job description, experience level, question types, question count, and optional resume
- Generate technical, behavioral, situational, HR, and culture-fit questions
- Run an interview session with real-time Socket.IO follow-up responses
- Submit answers for AI scoring and feedback
- Review strengths, weaknesses, recommendations, scores, interview history, and session results
- Update profile information and view account details

> Password changes are not shown in the user dashboard. The backend password-change endpoint remains available for existing API clients.

### Administrator console

- Admin authentication with separate admin tokens and role/permission checks
- Dashboard statistics
- User management and bulk user actions
- Interview, session, and resume administration
- Interview template management
- System prompt editing and version restoration
- Subscription plan management
- Transaction, refund, and webhook-log views
- Platform settings
- Analytics and audit logs
- Admin ATS screen and operational views

## How the AI pipeline works

```text
Resume upload
    ↓
PDF text extraction and AI parsing
    ↓
Semantic chunking
    ↓
OpenAI embeddings and contextual retrieval
    ↓
Interview creation from role and job description
    ↓
Groq question generation
    ↓
Real-time interview session over Socket.IO
    ↓
Groq answer evaluation and follow-up responses
    ↓
Scores, strengths, weaknesses, and recommendations
```

The retrieval layer uses LangChain text splitters and OpenAI embeddings. The current vector store is in-memory rather than a durable vector database.

## Technology

### Backend

- Node.js 18+ and Express
- MongoDB with Mongoose
- Groq SDK for parsing, question generation, evaluation, and follow-ups
- LangChain and OpenAI embeddings for RAG
- Socket.IO for real-time interview interactions
- Cloudinary and Multer for file uploads
- JWT, bcryptjs, Google OAuth, Helmet, CORS, and rate limiting
- Redis/ioredis support
- Winston and Morgan logging

### Frontend

- React 18 and Vite
- React Router
- Zustand and TanStack React Query
- Axios
- Tailwind CSS
- Framer Motion
- React Hook Form
- Recharts
- Lucide React and React Icons
- Socket.IO client
- React Markdown

## Repository structure

```text
AI-Interviewer/
├── backend/
│   ├── src/
│   │   ├── app.js                 Express app, middleware, and API routes
│   │   ├── server.js              HTTP and Socket.IO bootstrap
│   │   ├── socket.js              Real-time interview events
│   │   ├── config/                Database, AI, storage, cache, and logging
│   │   ├── controllers/           User and admin request handlers
│   │   ├── middleware/            Auth, validation, uploads, errors, logging
│   │   ├── models/                MongoDB schemas
│   │   ├── routes/                User and admin route definitions
│   │   ├── services/              AI, RAG, chunking, and optimization
│   │   └── utils/                 Errors, JWT helpers, and utilities
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                Route tree and route guards
│   │   ├── components/            Candidate and admin UI components
│   │   ├── context/               Application and admin context
│   │   ├── hooks/                 Reusable React hooks
│   │   ├── layouts/               Auth, dashboard, and admin shells
│   │   ├── pages/                 Candidate and admin screens
│   │   ├── services/              API clients
│   │   └── store/                 Zustand authentication store
│   └── package.json
├── package.json                   Root development scripts
├── PROJECT_DOCUMENTATION.md       Extended implementation notes
├── SECURITY.md                    Security guidance
└── CONTRIBUTING.md                Contribution guidelines
```

## Requirements

- Node.js 18 or newer
- MongoDB, local or hosted
- Groq API key
- OpenAI API key for embeddings and RAG
- Cloudinary account for resume storage
- Redis when Redis-backed features are enabled
- Google OAuth credentials for Google sign-in

## Quick start

### 1. Install dependencies

From the repository root:

```bash
npm install
npm run install:all
```

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Fill in the required values in `backend/.env`.

### 3. Configure the frontend

```bash
cp frontend/.env.example frontend/.env
```

Set the frontend API URL if it differs from the local default.

### 4. Start both applications

```bash
npm run dev
```

The default development URLs are:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

You can also run each application separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Environment variables

### Backend

The complete template is in [`backend/.env.example`](backend/.env.example).

| Variable | Required | Purpose |
|---|---:|---|
| `PORT` | No | API port, default `5000` |
| `NODE_ENV` | No | Runtime mode |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Access-token signing secret |
| `JWT_EXPIRE` | No | Access-token lifetime |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing secret |
| `JWT_REFRESH_EXPIRE` | No | Refresh-token lifetime |
| `GROQ_API_KEY` | Yes | Groq AI requests |
| `OPENAI_API_KEY` | Yes | Embeddings and RAG |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary upload configuration |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary upload configuration |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary upload configuration |
| `CLIENT_URL` | No | Allowed frontend origin |
| `GOOGLE_CLIENT_ID` | OAuth only | Google sign-in |
| `GOOGLE_CLIENT_SECRET` | OAuth only | Google sign-in |
| `GOOGLE_REDIRECT_URI` | OAuth only | Google callback URL |
| `RATE_LIMIT_WINDOW_MS` | No | Rate-limit window |
| `RATE_LIMIT_MAX` | No | Requests allowed per window |
| `REDIS_ENABLED` | No | Enable Redis support |
| `REDIS_URL` | No | Redis connection URL |
| `REDIS_HOST` / `REDIS_PORT` | No | Redis host configuration |
| `GROQ_MODEL` | No | Groq model override |

Compression settings are also supported through `COMPRESSION_THRESHOLD_BYTES` and `COMPRESSION_LEVEL`.

### Frontend

The frontend template is in [`frontend/.env.example`](frontend/.env.example).

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_APP_NAME` | Optional application name |

## API surface

All API routes are prefixed with `/api`.

### Public and authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/register` | Register a candidate |
| `POST` | `/auth/login` | Candidate login |
| `GET` | `/auth/google` | Start Google OAuth |
| `GET` | `/auth/google/callback` | Google OAuth callback |
| `POST` | `/auth/refresh` | Refresh a candidate token |
| `GET` | `/auth/me` | Current candidate |
| `POST` | `/auth/logout` | Candidate logout |

### Candidate APIs

| Area | Endpoints |
|---|---|
| Users | `GET /users/profile`, `PUT /users/profile`, `PUT /users/change-password`, `GET /users/dashboard` |
| Resumes | `POST /resumes/upload`, `GET /resumes`, `DELETE /resumes/:id`, `PATCH /resumes/:id/default`, `POST /resumes/:id/parse` |
| Interviews | `GET /interviews`, `POST /interviews`, `GET /interviews/:id`, `POST /interviews/:id/generate`, `DELETE /interviews/:id` |
| Sessions | `GET /sessions`, `POST /sessions/start`, `GET /sessions/:id`, `POST /sessions/:id/answer`, `POST /sessions/:id/complete` |

`POST /resumes/chunk-preview` is a development/debug endpoint for inspecting chunking output.

### Admin APIs

Admin routes are prefixed with `/api/admin` and use separate admin authentication:

- `/admin/auth/*` — admin login, logout, refresh, and current-admin lookup
- `/admin/stats`
- `/admin/users`
- `/admin/interviews`
- `/admin/sessions`
- `/admin/resumes`
- `/admin/templates`
- `/admin/prompts`
- `/admin/plans`
- `/admin/payments`
- `/admin/settings`
- `/admin/analytics/stats`
- `/admin/logs`

Individual write and destructive operations are protected by admin permissions; deleting users requires a super-admin role.

## Frontend routes

### Candidate routes

`/`, `/login`, `/register`, `/auth/callback`, `/dashboard`, `/interviews`, `/interviews/new`, `/interviews/:id/session`, `/sessions`, `/sessions/:id/results`, `/resumes`, `/profile`

### Admin routes

`/admin/login`, `/admin`, `/admin/users`, `/admin/interviews`, `/admin/resumes`, `/admin/sessions`, `/admin/ats`, `/admin/subscription`, `/admin/payments`, `/admin/analytics`, `/admin/settings`, `/admin/prompts`, `/admin/logs`

## Available scripts

### Root

| Command | Description |
|---|---|
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run dev` | Run backend and frontend together |
| `npm run dev:backend` | Run backend with Nodemon |
| `npm run dev:frontend` | Run Vite development server |
| `npm start` | Start the backend |

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start with Nodemon |
| `npm start` | Start production server |
| `npm run build` | Backend no-op build check |
| `npm test` | Run Jest |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start Vite |
| `npm run build` | Create a production bundle |
| `npm run preview` | Preview the production bundle |
| `npm run lint` | Run ESLint |

## Current limitations and production notes

- Resume uploads allow PDF, DOC, and DOCX containers, but the implemented text extraction path is PDF-focused.
- Uploads are limited to 5 MB.
- Job descriptions must contain at least 50 characters.
- Interviews support between 3 and 20 questions.
- RAG embeddings are held in memory and are not persisted to a vector database.
- If embedding generation is unavailable, the RAG service can fall back to raw resume/job-description context.
- The chunk-preview route is intended for development diagnostics and should be restricted or removed before production.
- The admin payment area currently exposes administrative payment views and mock/fallback data rather than a complete payment processor integration.
- Socket.IO event authorization should be reviewed before exposing live interview sessions to untrusted clients.
- Review [`backend/src/scripts/seedAdmin.js`](backend/src/scripts/seedAdmin.js) before use and replace any default administrative credentials.

## Security

Never commit `.env` files, API keys, OAuth secrets, database credentials, or JWT secrets. Use strong, unique secrets in each environment and review [`SECURITY.md`](SECURITY.md) before deployment.

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Make and test your changes.
4. Commit with a clear message.
5. Push your branch and open a pull request.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for repository contribution guidance.

## License

This project is released under the [MIT License](LICENSE).

---

<div align="center">

Built with Groq, React, MongoDB, and a lot of interview practice.

</div>
