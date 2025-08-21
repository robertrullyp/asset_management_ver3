import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { createPrismaRedisCache } from "prisma-redis-middleware";

const prisma = new PrismaClient();
let redis;

(async () => {
  try {
    await prisma.$connect();
  } catch (err) {
    console.warn("Unable to connect to the database", err);
    return;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("REDIS_URL not set; Redis cache disabled");
    return;
  }

  redis = new Redis(url);
  redis.on("error", (err) => {
    console.warn("Redis connection error; disabling cache", err);
  });

  try {
    await redis.ping();
    prisma.$use(
      createPrismaRedisCache({
        storage: { type: "redis", options: { client: redis } },
        cacheTime: 300,
      }),
    );
  } catch (err) {
    console.warn("Unable to connect to Redis; Redis cache disabled", err);
    redis.disconnect();
    redis = undefined;
  }
})();

process.on("beforeExit", async () => {
  await prisma.$disconnect();
  redis?.disconnect();
});

export default prisma;
