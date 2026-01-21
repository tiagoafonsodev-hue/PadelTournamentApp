-- CreateEnum
CREATE TYPE "TournamentCategory" AS ENUM ('OPEN_250', 'OPEN_500', 'OPEN_1000', 'GRAND_SLAM');

-- AlterTable
ALTER TABLE "player_stats" ADD COLUMN     "tournament_points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "category" "TournamentCategory" NOT NULL DEFAULT 'OPEN_250';

-- CreateTable
CREATE TABLE "tournament_point_configs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "TournamentCategory" NOT NULL,
    "position" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "tournament_point_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_results" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "final_position" INTEGER NOT NULL,
    "points_awarded" INTEGER NOT NULL,
    "category" "TournamentCategory" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_point_configs_user_id_idx" ON "tournament_point_configs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_point_configs_user_id_category_position_key" ON "tournament_point_configs"("user_id", "category", "position");

-- CreateIndex
CREATE INDEX "tournament_results_tournament_id_idx" ON "tournament_results"("tournament_id");

-- CreateIndex
CREATE INDEX "tournament_results_player_id_idx" ON "tournament_results"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_results_tournament_id_player_id_key" ON "tournament_results"("tournament_id", "player_id");

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_results" ADD CONSTRAINT "tournament_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
