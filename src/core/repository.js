import prisma from "@/lib/prisma";

export class BaseRepository {
  constructor(modelName) {
    if (!modelName || !prisma[modelName]) {
      throw new Error(`Invalid model name: ${modelName}`);
    }
    this.modelName = modelName;
    this.db = prisma[modelName];
    this.isSiteScoped = [
      "page",
      "post",
      "service",
      "testimonial",
      "faq",
      "teamMember",
      "legalPage",
      "redirect",
      "visitorLog",
      "contactFormSubmission",
      "lead",
      "apiKey",
      "media",
      "mediaFolder",
      "globalSettings",
      "webhookEvent",
      "webhookSubscription",
      "siteUser",
      "auditLog",
    ].includes(modelName);
  }

  async findMany(siteId, options = {}) {
    const where = (this.isSiteScoped && siteId !== null && siteId !== undefined)
      ? { siteId, ...options.where }
      : { ...options.where };
    return this.db.findMany({
      ...options,
      where,
    });
  }

  async findUnique(siteId, id, options = {}) {
    const where = (this.isSiteScoped && siteId !== null && siteId !== undefined)
      ? { id, siteId, ...options.where }
      : { id, ...options.where };
    if (!this.isSiteScoped) {
      return this.db.findUnique({
        ...options,
        where: { id },
      });
    }
    return this.db.findFirst({
      ...options,
      where,
    });
  }

  async findFirst(siteId, options = {}) {
    const where = (this.isSiteScoped && siteId !== null && siteId !== undefined)
      ? { siteId, ...options.where }
      : { ...options.where };
    return this.db.findFirst({
      ...options,
      where,
    });
  }


  async create(siteId, data, options = {}) {
    const createData = (this.isSiteScoped && siteId !== null && siteId !== undefined)
      ? { ...data, siteId }
      : data;
    return this.db.create({
      ...options,
      data: createData,
    });
  }

  async update(siteId, id, data, options = {}) {
    if (this.isSiteScoped) {
      const record = await this.findUnique(siteId, id);
      if (!record) {
        throw new Error(`Record not found or access denied in ${this.modelName}: ${id}`);
      }
    }
    return this.db.update({
      ...options,
      where: { id },
      data,
    });
  }

  async delete(siteId, id, options = {}) {
    if (this.isSiteScoped) {
      const record = await this.findUnique(siteId, id);
      if (!record) {
        throw new Error(`Record not found or access denied in ${this.modelName}: ${id}`);
      }
    }
    return this.db.delete({
      ...options,
      where: { id },
    });
  }

  async count(siteId, whereClause = {}) {
    const where = (this.isSiteScoped && siteId !== null && siteId !== undefined)
      ? { siteId, ...whereClause }
      : whereClause;
    return this.db.count({ where });
  }
}

