import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { createPrismaRedisCache } from 'prisma-redis-middleware';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

prisma.$use(
  createPrismaRedisCache({
    storage: { type: 'redis', options: { client: redis } },
    cacheTime: 300,
  }),
);

export default prisma;
