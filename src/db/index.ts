import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | null = null;

function getDb(): DrizzleDb | null {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During static build, return a mock db that won't be used
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return null;
    }
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}

export const db = new Proxy({} as DrizzleDb, {
  get(_, prop) {
    const d = getDb();
    if (!d) return undefined;
    return d[prop as keyof DrizzleDb];
  },
});

export type DB = typeof db;
