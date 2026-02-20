# Scripts

## seed2025Points.ts

Script to populate historical 2025 tournament points for players. This data is used for balanced group generation in tournaments.

### How to Use

1. **Edit the script** - Open `seed2025Points.ts` and modify the `player2025Points` array with your player names and points:

```typescript
const player2025Points = [
  { playerName: 'John Doe', points: 150 },
  { playerName: 'Jane Smith', points: 120 },
  // Add all your players...
];
```

2. **Run the script**:

```bash
cd backend
npx ts-node src/scripts/seed2025Points.ts
```

3. **Verify** - The script will output success/error messages for each player.

### What it Does

- Creates a special "[HISTORICAL] 2025 Season Points" tournament if it doesn't exist
- For each player in your list:
  - Finds the player by name (case-insensitive search)
  - Creates or updates their 2025 TournamentResult record
  - Sets the `createdAt` date to 2025 so the group balancing algorithm uses these points
- Shows a summary of successful/failed operations

### Notes

- Player names must match existing players in your database (search is case-insensitive)
- You can run this script multiple times - it will update existing records
- The points you enter will be used when creating GROUP_STAGE_KNOCKOUT tournaments
- The historical tournament will appear in your tournament list but marked as COMPLETED
