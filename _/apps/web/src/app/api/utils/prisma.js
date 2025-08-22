import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

let prisma = new PrismaClient();
let redis;

try {
  await prisma.$connect();
} catch (err) {
  console.warn("Unable to connect to the database", err);
}

const url = process.env.REDIS_URL;
if (url) {
  redis = new Redis(url);
  redis.on("error", (err) => {
    console.warn("Redis connection error; disabling cache", err);
  });
  try {
    await redis.ping();
    const cacheTime = Number(process.env.REDIS_CACHE_TTL ?? 300);

    const createCacheExtension = (redis, ttl) => {
      const cached = (action) => async ({ model, args, query }) => {
        const key = `${model}:${action}:${JSON.stringify(args)}`;
        const cachedValue = await redis.get(key);
        if (cachedValue) return JSON.parse(cachedValue);
        const result = await query(args);
        await redis.set(key, JSON.stringify(result), "EX", ttl);
        return result;
      };

      return {
        query: {
          $allModels: {
            findMany: cached("findMany"),
            findUnique: cached("findUnique"),
            findFirst: cached("findFirst"),
          },
        },
      };
    };

    prisma = prisma.$extends(createCacheExtension(redis, cacheTime));
  } catch (err) {
    console.warn("Unable to connect to Redis; Redis cache disabled", err);
    redis.disconnect();
    redis = undefined;
  }
} else {
  console.warn("REDIS_URL not set; Redis cache disabled");
}

process.on("beforeExit", async () => {
  await prisma.$disconnect();
  redis?.disconnect();
});

export default prisma;
