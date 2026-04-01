import Database from "better-sqlite3";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const DB_PATH =
  process.env.DATABASE_URL?.replace("file:", "") ??
  path.join(process.cwd(), "presight.db");

import type BetterSqlite3 from "better-sqlite3";
export const db: BetterSqlite3.Database = new Database(DB_PATH);

// Ensure WAL mode for concurrent reads
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
