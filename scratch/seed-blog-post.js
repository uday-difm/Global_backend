const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

async function main() {
  console.log("Initializing database connection...");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // 1. Get the active Site
  const site = await prisma.site.findFirst({
    where: { isActive: true, deletedAt: null }
  });
  if (!site) {
    console.error("No active Site found in database!");
    await prisma.$disconnect();
    await pool.end();
    return;
  }
  console.log(`Found active site: ${site.name} (ID: ${site.id})`);

  // 2. Get any User to act as the Author
  let user = await prisma.user.findFirst({
    where: { deletedAt: null }
  });
  if (!user) {
    console.log("No user found. Creating a test author user...");
    // We can fetch a quick bcrypt hash or create a placeholder
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash("password123", 10);
    user = await prisma.user.create({
      data: {
        email: "author@test.com",
        passwordHash,
        globalRole: "AUTHOR"
      }
    });
  }
  console.log(`Using Author: ${user.email} (ID: ${user.id})`);

  // 3. Create or get Category
  const categoryName = "Technology";
  const categorySlug = "technology";
  let category = await prisma.category.findUnique({
    where: { slug: categorySlug }
  });
  if (!category) {
    console.log(`Creating category: ${categoryName}...`);
    category = await prisma.category.create({
      data: {
        name: categoryName,
        slug: categorySlug
      }
    });
  }
  console.log(`Using Category: ${category.name} (ID: ${category.id})`);

  // 4. Create or update the blog post
  const postSlug = "hello-world";
  const postTitle = "Hello World from Global Backend";
  const postExcerpt = "A simple test blog post verifying that dynamic routing and markdown rendering works beautifully.";
  const postContent = `# Welcome to Global Backend!

This is our first blog post rendered dynamically using the catch-all router.

## Why Headless CMS?

Headless CMS separates the content repository from the presentation layer.

- **Speed:** Fast response times using Next.js.
- **Flexibility:** Use any frontend.
- **Control:** Centralized management.

> "The future of the web is headless and modular."

Here is a quick code example:

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

Enjoy using **Global Backend**!`;

  // Upsert the post
  const existingPost = await prisma.post.findFirst({
    where: { siteId: site.id, slug: postSlug }
  });

  let post;
  if (existingPost) {
    console.log(`Post with slug "${postSlug}" already exists. Updating content...`);
    post = await prisma.post.update({
      where: { id: existingPost.id },
      data: {
        title: postTitle,
        content: postContent,
        excerpt: postExcerpt,
        status: "PUBLISHED",
        authorId: user.id,
        publishedAt: new Date(),
        categories: {
          set: [{ id: category.id }]
        }
      }
    });
  } else {
    console.log(`Creating new blog post with slug "${postSlug}"...`);
    post = await prisma.post.create({
      data: {
        siteId: site.id,
        title: postTitle,
        slug: postSlug,
        content: postContent,
        excerpt: postExcerpt,
        status: "PUBLISHED",
        authorId: user.id,
        publishedAt: new Date(),
        categories: {
          connect: [{ id: category.id }]
        }
      }
    });
  }

  console.log(`Seeding completed successfully!`);
  console.log(`Post ID: ${post.id}`);
  console.log(`Post Slug: ${post.slug}`);
  console.log(`Test URL: /blogs/${post.slug} or /blog/${post.slug}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
