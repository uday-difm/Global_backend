-- AlterEnum
ALTER TYPE "PostStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "LegalPage" ADD COLUMN     "contentJson" TEXT,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "isHardcoded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "contentJson" TEXT,
ADD COLUMN     "ogImage" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "faqs" JSONB,
ADD COLUMN     "visible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Newsletter" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Newsletter_siteId_idx" ON "Newsletter"("siteId");

-- CreateIndex
CREATE INDEX "ContentVersion_siteId_entityType_entityId_idx" ON "ContentVersion"("siteId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentVersion_siteId_entityType_entityId_version_idx" ON "ContentVersion"("siteId", "entityType", "entityId", "version");

-- CreateIndex
CREATE INDEX "ContentVersion_createdAt_idx" ON "ContentVersion"("createdAt");

-- CreateIndex
CREATE INDEX "Service_siteId_status_visible_idx" ON "Service"("siteId", "status", "visible");

-- AddForeignKey
ALTER TABLE "Newsletter" ADD CONSTRAINT "Newsletter_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
