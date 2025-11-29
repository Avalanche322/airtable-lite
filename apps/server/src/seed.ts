import { initDb, pool } from "./db";

function randomChoice<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeRow(i: number) {
  return {
    title: `Item ${i}`,
    status: randomChoice(["draft", "in_review", "published", "archived"]),
    score: Math.floor(Math.random() * 1000) / 10,
    category: randomChoice(["ad", "social", "banner", "email", "landing"]),
    created_by: `seed_${i % 10}`,
    assignee: `person_${i % 5}`,
    priority: randomChoice(["low", "medium", "high"]),
    tags: [randomChoice(["summer", "sale", "test", "promo"])],
    comments: `Some notes for ${i}`,
    approved: Math.random() > 0.8,
    type: randomChoice(["creative", "copy", "video"]),
    owner: `owner_${i % 7}`,
    size: Math.floor(Math.random() * 100),
    color: randomChoice(["red", "blue", "green", "yellow"]),
    source: randomChoice(["inhouse", "agency", "partner"]),
    rating: Math.floor(Math.random() * 5) + 1,
    location: randomChoice(["US", "EU", "APAC"]),
    notes: `Notes ${i}`,
    active: Math.random() > 0.2,
    meta: { rand: Math.random(), index: i },
  };
}

export async function seed(count = 50000, batchSize = 1000) {
  console.log(`Seeding ${count} rows (batch ${batchSize})...`);
  await initDb();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let inserted = 0;
    for (let i = 0; i < count; i += batchSize) {
      const batch: any[] = [];
      const upper = Math.min(i + batchSize, count);
      for (let j = i; j < upper; j++) {
        batch.push(makeRow(j + 1));
      }

      const valuesPlaceholders = batch.map((_, idx) => `($${idx + 1})`).join(',');
      const text = `INSERT INTO items (data) VALUES ${valuesPlaceholders}`;
      await client.query(text, batch as any[]);
      inserted += batch.length;
      if (inserted % 5000 === 0) {
        console.log(`Inserted ${inserted}/${count}`);
      }
    }
    await client.query("COMMIT");
    console.log("Seeding complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding failed", err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const envCount = Number(process.env.SEED_COUNT || process.argv[2] || 50000);
  const envBatch = Number(process.env.SEED_BATCH || process.argv[3] || 1000);
  seed(envCount, envBatch)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
