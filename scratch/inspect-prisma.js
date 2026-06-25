const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Post fields in Prisma Client:");
  // Let's print the model metadata if available, or just check what fields exist on a new post or by inspecting the client object.
  const postModel = prisma._dmmf?.modelMap?.Post;
  if (postModel) {
    console.log(postModel.fields.map(f => `${f.name}: ${f.type} (isRelation: ${f.isRelation || false})`));
  } else {
    console.log("DMMF model map not directly exposed. Trying to get fields keys...");
    console.log("Keys on prisma.post:", Object.keys(prisma.post));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
