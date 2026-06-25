import { legalPageRepository } from "@/repositories/legalPage.repository";
import { BaseService } from "@/core/service";
import { LegalPageValidationSchema } from "@/lib/validators/legalPage";

export class LegalPageService extends BaseService {
  constructor() {
    super(legalPageRepository, LegalPageValidationSchema);
  }

  async getPageByType(siteId, type) {
    if (!["privacy", "terms", "cookies", "disclaimer", "refund"].includes(type)) {
      throw new Error(`Invalid legal page type: ${type}`);
    }
    return this.repository.findByType(siteId, type);
  }

  async getPublishedPageByType(siteId, type) {
    if (!["privacy", "terms", "cookies", "disclaimer", "refund"].includes(type)) {
      throw new Error(`Invalid legal page type: ${type}`);
    }
    return this.repository.findPublishedByType(siteId, type);
  }


  async getAllActivePages(siteId) {
    return this.getList(siteId, {
      orderBy: { type: "asc" }
    });
  }

  async savePage(siteId, type, data, userId = null) {
    // Validate type first
    if (!["privacy", "terms", "cookies", "disclaimer", "refund"].includes(type)) {
      throw new Error(`Invalid legal page type: ${type}`);
    }

    // Validate request data with Zod
    const validatedData = await this.validate({ ...data, type });

    // Perform the upsert operation via repository
    const savedPage = await this.repository.upsertLegalPage(siteId, type, validatedData);

    // Audit Logging
    if (userId) {
      const { logAction } = await import("@/lib/audit");
      try {
        await logAction(siteId, userId, `LEGALPAGE_SAVE`, {
          id: savedPage.id,
          type: savedPage.type,
        });
      } catch (err) {
        console.error("Audit log failed for legal page save action:", err);
      }
    }

    return savedPage;
  }
}

export const legalPageService = new LegalPageService();
