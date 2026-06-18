/*
  Warnings:

  - A unique constraint covering the columns `[siteId]` on the table `GlobalSettings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "GlobalSettings_siteId_key" ON "GlobalSettings"("siteId");
