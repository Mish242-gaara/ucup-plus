-- CreateEnum
CREATE TYPE "player_status" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "status" "player_status" NOT NULL DEFAULT 'approved';
