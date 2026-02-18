-- CreateEnum
CREATE TYPE "BuildType" AS ENUM ('YOUTUBE', 'SAAS');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SaasStage" AS ENUM ('IDEA', 'BUILDING', 'BETA', 'LIVE');

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "BuildType" NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'PLANNING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "owner_id" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "youtube_upload_target" TEXT,
    "youtube_videos_this_month" INTEGER DEFAULT 0,
    "saas_stage" "SaasStage",

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Build_type_idx" ON "Build"("type");

-- CreateIndex
CREATE INDEX "Build_status_idx" ON "Build"("status");

-- CreateIndex
CREATE INDEX "Build_owner_id_idx" ON "Build"("owner_id");

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
