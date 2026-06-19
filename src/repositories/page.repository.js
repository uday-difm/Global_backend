import { BaseRepository } from "@/core/repository";

export class PageRepository extends BaseRepository {
  constructor() {
    super("page");
  }

  async findBySlug(siteId, slug) {
    return this.findFirst(siteId, {
      where: { slug },
      include: { sections: { where: { isDeleted: false }, orderBy: { order: "asc" } } },
    });
  }
}

export const pageRepository = new PageRepository();
