import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: '.env.local',
});

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

// Construct the connection string from Supabase URL
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const connectionString = `postgres://postgres:${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}@${supabaseUrl.hostname}:5432/postgres`;

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString,
  },
});
