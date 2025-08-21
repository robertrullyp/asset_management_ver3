import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { createPrismaRedisCache } from "prisma-redis-middleware";

const prisma = new PrismaClient();

const url = process.env.REDIS_URL;
if (url) {
  const redis = new Redis(url);
  redis.on("error", (err) => {
    console.warn("Redis connection error; disabling cache", err);
  });
  prisma.$use(
    createPrismaRedisCache({
      storage: { type: "redis", options: { client: redis } },
      cacheTime: 300,
    }),
  );
} else {
  console.warn("REDIS_URL not set; Redis cache disabled");
}

export default prisma;
