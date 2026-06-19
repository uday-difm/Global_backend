import { faqRepository } from "@/repositories/faq.repository";
import { BaseService } from "@/core/service";

export class FaqService extends BaseService {
  constructor() {
    super(faqRepository);
  }

  async getFaqs(siteId, options = {}) {
    const where = {};
    if (options.page) {
      where.page = options.page;
    }
    if (options.showHide !== undefined) {
      where.showHide = options.showHide;
    }
    return this.getList(siteId, {
      where,
      orderBy: { sortOrder: "asc" },
    });
  }
}

export const faqService = new FaqService();
