-- CreateTable
CREATE TABLE "BuildChecklistItem" (
    "id" TEXT NOT NULL,
    "build_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "item_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildChecklistItem_build_id_idx" ON "BuildChecklistItem"("build_id");

-- AddForeignKey
ALTER TABLE "BuildChecklistItem" ADD CONSTRAINT "BuildChecklistItem_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;
