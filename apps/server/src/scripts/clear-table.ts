import { pool } from "../db";

async function main() {
  try {
    console.log("Checking current row count...");
    const before = await pool.query("SELECT COUNT(*)::bigint AS c FROM items");
    const beforeCount = Number(before.rows?.[0]?.c ?? 0);
    console.log(`Rows before: ${beforeCount}`);

    console.log("Truncating table public.items (RESTART IDENTITY, CASCADE)...");
    await pool.query("TRUNCATE TABLE public.items RESTART IDENTITY CASCADE;");

    const after = await pool.query("SELECT COUNT(*)::bigint AS c FROM items");
    const afterCount = Number(after.rows?.[0]?.c ?? 0);
    console.log(`Rows after: ${afterCount}`);

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to clear table:", err);
    process.exit(1);
  } finally {
    // ensure pool drains
    try {
      await pool.end();
    } catch (_) {}
  }
}

if (require.main === module) {
  main();
}
