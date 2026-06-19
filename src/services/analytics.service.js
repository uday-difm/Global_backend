import prisma from "@/lib/prisma";
import { BaseService } from "@/core/service";

export class AnalyticsService extends BaseService {
  constructor() {
    super({ modelName: "visitorLog" });
  }

  async recordPing(siteId, pingData) {
    const { visitorId, pageViewed, location, deviceInfo, trafficSource } = pingData;
    const page = pageViewed.startsWith("/") ? pageViewed : `/${pageViewed}`;
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const existingLog = await prisma.visitorLog.findFirst({
      where: {
        siteId,
        visitorId,
        pageViewed: page,
        createdAt: { gte: twoMinutesAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingLog) {
      const diffSeconds = Math.round((Date.now() - new Date(existingLog.createdAt).getTime()) / 1000);
      const updated = await prisma.visitorLog.update({
        where: { id: existingLog.id },
        data: { duration: diffSeconds },
      });
      return { logId: updated.id, updated: true };
    }

    const created = await prisma.visitorLog.create({
      data: {
        siteId,
        visitorId,
        pageViewed: page,
        location: location || "Unknown",
        deviceInfo: deviceInfo || "Unknown",
        trafficSource: trafficSource || "Direct",
        duration: 0,
      },
    });

    return { logId: created.id, created: true };
  }

  async getLiveVisitorsCount(siteId) {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    const activeVisitors = await prisma.visitorLog.groupBy({
      by: ["visitorId"],
      where: {
        siteId,
        createdAt: { gte: twoMinutesAgo },
      },
    });

    return activeVisitors.length;
  }

  async getVisitorLogs(siteId, options = {}) {
    const skip = options.skip || 0;
    const take = options.take || 50;

    return prisma.visitorLog.findMany({
      where: { siteId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  }
}

export const analyticsService = new AnalyticsService();
