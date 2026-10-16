export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "No user ID" }), { status: 400 });
  }

  // دریافت اطلاعات بازیکن از دیتابیس کلادفلر
  if (request.method === "GET") {
    const data = await env.GAME_DB.get(`player_${userId}`);
    return new Response(data || JSON.stringify(null), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // ذخیره اطلاعات بازیکن در دیتابیس کلادفلر
  if (request.method === "POST") {
    const body = await request.text();
    await env.GAME_DB.put(`player_${userId}`, body);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Method not allowed", { status: 405 });
}
