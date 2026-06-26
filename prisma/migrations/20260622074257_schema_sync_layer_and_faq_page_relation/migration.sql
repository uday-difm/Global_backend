-- AlterTable: enforce Page.status as PageStatus enum
ALTER TABLE "Page" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Page" ALTER COLUMN "status" TYPE "PageStatus" USING ("status"::"PageStatus");
ALTER TABLE "Page" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable: FrontendProject
CREATE TABLE "FrontendProject" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrontendProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SyncedRoute
CREATE TABLE "SyncedRoute" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "source" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pageId" TEXT,

    CONSTRAINT "SyncedRoute_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Faq.page -> Faq.pageId relation
ALTER TABLE "Faq" ADD COLUMN "pageId" TEXT;

UPDATE "Faq" AS f
SET "pageId" = p."id"
FROM "Page" AS p
WHERE f."page" IS NOT NULL
  AND f."siteId" = p."siteId"
  AND (
    p."slug" = f."page"
    OR p."slug" = CASE
      WHEN f."page" LIKE '/%' THEN f."page"
      ELSE '/' || f."page"
    END
  );

ALTER TABLE "Faq" DROP COLUMN "page";

-- CreateIndex
CREATE UNIQUE INDEX "FrontendProject_apiKey_key" ON "FrontendProject"("apiKey");
CREATE INDEX "FrontendProject_siteId_idx" ON "FrontendProject"("siteId");
CREATE INDEX "FrontendProject_siteId_isActive_idx" ON "FrontendProject"("siteId", "isActive");

CREATE UNIQUE INDEX "SyncedRoute_siteId_route_key" ON "SyncedRoute"("siteId", "route");
CREATE INDEX "SyncedRoute_siteId_idx" ON "SyncedRoute"("siteId");
CREATE INDEX "SyncedRoute_pageId_idx" ON "SyncedRoute"("pageId");

CREATE INDEX "Faq_pageId_idx" ON "Faq"("pageId");

-- AddForeignKey
ALTER TABLE "FrontendProject" ADD CONSTRAINT "FrontendProject_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SyncedRoute" ADD CONSTRAINT "SyncedRoute_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyncedRoute" ADD CONSTRAINT "SyncedRoute_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Faq" ADD CONSTRAINT "Faq_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;
