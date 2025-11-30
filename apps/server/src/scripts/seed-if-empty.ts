import { pool } from "../db";
import { seed } from "./seed";

async function needSeed() {
  try {
    // Check if table exists and count rows
    const tbl = await pool.query("SELECT to_regclass('public.items') as t");
    if (!tbl.rows[0].t) return true; // table doesn't exist => need seed

    const res = await pool.query("SELECT COUNT(*)::bigint AS c FROM items");
    const count = Number(res.rows[0].c || 0);
    return count === 0;
  } catch (err) {
    console.warn("needSeed check failed, will seed:", err);
    return true;
  }
}

async function main() {
  const should = await needSeed();
  if (should) {
    console.log("items table missing or empty — running seed");
    await seed();
  } else {
    console.log("items table already populated — skipping seed");
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
