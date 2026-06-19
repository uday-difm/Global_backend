async function test() {
  try {
    const url = "http://localhost:3000/api/admin/pages/cmqkquhje000290uhtq7j9ibd";
    const body = {
      title: "Home",
      slug: "home",
      seoTitle: "",
      seoDescription: "",
      jsonLd: null
    };

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      },
      body: JSON.stringify(body)
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}

test();
