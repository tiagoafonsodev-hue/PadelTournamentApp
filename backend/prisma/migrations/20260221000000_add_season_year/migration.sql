-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "field_number" INTEGER;

-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "field_count" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "season_year" INTEGER NOT NULL DEFAULT 2026;
