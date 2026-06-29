require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  const res = await client.query('SELECT "compliance" FROM "GlobalSettings" WHERE "siteId" = \'layman_litigation\'');
  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}

main().catch(console.error);
