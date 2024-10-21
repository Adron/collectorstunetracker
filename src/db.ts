import { Kysely } from 'kysely';
import { PostgresDialect } from 'kysely';
import { Pool } from '@vercel/postgres';

interface User {
  user_id: string;
  tenant_id: string | null;
  username: string;
  password: string;
  created: Date;
  updated: Date;
  email: string;
  notes: string | null;
  message: string | null;
}

interface Database {
  users: User;
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool(),
  }),
});

export { db };
