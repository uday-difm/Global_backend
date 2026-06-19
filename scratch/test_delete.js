async function test() {
  try {
    const pageId = "cmqkrpaq0000790uhxbyo2yq1";
    const url = `http://localhost:3000/api/admin/pages/${pageId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      }
    });

    console.log("DELETE Status:", res.status);
    const text = await res.text();
    console.log("DELETE Response:", text);
  } catch (err) {
    console.error(err);
  }
}

test();
