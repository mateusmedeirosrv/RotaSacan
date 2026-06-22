import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL não definida no ambiente.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { ssl: "require", max: 1 });

try {
  const migration = readFileSync(
    join(__dir, "../supabase/migrations/001_initial_schema.sql"),
    "utf-8"
  );
  console.log("Aplicando migration 001_initial_schema.sql...");
  await sql.unsafe(migration);
  console.log("✓ Schema aplicado com sucesso.");
} catch (err) {
  console.error("Erro ao aplicar migration:", err.message);
  process.exit(1);
} finally {
  await sql.end();
}
