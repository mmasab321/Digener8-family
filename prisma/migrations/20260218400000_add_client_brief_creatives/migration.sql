-- CreateTable
CREATE TABLE "ClientBrief" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "brief_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientLink" (
    "id" TEXT NOT NULL,
    "brief_id" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAsset" (
    "id" TEXT NOT NULL,
    "brief_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClientBrief_client_id_key" ON "ClientBrief"("client_id");

-- CreateIndex
CREATE INDEX "ClientLink_brief_id_idx" ON "ClientLink"("brief_id");

-- CreateIndex
CREATE INDEX "ClientAsset_brief_id_idx" ON "ClientAsset"("brief_id");

-- AddForeignKey
ALTER TABLE "ClientBrief" ADD CONSTRAINT "ClientBrief_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientLink" ADD CONSTRAINT "ClientLink_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "ClientBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "ClientBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAsset" ADD CONSTRAINT "ClientAsset_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
