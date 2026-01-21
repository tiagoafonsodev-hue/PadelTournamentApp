# Quick Start Guide

Get your Padel Tournament web app running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- PostgreSQL installed (or use a free cloud database)

## Option 1: Local PostgreSQL Setup

### 1. Install and Start PostgreSQL
```bash
# Windows: Download from postgresql.org
# macOS: brew install postgresql && brew services start postgresql
# Linux: sudo apt-get install postgresql

# Create database
createdb padel_tournament
```

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
echo 'DATABASE_URL="postgresql://postgres:admin@localhost:5432/padel_tournament"
JWT_SECRET="change-this-to-a-random-secret-key-abc123xyz"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"' > .env

# Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# Start backend server
npm run dev
```

Backend will run on **http://localhost:3001**

### 3. Frontend Setup
```bash
# Open a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001' > .env.local

# Start frontend server
npm run dev
```

Frontend will run on **http://localhost:3000**

### 4. Open the App
Navigate to [http://localhost:3000](http://localhost:3000)

---

## Option 2: Cloud PostgreSQL (Railway) - Recommended

### 1. Create Free PostgreSQL Database
1. Go to [Railway.app](https://railway.app/)
2. Sign up for free account
3. Click "New Project" → "Provision PostgreSQL"
4. Copy the connection string (Postgres Connection URL)

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env with your Railway database URL
echo 'DATABASE_URL="your-railway-postgres-url-here"
JWT_SECRET="change-this-to-a-random-secret-key-abc123xyz"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"' > .env

npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 3. Frontend Setup (same as Option 1)
```bash
cd frontend
npm install
echo 'NEXT_PUBLIC_API_URL=http://localhost:3000' > .env.local
npm run dev
```

---

## First Steps in the App

1. **Register** a new account at http://localhost:3000/register
2. **Add Players** - Go to Players tab, click "Add Player"
3. **Create Tournament** - Go to Tournaments tab, click "Create Tournament"
   - Choose tournament type
   - Select at least 4 players (must be divisible by 4)
4. **Enter Match Results** - Click on a tournament, then "Enter Result" for matches
5. **View Leaderboard** - Check rankings in Leaderboard tab

## Troubleshooting

### Backend won't start
- **Error: ECONNREFUSED** - PostgreSQL not running. Start it: `brew services start postgresql` (Mac) or check Windows services
- **Error: JWT_SECRET** - Add JWT_SECRET to backend/.env file
- **Error: DATABASE_URL** - Check your connection string in backend/.env

### Frontend shows 404
- Make sure backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in frontend/.env.local

### Database migration fails
```bash
# Reset database (WARNING: deletes all data)
cd backend
npm run prisma:migrate reset
```

### Check if services are running
```bash
# Backend should be on port 3001
curl http://localhost:3001/health

# Frontend should be on port 3000
open http://localhost:3000
```

## Default Ports
- Backend API: **3001**
- Frontend: **3000**
- PostgreSQL: **5432**

## Next Steps
- Read [README.md](README.md) for full documentation
- Explore API endpoints
- Deploy to production (Vercel + Railway)

## Common Commands
```bash
# Backend
npm run dev              # Start dev server
npm run prisma:studio    # Open database GUI

# Frontend
npm run dev              # Start dev server
npm run build            # Build for production
```

## Need Help?
- Check [README.md](README.md) for detailed setup
- Review error messages - they usually indicate what's missing
- Make sure all .env files are created with correct values
