async function test() {
  try {
    const url = "http://localhost:3000/api/admin/pages";
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      }
    });

    console.log("GET Status:", res.status);
    const text = await res.text();
    console.log("GET Response:", text.substring(0, 500) + "...");
  } catch (err) {
    console.error(err);
  }
}

test();
