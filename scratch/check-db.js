const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:123@localhost:5432/global_backend"
});

async function main() {
  await client.connect();
  console.log("Connected to DB!");
  
  // List all tables
  const resTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.log("Tables:");
  console.log(resTables.rows.map(r => r.table_name));

  // List migration history
  try {
    const resMigrations = await client.query(`
      SELECT migration_name, applied_steps_count, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC;
    `);
    console.log("Applied Migrations:");
    console.table(resMigrations.rows);
  } catch (err) {
    console.log("Error querying _prisma_migrations:", err.message);
  }

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
