/*
  Warnings:

  - Added the required column `siteId` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteId` to the `MediaFolder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "siteId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MediaFolder" ADD COLUMN     "siteId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Media_siteId_idx" ON "Media"("siteId");

-- CreateIndex
CREATE INDEX "MediaFolder_siteId_idx" ON "MediaFolder"("siteId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
