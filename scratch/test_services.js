async function test() {
  try {
    const url = "http://localhost:3000/api/admin/services";
    const body = {
      title: `Test Service ${Date.now()}`,
      description: "Test description.",
      price: "$100",
      status: "DRAFT"
    };

    // 1. POST (create service)
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

    const serviceObj = JSON.parse(text).service;
    const serviceId = serviceObj.id;

    // 2. PATCH (update service)
    const patchRes = await fetch(`http://localhost:3000/api/admin/services/${serviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      },
      body: JSON.stringify({
        title: `Updated Service Title ${Date.now()}`,
        status: "ACTIVE"
      })
    });

    console.log("PATCH Status:", patchRes.status);
    console.log("PATCH Response:", await patchRes.text());

    // 3. DELETE (delete service)
    const deleteRes = await fetch(`http://localhost:3000/api/admin/services/${serviceId}`, {
      method: "DELETE",
      headers: {
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      }
    });

    console.log("DELETE Status:", deleteRes.status);
    console.log("DELETE Response:", await deleteRes.text());

  } catch (err) {
    console.error(err);
  }
}

test();
