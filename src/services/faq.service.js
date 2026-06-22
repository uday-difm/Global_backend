import { faqRepository } from "@/repositories/faq.repository";
import { BaseService } from "@/core/service";
import { FaqValidationSchema } from "@/lib/validators/faq";

export class FaqService extends BaseService {
  constructor() {
    super(faqRepository, FaqValidationSchema);
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

  generateFaqSchemaMarkup(faqs) {
    if (!faqs || faqs.length === 0) return null;

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  async getSchemaMarkupForPage(siteId, pageSlug) {
    const faqs = await this.getFaqs(siteId, {
      page: pageSlug,
      showHide: true
    });

    const schemaFaqs = faqs.filter(f => f.schemaMarkup);
    if (schemaFaqs.length === 0) return null;

    return this.generateFaqSchemaMarkup(schemaFaqs);
  }
}

export const faqService = new FaqService();
