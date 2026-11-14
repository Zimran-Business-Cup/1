import postgres from "postgres";
import { MIGRATIONS } from "./migrations";

// Without DATABASE_URL, db() returns null and callers skip their writes.

type Sql = postgres.Sql;

// One pool per process, kept on globalThis so dev hot reloads don't open new ones.
const globals = globalThis as typeof globalThis & { __sql?: Sql; __sqlMigrated?: Promise<void> };

function pool(): Sql | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  globals.__sql ??= postgres(url, { max: 5, idle_timeout: 30, connect_timeout: 5, onnotice: () => {} });
  return globals.__sql;
}

async function migrate(sql: Sql) {
  await sql.begin(async (tx) => {
    // Two app instances starting at once must not race on the schema.
    await tx`select pg_advisory_xact_lock(727274)`;
    await tx`create table if not exists schema_migrations (
      id int primary key, name text not null, applied_at timestamptz not null default now()
    )`;
    const done = new Set((await tx<{ id: number }[]>`select id from schema_migrations`).map((r) => r.id));
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      await tx.unsafe(m.sql);
      await tx`insert into schema_migrations (id, name) values (${m.id}, ${m.name})`;
    }
  });
}

/** The pool, migrated. null when DATABASE_URL isn't set. */
export async function db(): Promise<Sql | null> {
  const sql = pool();
  if (!sql) return null;
  globals.__sqlMigrated ??= migrate(sql).catch((error) => {
    globals.__sqlMigrated = undefined; // retry on the next call
    throw error;
  });
  await globals.__sqlMigrated;
  return sql;
}

/** Runs a write without failing the user's request if the database is down. */
export async function bestEffort(label: string, write: (sql: Sql) => Promise<unknown>): Promise<boolean> {
  try {
    const sql = await db();
    if (!sql) return false;
    await write(sql);
    return true;
  } catch (error) {
    console.error(`[db] ${label} failed:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/** "up", "down" or "off" (no DATABASE_URL), for /api/health. */
export async function dbStatus(): Promise<"up" | "down" | "off"> {
  try {
    const sql = await db();
    if (!sql) return "off";
    await sql`select 1`;
    return "up";
  } catch {
    return "down";
  }
}
