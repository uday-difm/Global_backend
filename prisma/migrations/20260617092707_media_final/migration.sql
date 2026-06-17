-- DropIndex
DROP INDEX "Media_publicId_key";

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "isDocument" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isImage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVideo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalName" TEXT;
