async function test() {
  try {
    const url = "http://localhost:3000/api/admin/pages";
    const body = {
      title: `Test Page ${Date.now()}`,
      slug: `test-page-${Date.now()}`
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      },
      body: JSON.stringify(body)
    });

    console.log("POST Status:", res.status);
    const text = await res.text();
    console.log("POST Response:", text);
  } catch (err) {
    console.error(err);
  }
}

test();
