-- CreateTable
CREATE TABLE "NotificationAlert" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationAlert_siteId_idx" ON "NotificationAlert"("siteId");

-- CreateIndex
CREATE INDEX "NotificationAlert_createdAt_idx" ON "NotificationAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "NotificationAlert" ADD CONSTRAINT "NotificationAlert_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
