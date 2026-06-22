/*
  Warnings:

  - You are about to drop the column `siteId` on the `SyncedRoute` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[frontendProjectId,route]` on the table `SyncedRoute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `frontendProjectId` to the `SyncedRoute` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SyncedRoute" DROP CONSTRAINT "SyncedRoute_siteId_fkey";

-- DropIndex
DROP INDEX "SyncedRoute_siteId_idx";

-- DropIndex
DROP INDEX "SyncedRoute_siteId_route_key";

-- AlterTable
ALTER TABLE "FrontendProject" ADD COLUMN     "baseUrl" TEXT,
ADD COLUMN     "lastManifestHash" TEXT,
ADD COLUMN     "sdkVersion" TEXT,
ADD COLUMN     "syncStatus" TEXT;

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "changeFreq" TEXT,
ADD COLUMN     "isDiscovered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isManagedBySync" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "priority" DOUBLE PRECISION,
ADD COLUMN     "sourceRoute" TEXT;

-- AlterTable
ALTER TABLE "SyncedRoute" DROP COLUMN "siteId",
ADD COLUMN     "frontendProjectId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "SyncedRoute_frontendProjectId_idx" ON "SyncedRoute"("frontendProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncedRoute_frontendProjectId_route_key" ON "SyncedRoute"("frontendProjectId", "route");

-- AddForeignKey
ALTER TABLE "SyncedRoute" ADD CONSTRAINT "SyncedRoute_frontendProjectId_fkey" FOREIGN KEY ("frontendProjectId") REFERENCES "FrontendProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
