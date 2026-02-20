# Group Generation Algorithm - Balanced by 2025 Points

## Overview
When creating a **GROUP_STAGE_KNOCKOUT** tournament, teams are now automatically seeded and distributed across groups based on their 2025 tournament points to ensure balanced competition.

## How It Works

### 1. Team Seeding (Points Calculation)
- For each team, we calculate the **combined 2025 points** of both players
- 2025 points include: `pointsAwarded + bonusPoints` from all tournaments played in 2025
- Teams are sorted by total points in **descending order** (strongest first)

### 2. Alternating Distribution
Teams are distributed across groups using a **simple alternating pattern** to ensure balance:

#### Example: 16 players (8 teams) in 2 groups

**Teams sorted by 2025 points:**
1. Team 1 (strongest) - e.g., 150 pts
2. Team 2 - e.g., 140 pts
3. Team 3 - e.g., 130 pts
4. Team 4 - e.g., 120 pts
5. Team 5 - e.g., 110 pts
6. Team 6 - e.g., 100 pts
7. Team 7 - e.g., 90 pts
8. Team 8 (weakest) - e.g., 80 pts

**Distribution using alternating pattern:**
- Team 1 → Group A
- Team 2 → Group B
- Team 3 → Group A
- Team 4 → Group B
- Team 5 → Group A
- Team 6 → Group B
- Team 7 → Group A
- Team 8 → Group B

**Final groups:**
- **Group A**: Teams 1, 3, 5, 7 (Total: ~480 pts)
- **Group B**: Teams 2, 4, 6, 8 (Total: ~460 pts)

This ensures each group has a mix of strong and weak teams!

### 3. For 24 players (12 teams) in 3 groups

**Distribution:**
- Team 1 → Group A
- Team 2 → Group B
- Team 3 → Group C
- Team 4 → Group A
- Team 5 → Group B
- Team 6 → Group C
- Team 7 → Group A
- Team 8 → Group B
- Team 9 → Group C
- Team 10 → Group A
- Team 11 → Group B
- Team 12 → Group C

**Final groups:**
- **Group A**: Teams 1, 4, 7, 10
- **Group B**: Teams 2, 5, 8, 11
- **Group C**: Teams 3, 6, 9, 12

## Why This Matters

### Before (Sequential Distribution)
- Group A: Teams 1, 2, 3, 4 (all strong teams)
- Group B: Teams 5, 6, 7, 8 (all weak teams)
- **Result**: Unbalanced competition, predictable outcomes

### After (Alternating Distribution with 2025 Points)
- Group A: Teams 1, 3, 5, 7 (mixed strength)
- Group B: Teams 2, 4, 6, 8 (mixed strength)
- **Result**: Balanced groups, competitive matches!

## Implementation Details

### Backend Changes

1. **`tournamentController.ts`**:
   - Added `seedTeamsByPoints()` function
   - Queries `TournamentResult` table for 2025 points
   - Calculates team totals and sorts teams

2. **`TournamentSchedulerService.ts`**:
   - Updated `generateRoundRobinMultiGroup()` method
   - Implements simple alternating distribution algorithm

### Database Query
```typescript
// Get all 2025 tournament results
const tournamentResults = await prisma.tournamentResult.findMany({
  where: {
    playerId: { in: playerIds },
    createdAt: {
      gte: new Date('2025-01-01'),
      lt: new Date('2026-01-01'),
    },
  },
});
```

## Future Enhancements

- Allow admin to manually adjust seeding
- Support different years (not just 2025)
- Add seeding visualization in the UI
- Export seeding information to CSV

## Testing

To test the algorithm:
1. Create players with known 2025 tournament points
2. Create a GROUP_STAGE_KNOCKOUT tournament (16 or 24 players)
3. Verify groups are balanced by checking team point totals
4. Check that no group has all the strongest or weakest teams
