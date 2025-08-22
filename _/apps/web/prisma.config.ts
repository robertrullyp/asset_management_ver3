import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  seed: 'node prisma/seed.js',
})
