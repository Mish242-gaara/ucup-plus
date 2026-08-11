-- CreateEnum
CREATE TYPE "match_status" AS ENUM ('scheduled', 'live', 'halftime', 'finished', 'postponed');

-- CreateEnum
CREATE TYPE "match_type" AS ENUM ('tournament', 'friendly');

-- CreateEnum
CREATE TYPE "match_event_type" AS ENUM ('goal', 'penalty_goal', 'own_goal', 'yellow_card', 'second_yellow', 'red_card', 'substitution', 'substitution_in', 'substitution_out', 'injury', 'penalty_missed', 'big_chance_missed');

-- CreateEnum
CREATE TYPE "lineup_role" AS ENUM ('starter', 'substitute');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('image', 'video');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "theme_preference" TEXT NOT NULL DEFAULT 'system',
    "two_factor_secret" TEXT,
    "two_factor_recovery_codes" TEXT,
    "two_factor_confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "universities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "logo" TEXT,
    "colors" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "university_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "coach" TEXT,
    "category" TEXT NOT NULL DEFAULT 'senior',
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "jersey_number" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "height" INTEGER,
    "photo" TEXT,
    "photo_path" TEXT,
    "nationality" TEXT NOT NULL DEFAULT 'DRC',
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "yellow_cards" INTEGER NOT NULL DEFAULT 0,
    "red_cards" INTEGER NOT NULL DEFAULT 0,
    "matches_played" INTEGER NOT NULL DEFAULT 0,
    "minutes_played" INTEGER NOT NULL DEFAULT 0,
    "passes_completed" INTEGER NOT NULL DEFAULT 0,
    "pass_accuracy" INTEGER NOT NULL DEFAULT 0,
    "tackles" INTEGER NOT NULL DEFAULT 0,
    "interceptions" INTEGER NOT NULL DEFAULT 0,
    "fouls_committed" INTEGER NOT NULL DEFAULT 0,
    "fouls_suffered" INTEGER NOT NULL DEFAULT 0,
    "shots_on_target" INTEGER NOT NULL DEFAULT 0,
    "dribbles" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "home_team_id" INTEGER NOT NULL,
    "away_team_id" INTEGER NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "status" "match_status" NOT NULL DEFAULT 'scheduled',
    "home_score" INTEGER NOT NULL DEFAULT 0,
    "away_score" INTEGER NOT NULL DEFAULT 0,
    "home_coach" TEXT,
    "away_coach" TEXT,
    "home_formation" TEXT,
    "away_formation" TEXT,
    "home_composition_ready" BOOLEAN NOT NULL DEFAULT false,
    "away_composition_ready" BOOLEAN NOT NULL DEFAULT false,
    "round" TEXT,
    "group" TEXT,
    "match_type" "match_type" DEFAULT 'tournament',
    "attendance" INTEGER,
    "start_time" TIMESTAMP(3),
    "timer_paused_at" TIMESTAMP(3),
    "elapsed_time" INTEGER DEFAULT 0,
    "additional_time_first_half" INTEGER DEFAULT 0,
    "additional_time_second_half" INTEGER DEFAULT 0,
    "is_extra_time" BOOLEAN DEFAULT false,
    "is_penalty_shootout" BOOLEAN DEFAULT false,
    "home_fouls" INTEGER NOT NULL DEFAULT 0,
    "home_corners" INTEGER NOT NULL DEFAULT 0,
    "home_offsides" INTEGER NOT NULL DEFAULT 0,
    "away_fouls" INTEGER NOT NULL DEFAULT 0,
    "away_corners" INTEGER NOT NULL DEFAULT 0,
    "away_offsides" INTEGER NOT NULL DEFAULT 0,
    "home_yellow_cards" INTEGER NOT NULL DEFAULT 0,
    "home_red_cards" INTEGER NOT NULL DEFAULT 0,
    "away_yellow_cards" INTEGER NOT NULL DEFAULT 0,
    "away_red_cards" INTEGER NOT NULL DEFAULT 0,
    "home_possession" INTEGER,
    "away_possession" INTEGER,
    "home_shots" INTEGER NOT NULL DEFAULT 0,
    "away_shots" INTEGER NOT NULL DEFAULT 0,
    "home_shots_on_target" INTEGER DEFAULT 0,
    "away_shots_on_target" INTEGER DEFAULT 0,
    "home_saves" INTEGER NOT NULL DEFAULT 0,
    "away_saves" INTEGER NOT NULL DEFAULT 0,
    "home_free_kicks" INTEGER NOT NULL DEFAULT 0,
    "away_free_kicks" INTEGER NOT NULL DEFAULT 0,
    "home_throw_ins" INTEGER NOT NULL DEFAULT 0,
    "away_throw_ins" INTEGER NOT NULL DEFAULT 0,
    "home_goalkicks" INTEGER NOT NULL DEFAULT 0,
    "away_goalkicks" INTEGER NOT NULL DEFAULT 0,
    "home_penalties" INTEGER NOT NULL DEFAULT 0,
    "away_penalties" INTEGER NOT NULL DEFAULT 0,
    "referee" TEXT,
    "weather" TEXT,
    "temperature" INTEGER,
    "humidity" INTEGER,
    "admin_notes" TEXT,
    "match_report" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_events" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "assist_player_id" INTEGER,
    "out_player_id" INTEGER,
    "event_type" "match_event_type" NOT NULL,
    "minute" INTEGER NOT NULL,
    "additional_time" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_lineups" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "role" "lineup_role" NOT NULL,
    "starting_position" TEXT,
    "order_key" INTEGER,
    "is_starter" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineups" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "role" TEXT,
    "match_position" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "group" TEXT,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "goal_difference" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "file_path" TEXT NOT NULL,
    "media_type" "media_type" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "match_lineups_match_id_player_id_key" ON "match_lineups"("match_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "lineups_match_id_player_id_key" ON "lineups"("match_id", "player_id");

-- CreateIndex
CREATE UNIQUE INDEX "standings_team_id_group_key" ON "standings"("team_id", "group");

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_university_id_fkey" FOREIGN KEY ("university_id") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_assist_player_id_fkey" FOREIGN KEY ("assist_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_out_player_id_fkey" FOREIGN KEY ("out_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineups" ADD CONSTRAINT "lineups_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
