import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl =
  `postgresql://${process.env.POSTGRES_USERNAME}:` +
  `${process.env.POSTGRES_PASSWORD}@` +
  `${process.env.POSTGRES_HOST}:` +
  `${process.env.POSTGRES_PORT}/` +
  `${process.env.POSTGRES_NAME}`;

export default defineConfig({
  schema: 'prisma/schema/',

  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  datasource: {
    url: databaseUrl,
  },
});