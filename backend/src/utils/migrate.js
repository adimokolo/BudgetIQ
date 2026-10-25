const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

const migrationsDir = path.resolve(__dirname, "../../migrations");

const articleColumns = [
  "id",
  "title",
  "slug",
  "summary",
  "body",
  "seo_title",
  "meta_description",
  "status",
  "author_id",
  "published_at",
  "created_at",
  "updated_at",
];

async function existingArticleTableIsComplete(client) {
  const result = await client.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'articles'`
  );

  if (result.rowCount === 0) return false;

  const found = new Set(result.rows.map((row) => row.column_name));
  const missing = articleColumns.filter((column) => !found.has(column));

  if (missing.length) {
    throw new Error(
      `Existing articles table is incomplete; missing columns: ${missing.join(", ")}. No migrations were applied.`
    );
  }

  return true;
}

async function migrate() {
  if (process.env.ALLOW_DATABASE_MIGRATIONS !== "true") {
    throw new Error(
      "Migrations are disabled. Set ALLOW_DATABASE_MIGRATIONS=true only after verifying the database target."
    );
  }

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();

    for (const filename of files) {
      const existing = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [filename]
      );

      if (existing.rowCount) {
        console.log(`Skipping applied migration: ${filename}`);
        continue;
      }

      // Adopt the existing CMS schema without rerunning migration 011.
      // This is safe only when every expected original column is present.
      if (filename === "011_create_articles.sql") {
        const hasCompleteArticles =
          await existingArticleTableIsComplete(client);

        if (hasCompleteArticles) {
          await client.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
            [filename]
          );
          console.log(
            "Recorded 011_create_articles.sql as baseline; existing articles table is complete."
          );
          continue;
        }
      }

      const sql = fs.readFileSync(
        path.join(migrationsDir, filename),
        "utf8"
      );

      console.log(`Applying migration: ${filename}`);
      await client.query("BEGIN");

      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename]
        );
        await client.query("COMMIT");
        console.log(`Applied: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`${filename} failed: ${error.message}`);
      }
    }

    console.log("Migration run completed.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error("Migration run failed:", error.message);
  process.exitCode = 1;
});
