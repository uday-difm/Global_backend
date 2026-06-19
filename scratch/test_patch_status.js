async function test() {
  try {
    const pageId = "cmqkquhje000290uhtq7j9ibd";
    const url = `http://localhost:3000/api/admin/pages/${pageId}`;
    
    // Toggle to PUBLISHED
    const res1 = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      },
      body: JSON.stringify({ status: "PUBLISHED" })
    });

    console.log("PATCH PUBLISHED Status:", res1.status);
    console.log("Response:", await res1.text());

    // Toggle back to DRAFT
    const res2 = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      },
      body: JSON.stringify({ status: "DRAFT" })
    });

    console.log("PATCH DRAFT Status:", res2.status);
    console.log("Response:", await res2.text());
  } catch (err) {
    console.error(err);
  }
}

test();
