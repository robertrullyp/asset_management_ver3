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
    const cacheTime = 300;
    prisma = prisma.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }) {
            const key = `${model}:findMany:${JSON.stringify(args)}`;
            const cached = await redis.get(key);
            if (cached) return JSON.parse(cached);
            const result = await query(args);
            await redis.set(key, JSON.stringify(result), "EX", cacheTime);
            return result;
          },
          async findUnique({ model, args, query }) {
            const key = `${model}:findUnique:${JSON.stringify(args)}`;
            const cached = await redis.get(key);
            if (cached) return JSON.parse(cached);
            const result = await query(args);
            await redis.set(key, JSON.stringify(result), "EX", cacheTime);
            return result;
          },
          async findFirst({ model, args, query }) {
            const key = `${model}:findFirst:${JSON.stringify(args)}`;
            const cached = await redis.get(key);
            if (cached) return JSON.parse(cached);
            const result = await query(args);
            await redis.set(key, JSON.stringify(result), "EX", cacheTime);
            return result;
          },
        },
      },
    });
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
