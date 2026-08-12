/*
  Warnings:

  - A unique constraint covering the columns `[license_number]` on the table `players` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "license_number" TEXT;

-- CreateTable
CREATE TABLE "tournament_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "logo" TEXT,
    "organizer_name" TEXT DEFAULT 'Comité d''organisation UCUP 2026',
    "organizer_sub" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_license_number_key" ON "players"("license_number");
