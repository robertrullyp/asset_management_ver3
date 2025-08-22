import { defineConfig } from 'prisma'

export default defineConfig({
  seed: 'node prisma/seed.js',
})
