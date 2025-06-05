import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

// Construct the connection string from Supabase URL
const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
const connectionString = `postgres://postgres:${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}@${supabaseUrl.hostname}:5432/postgres`;

const connection = postgres(connectionString, { max: 1 });
const db = drizzle(connection);

async function main() {
  console.log('Migration started');
  await migrate(db, { migrationsFolder: 'lib/db/migrations' });
  console.log('Migration completed');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed');
  console.error(err);
  process.exit(1);
});
