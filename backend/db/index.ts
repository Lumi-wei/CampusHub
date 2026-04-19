import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please create a .env file with your database connection string.');
}

const client = postgres(connectionString || '', { max: 1 });
export const db = connectionString ? drizzle(client, { schema }) : null;