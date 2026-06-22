async function main() {
  const url = "http://localhost:3000/contact";
  console.log(`Fetching HTML from ${url}...`);
  const res = await fetch(url);
  const text = await res.text();

  // Find all script tags
  const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  let match;
  console.log("Script tags found in HTML:");
  while ((match = regex.exec(text)) !== null) {
    console.log(match[0]);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
