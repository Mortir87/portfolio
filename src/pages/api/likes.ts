import type { APIRoute } from "astro";
import { redis } from "../../lib/redis";

export const GET: APIRoute = async () => {
  const likes =
    (await redis.get<number>("portfolio:likes")) ?? 0;

  return new Response(
    JSON.stringify({ likes }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};