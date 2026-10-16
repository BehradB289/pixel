export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // مسیر API برای ذخیره و دریافت اطلاعات بازیکن از دیتابیس کلادفلر
    if (url.pathname === "/api/player") {
      const userId = url.searchParams.get("id");
      if (!userId) {
        return new Response(JSON.stringify({ error: "No user ID" }), { status: 400 });
      }

      if (request.method === "GET") {
        const data = await env.GAME_DB.get(`player_${userId}`);
        return new Response(data || JSON.stringify(null), {
          headers: { "Content-Type": "application/json" }
        });
      }

      if (request.method === "POST") {
        const body = await request.text();
        await env.GAME_DB.put(`player_${userId}`, body);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // نمایش فایل‌های گرافیکی بازی (React/Vite) برای بقیه آدرس‌ها
    return env.ASSETS.fetch(request);
  }
};
