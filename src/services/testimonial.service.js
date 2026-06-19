import { testimonialRepository } from "@/repositories/testimonial.repository";
import { BaseService } from "@/core/service";

export class TestimonialService extends BaseService {
  constructor() {
    super(testimonialRepository);
  }

  async getTestimonials(siteId, options = {}) {
    const where = {};
    if (options.showHide !== undefined) {
      where.showHide = options.showHide;
    }
    return this.getList(siteId, {
      where,
      orderBy: { sortOrder: "asc" },
    });
  }
}

export const testimonialService = new TestimonialService();
