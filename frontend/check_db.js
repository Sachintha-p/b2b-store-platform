import { Client } from 'pg';

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_98WZMYlSHPUd@ep-twilight-wave-b3o3xb8z-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

async function run() {
  await client.connect();
  
  // 1. Inspect current constraints
  console.log("--- BEFORE: Column Constraints ---");
  let res = await client.query(`
    SELECT column_name, is_nullable, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users';
  `);
  console.table(res.rows);

  // 2. Drop NOT NULL on password_hash and any other optional fields
  console.log("\n--- Executing Fixes ---");
  await client.query("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;");
  console.log("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL; -> Success");
  
  // Check if shipping_address or provider_id are also NOT NULL
  const shippingAddressCol = res.rows.find(r => r.column_name === 'shipping_address');
  if (shippingAddressCol && shippingAddressCol.is_nullable === 'NO') {
    await client.query("ALTER TABLE users ALTER COLUMN shipping_address DROP NOT NULL;");
    console.log("ALTER TABLE users ALTER COLUMN shipping_address DROP NOT NULL; -> Success");
  }
  
  const providerIdCol = res.rows.find(r => r.column_name === 'provider_id');
  if (providerIdCol && providerIdCol.is_nullable === 'NO') {
    await client.query("ALTER TABLE users ALTER COLUMN provider_id DROP NOT NULL;");
    console.log("ALTER TABLE users ALTER COLUMN provider_id DROP NOT NULL; -> Success");
  }

  // 3. Inspect after constraints
  console.log("\n--- AFTER: Column Constraints ---");
  res = await client.query(`
    SELECT column_name, is_nullable, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users';
  `);
  console.table(res.rows);
  
  await client.end();
}

run().catch(console.error);
