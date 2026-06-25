async function testRoute(slug) {
  const url = `http://localhost:3005/api/content?slug=${encodeURIComponent(slug)}&siteId=layman_litigation`;
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function main() {
  console.log("--- Testing DRAFT route: /blogs ---");
  await testRoute("/blogs");

  console.log("\n--- Testing PUBLISHED route: /blog ---");
  await testRoute("/blog");
}

main();
