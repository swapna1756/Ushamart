# UshaMart Admin

Admin Portal + Node.js Backend for UshaMart grocery delivery platform.

## Structure
```
admin/
├── backend/     Node.js + Express REST API  (port 5000)
└── frontend/    React Admin Portal          (port 3000)
```

## Quick Start

### Backend
```bash
cd backend
npm install
node src/database/seed.js   # seed initial data
npm run dev                 # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

## Login
- Email: naidumay123@gmail.com
- Password: Rajubhai@1

## Tech Stack
- Node.js + Express
- Supabase (Postgres) / JSON fallback
- React + Vite + Tailwind CSS
- JWT Authentication
