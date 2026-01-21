-- AlterTable
ALTER TABLE "player_stats" ADD COLUMN     "matches_drawn" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "allow_ties" BOOLEAN NOT NULL DEFAULT false;
