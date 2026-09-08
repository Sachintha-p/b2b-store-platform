const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_98WZMYlSHPUd@ep-twilight-wave-b3o3xb8z-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function run() {
  await client.connect();
  const res = await client.query("SELECT id, email, role FROM users WHERE role = 'ADMIN'");
  console.log("ADMIN Users:");
  console.table(res.rows);
  
  const res2 = await client.query("SELECT id, email, role FROM users");
  console.log("All Users:");
  console.table(res2.rows);
  
  await client.end();
}

run().catch(console.error);
