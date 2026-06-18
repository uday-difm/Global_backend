/*
  Warnings:

  - A unique constraint covering the columns `[integrationKey]` on the table `Site` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "integrationKey" TEXT;

-- CreateTable
CREATE TABLE "IntegrationManifest" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "source" TEXT,
    "manifestHash" TEXT,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationManifest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationManifest_siteId_idx" ON "IntegrationManifest"("siteId");

-- CreateIndex
CREATE INDEX "IntegrationManifest_createdAt_idx" ON "IntegrationManifest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Site_integrationKey_key" ON "Site"("integrationKey");

-- AddForeignKey
ALTER TABLE "IntegrationManifest" ADD CONSTRAINT "IntegrationManifest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
