import type { APIRoute } from "astro";
import { redis } from "../../lib/redis";

export const POST: APIRoute = async ({ request }) => {
  const forwarded =
    request.headers.get("x-forwarded-for");

  const ip =
    forwarded?.split(",")[0].trim() ??
    "unknown";

  const ipKey = `portfolio:liked:${ip}`;

  const alreadyLiked =
    await redis.exists(ipKey);

  if (!alreadyLiked) {
    await redis.set(ipKey, "1");

    await redis.incr(
      "portfolio:likes"
    );
  }

  const likes =
    (await redis.get<number>("portfolio:likes")) ?? 0;

  return new Response(
    JSON.stringify({
      likes,
      liked: true,
      alreadyLiked,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};