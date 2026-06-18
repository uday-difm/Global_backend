/*
  Warnings:

  - You are about to drop the column `publishedAt` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `publishedBy` on the `Page` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Page" DROP COLUMN "publishedAt",
DROP COLUMN "publishedBy",
ADD COLUMN     "jsonLd" JSONB;
