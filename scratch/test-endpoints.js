async function main() {
  const siteId = "cmqkq6zot00006suhu35xbuu3";
  const baseUrl = "http://localhost:3000";

  console.log("-----------------------------------------");
  console.log("1. Testing GET /api/global-settings");
  try {
    const res = await fetch(`${baseUrl}/api/global-settings?siteId=${siteId}`);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Keys in settings:", Object.keys(data.settings || {}));
    if (data.settings && 'websiteSettings' in data.settings && 'navigation' in data.settings) {
      console.log("✅ SUCCESS: websiteSettings and navigation are present!");
    } else {
      console.log("❌ FAILURE: websiteSettings or navigation missing!", data);
    }
  } catch (err) {
    console.error("Error querying global-settings:", err);
  }

  console.log("-----------------------------------------");
  console.log("2. Testing GET /api/seo/backup (without leading slash)");
  try {
    const res = await fetch(`${baseUrl}/api/seo/backup?siteId=${siteId}`);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
    if (data.success && data.seo.title === "Backup") {
      console.log("✅ SUCCESS: page metadata resolved successfully!");
    } else {
      console.log("❌ FAILURE:", data);
    }
  } catch (err) {
    console.error("Error querying seo/backup:", err);
  }

  console.log("-----------------------------------------");
  console.log("3. Testing GET /api/seo/%2Fbackup (with leading slash)");
  try {
    const res = await fetch(`${baseUrl}/api/seo/%2Fbackup?siteId=${siteId}`);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Data:", data);
    if (data.success && data.seo.title === "Backup") {
      console.log("✅ SUCCESS: page metadata resolved successfully!");
    } else {
      console.log("❌ FAILURE:", data);
    }
  } catch (err) {
    console.error("Error querying seo/%2Fbackup:", err);
  }

  console.log("-----------------------------------------");
  console.log("4. Testing GET /api/content?slug=backup");
  try {
    const res = await fetch(`${baseUrl}/api/content?slug=backup&siteId=${siteId}`);
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Keys in response:", Object.keys(data));
    if (data.page && data.page.title === "Backup") {
      console.log("✅ SUCCESS: content resolved successfully!");
    } else {
      console.log("❌ FAILURE:", data);
    }
  } catch (err) {
    console.error("Error querying content?slug=backup:", err);
  }
}

main();
