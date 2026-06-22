import { BaseRepository } from "@/core/repository";

export class LegalPageRepository extends BaseRepository {
  constructor() {
    super("legalPage");
  }

  async findByType(siteId, type) {
    // Uses findFirst to leverage the soft-delete filter automatically applied in BaseRepository
    return this.findFirst(siteId, {
      where: { type }
    });
  }

  async upsertLegalPage(siteId, type, data) {
    // Check if it already exists (including soft-deleted ones)
    const existing = await this.db.findFirst({
      where: { siteId, type }
    });

    if (existing) {
      return this.db.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          content: data.content,
          lastUpdated: new Date(),
          deletedAt: null // Restore if it was soft-deleted
        }
      });
    }

    return this.db.create({
      data: {
        siteId,
        type,
        title: data.title,
        content: data.content,
        lastUpdated: new Date()
      }
    });
  }
}

export const legalPageRepository = new LegalPageRepository();
