# Padel Tournament Manager - Web Application

A full-stack web application for managing padel tournaments, ported from the Android app. Features include player management, tournament creation (Round Robin, Knockout, Group Stage + Knockout), match tracking, leaderboards, and real-time updates.

## Tech Stack

### Backend
- **Node.js** + **Express** - REST API server
- **TypeScript** - Type-safe development
- **PostgreSQL** - Relational database
- **Prisma ORM** - Database access and migrations
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication
- **Zod** - Request validation
- **bcryptjs** - Password hashing

### Frontend
- **Next.js 14** (App Router) - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **React Query** - Server state management

## Project Structure

```
PadelTournamentApp/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   │   ├── TournamentSchedulerService.ts
│   │   │   ├── TournamentProgressService.ts
│   │   │   └── MatchResultService.ts
│   │   └── index.ts        # Server entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Next.js app
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities (API client, etc.)
│   │   └── types/          # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
└── app/                     # Original Android app (Kotlin)
```

## Features

### Core Features (From Android App)
- **Player Management**: Create, edit, delete players with optional email and phone
- **Tournament Creation**:
  - Round Robin (all teams play each other)
  - Knockout (single elimination)
  - Group Stage + Knockout (groups then playoffs)
- **Match Recording**: Track scores across 2-3 sets with game-level details
- **Leaderboard**: Player rankings by win percentage
- **Automatic Tournament Progression**: Auto-advance from group stage to knockout

### New Web Features
- **Multi-user Support**: Each user has their own players and tournaments
- **Real-time Updates**: Live match results and tournament status via WebSockets
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Authentication**: Secure login/register system

## Setup Instructions

### Prerequisites
- Node.js 18+ (check: `node --version`)
- PostgreSQL 14+ (or use cloud provider like Railway/Supabase)
- npm or yarn package manager

### 1. Database Setup

#### Option A: Local PostgreSQL
```bash
# Install PostgreSQL (if not installed)
# On macOS: brew install postgresql
# On Windows: Download from postgresql.org
# On Linux: sudo apt-get install postgresql

# Create database
createdb padel_tournament

# Get your connection string
# postgresql://postgres:admin@localhost:5432/padel_tournament

```

#### Option B: Cloud PostgreSQL (Recommended)
Use a managed PostgreSQL service:
- [Railway](https://railway.app/) - Free tier available
- [Supabase](https://supabase.com/) - Free tier available
- [Neon](https://neon.tech/) - Free tier available

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and set your values:
# DATABASE_URL="postgresql://user:password@localhost:5432/padel_tournament"
# JWT_SECRET="your-random-secret-key-generate-a-long-string"
# PORT=3001
# NODE_ENV="development"
# FRONTEND_URL="http://localhost:3000"

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev

# Server will run on http://localhost:3001
```

### 3. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.local.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev

# Frontend will run on http://localhost:3000
```

### 4. Open Application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Players
- `GET /api/players` - List all players (with optional `?search=name`)
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player
- `GET /api/players/leaderboard` - Get leaderboard

### Tournaments
- `GET /api/tournaments` - List all tournaments
- `POST /api/tournaments` - Create tournament (auto-generates matches)
- `GET /api/tournaments/:id` - Get tournament details with matches

### Matches
- `POST /api/matches/:id/result` - Submit match result (updates stats, checks progression)

## Tournament Types & Validation

### Round Robin
- **Requirement**: 4+ players, even number
- **Format**: Every team plays every other team once
- **Phases**: 1

### Knockout
- **Requirement**: 4+ players, must form power-of-2 teams (4, 8, 16, 32 players)
- **Format**: Single elimination bracket
- **Phases**: 1

### Group Stage + Knockout
- **Requirement**: 8+ players, divisible by 4
- **Format**: Groups (round robin) → Top 2 from each group → Knockout
- **Phases**: 2 (automatic progression)

## Tournament Algorithms

The tournament scheduling algorithms were ported from the Android app:

### Team Creation
- Players are shuffled randomly
- Paired into teams of 2 (Padel is 2v2)

### Match Generation
- **Round Robin**: n teams generate n×(n-1)/2 matches
- **Knockout**: Single elimination bracket with log₂(n) rounds
- **Group Stage**: Teams distributed across groups, round robin within groups

### Progression Logic
- **Phase 1 Complete**: When all matches in current phase are completed
- **Group Stage**: Calculates standings with tiebreakers:
  1. Points (2 per win)
  2. Set difference
  3. Game difference
- **Auto-advance**: Top 2 teams from each group advance to knockout

## Development

### Backend Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run prisma:studio # Open Prisma Studio (database GUI)
```

### Frontend Commands
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database Commands
```bash
npm run prisma:generate  # Generate Prisma Client after schema changes
npm run prisma:migrate   # Create and apply migration
npm run prisma:studio    # Open database GUI
```

## Deployment

### Backend (Railway/Render)
1. Push code to GitHub
2. Connect repository to Railway/Render
3. Set environment variables (DATABASE_URL, JWT_SECRET, etc.)
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_API_URL=your-backend-url`
4. Deploy

### Database (Included with Railway/Render or use Supabase/Neon)

## WebSocket Events

The backend emits these events for real-time updates:

- `match:completed` - When a match result is submitted
- `tournament:phase-advanced` - When tournament progresses to next phase
- `tournament:finished` - When tournament completes
- `player:stats-updated` - When player stats change

Frontend clients join a room based on their user ID and receive relevant updates.

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes (authMiddleware)
- User data isolation (all queries filtered by userId)
- Input validation with Zod schemas
- CORS configuration
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React auto-escaping)

## Next Steps (Frontend Implementation)

The backend is complete. To finish the frontend:

1. **Create auth pages** (`/login`, `/register`)
2. **Create dashboard layout** with navigation
3. **Tournament pages**:
   - List view with status chips
   - Create wizard (2-step form)
   - Detail view with match list
4. **Player management page** with CRUD operations
5. **Leaderboard page** with rankings
6. **Components**:
   - MatchResultDialog for entering scores
   - TournamentCard for displaying tournaments
   - PlayerCard with edit/delete actions
7. **WebSocket integration** for real-time updates
8. **React Query setup** for data fetching/caching

## Contributing

This project was ported from an Android app. The core business logic in the `services/` directory mirrors the Android implementation for consistency.

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
