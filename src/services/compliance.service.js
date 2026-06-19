import prisma from "@/lib/prisma";
import { BaseService } from "@/core/service";
import { logAction } from "@/lib/audit";

export class ComplianceService extends BaseService {
  constructor() {
    super({ modelName: "globalSettings" });
  }

  async getConsentConfig(siteId) {
    const settings = await prisma.globalSettings.findUnique({
      where: { siteId },
      select: { compliance: true },
    });
    return settings?.compliance || {
      cookieConsentEnabled: true,
      cookieConsentMessage: "This website uses cookies to improve your experience."
    };
  }

  async updateConsentConfig(siteId, config) {
    return prisma.globalSettings.upsert({
      where: { siteId },
      update: { compliance: config },
      create: { siteId, compliance: config },
    });
  }

  async purgeGdprData(siteId, email, userId) {
    const deletedLeads = await prisma.lead.deleteMany({
      where: { siteId, email },
    });

    const deletedSubmissions = await prisma.contactFormSubmission.deleteMany({
      where: { siteId, email },
    });

    await logAction(siteId, userId, "GDPR_DATA_DELETION", {
      targetEmail: email,
      deletedLeadsCount: deletedLeads.count,
      deletedSubmissionsCount: deletedSubmissions.count,
    });

    return {
      purgedLeads: deletedLeads.count,
      purgedSubmissions: deletedSubmissions.count,
    };
  }
}

export const complianceService = new ComplianceService();
