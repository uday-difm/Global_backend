async function test() {
  try {
    const url = "http://localhost:3000/api/admin/posts";
    const body = {
      title: `New Test Blog Post ${Date.now()}`,
      slug: `test-post-${Date.now()}`,
      content: "This is some test blog content.",
      status: "DRAFT"
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
    
    const postObj = JSON.parse(text).post;
    const postId = postObj.id;

    // Now test PATCH (update post)
    const patchRes = await fetch(`http://localhost:3000/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-site-id": "cmqkq6zot00006suhu35xbuu3"
      },
      body: JSON.stringify({
        title: `Updated Title ${Date.now()}`,
        status: "PUBLISHED"
      })
    });

    console.log("PATCH Status:", patchRes.status);
    console.log("PATCH Response:", await patchRes.text());

    // Now test DELETE (delete post)
    const deleteRes = await fetch(`http://localhost:3000/api/admin/posts/${postId}`, {
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
