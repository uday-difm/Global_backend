import { postRepository } from "@/repositories/post.repository";
import { BaseService } from "@/core/service";
import { EventBus } from "@/core/events";
import { NotFoundError } from "@/core/errors";

export class PostService extends BaseService {
  constructor() {
    super(postRepository);
  }

  async getPosts(siteId, options = {}) {
    const where = {};
    if (options.status) {
      where.status = options.status;
    }
    
    if (options.publicOnly) {
      where.status = "PUBLISHED";
      where.publishedAt = { lte: new Date() };
    }

    if (options.categoryId) {
      where.categories = { some: { id: options.categoryId } };
    }

    return this.getList(siteId, {
      where,
      orderBy: { createdAt: "desc" },
      include: { categories: true, tags: true, author: { select: { id: true, email: true } }, featuredImage: true },
    });
  }

  async getPostBySlug(siteId, slug) {
    const post = await postRepository.findBySlug(siteId, slug);
    if (!post) {
      throw new NotFoundError("Blog post");
    }
    return post;
  }

  async create(siteId, postData, userId = null, options = {}) {
    const { categoryIds, tagIds, ...data } = postData;

    const baseSlug = (data.slug && this.slugify(data.slug)) || this.slugify(data.title || "new-post");
    const slug = await this.generateUniquePostSlug(siteId, baseSlug);

    let publishedAtVal = null;
    if (data.publishedAt) {
      publishedAtVal = new Date(data.publishedAt);
    } else if (data.status === "PUBLISHED") {
      publishedAtVal = new Date();
    }

    const relations = {};
    if (categoryIds && categoryIds.length > 0) {
      relations.categories = { connect: categoryIds.map(id => ({ id })) };
    }
    if (tagIds && tagIds.length > 0) {
      relations.tags = { connect: tagIds.map(id => ({ id })) };
    }

    const created = await this.repository.create(siteId, {
      ...data,
      ...relations,
      slug,
      publishedAt: publishedAtVal,
      authorId: data.authorId || userId,
    });

    if (created.status === "PUBLISHED" && (!created.publishedAt || new Date(created.publishedAt) <= new Date())) {
      EventBus.emit("post.published", { siteId, data: created });
    }

    return created;
  }

  async update(siteId, postId, postData, userId = null, options = {}) {
    const { categoryIds, tagIds, ...data } = postData;

    const relations = {};
    if (categoryIds) {
      relations.categories = { set: categoryIds.map(id => ({ id })) };
    }
    if (tagIds) {
      relations.tags = { set: tagIds.map(id => ({ id })) };
    }

    const current = await this.repository.findUnique(siteId, postId);
    if (!current) {
      throw new NotFoundError("Blog post");
    }

    const wasPublished = current.status === "PUBLISHED";
    const willBePublished = data.status === "PUBLISHED";

    if (willBePublished && !current.publishedAt && !data.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await this.repository.update(siteId, postId, {
      ...data,
      ...relations,
    });

    if (!wasPublished && willBePublished && (!updated.publishedAt || new Date(updated.publishedAt) <= new Date())) {
      EventBus.emit("post.published", { siteId, data: updated });
    }

    return updated;
  }

  slugify(text = "") {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-");
  }

  async generateUniquePostSlug(siteId, baseSlug) {
    let candidate = baseSlug;
    let i = 0;
    while (await this.repository.findFirst(siteId, { where: { slug: candidate } })) {
      i += 1;
      candidate = `${baseSlug}-${i}`;
    }
    return candidate;
  }
}

export const postService = new PostService();
