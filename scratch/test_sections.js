async function test() {
  try {
    const pageId = "cmqkquhje000290uhtq7j9ibd";
    const getUrl = `http://localhost:3000/api/admin/pages/${pageId}/sections`;
    
    // 1. Test GET sections
    const getRes = await fetch(getUrl, {
      method: "GET",
      headers: {
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      }
    });

    console.log("GET Sections Status:", getRes.status);
    const getText = await getRes.text();
    console.log("GET Response:", getText);

    // 2. Test POST section (create section)
    const postRes = await fetch(getUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      },
      body: JSON.stringify({
        type: "TEXT_BLOCK",
        content: { body: "<p>Hello world section</p>" }
      })
    });

    console.log("POST Section Status:", postRes.status);
    const postText = await postRes.text();
    console.log("POST Response:", postText);

    // 3. Test GET sections again to verify listing
    const getRes2 = await fetch(getUrl, {
      method: "GET",
      headers: {
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      }
    });

    console.log("GET Sections (after insert) Status:", getRes2.status);
    const getText2 = await getRes2.text();
    console.log("GET Response 2:", getText2);

  } catch (err) {
    console.error(err);
  }
}

test();
