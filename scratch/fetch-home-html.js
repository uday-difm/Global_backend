async function main() {
  const url = "http://localhost:3000/";
  console.log(`Fetching HTML from ${url}...`);
  const res = await fetch(url);
  const text = await res.text();

  // Find g-recaptcha occurrence
  const idx = text.indexOf("g-recaptcha");
  if (idx === -1) {
    console.log("g-recaptcha class not found in HTML!");
  } else {
    console.log("Found g-recaptcha in HTML:");
    console.log(text.substring(idx - 100, idx + 200));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
