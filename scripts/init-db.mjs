import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { newDb } from "pg-mem";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile() {
  const envPath = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile();

  const connectionString = process.env.DATABASE_URL;
  const schemaPath = path.join(projectRoot, "src", "lib", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  if (!connectionString) {
    const db = newDb();
    const { Pool: PgMemPool } = db.adapters.createPg();
    const pool = new PgMemPool();

    try {
      await pool.query(schemaSql);
      console.log("Database schema applied successfully using pg-mem.");
    } catch (error) {
      console.error("Unable to apply database schema:");
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    } finally {
      await pool.end();
    }

    return;
  }

  const pool = new Pool({ connectionString });

  try {
    await pool.query(schemaSql);
    console.log("Database schema applied successfully.");
  } catch (error) {
    console.error("Unable to apply database schema:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
