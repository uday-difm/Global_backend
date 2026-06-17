/*
  Warnings:

  - You are about to drop the column `format` on the `Media` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicId]` on the table `Media` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileName` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Media" DROP COLUMN "format",
ADD COLUMN     "altText" TEXT,
ADD COLUMN     "extension" TEXT,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "secureUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "width" INTEGER;

-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Media_publicId_key" ON "Media"("publicId");

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
