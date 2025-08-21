import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { createPrismaRedisCache } from "prisma-redis-middleware";

const prisma = new PrismaClient();

const url = process.env.REDIS_URL;
if (url) {
  const redis = new Redis(url);
  try {
    await redis.ping();
    redis.on("error", (err) => {
      console.warn("Redis connection error; disabling cache", err);
    });
    prisma.$use(
      createPrismaRedisCache({
        storage: { type: "redis", options: { client: redis } },
        cacheTime: 300,
      }),
    );
  } catch (err) {
    console.warn("Unable to connect to Redis; Redis cache disabled", err);
    redis.disconnect();
  }
} else {
  console.warn("REDIS_URL not set; Redis cache disabled");
}

export default prisma;
