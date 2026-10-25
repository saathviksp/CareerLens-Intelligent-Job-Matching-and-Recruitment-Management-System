import fs from 'fs';
import path from 'path';
import { query } from '../lib/db';

async function resetDatabase() {
  console.log('🔄 Resetting CareerLens PostgreSQL database...');

  const dbDir = path.join(process.cwd(), 'db');

  // Step 1: Clean drop and recreate schema public
  console.log('📦 Dropping and recreating schema public...');
  await query('DROP SCHEMA IF EXISTS public CASCADE;');
  await query('CREATE SCHEMA public;');
  await query('GRANT ALL ON SCHEMA public TO PUBLIC;');

  // Step 2: Run 01_schema.sql
  console.log('📜 Executing 01_schema.sql...');
  const schemaSql = fs.readFileSync(path.join(dbDir, '01_schema.sql'), 'utf-8');
  await query(schemaSql);

  // Step 3: Run 02_functions.sql
  console.log('⚙️ Executing 02_functions.sql...');
  const functionsSql = fs.readFileSync(path.join(dbDir, '02_functions.sql'), 'utf-8');
  await query(functionsSql);

  // Step 4: Run 03_triggers.sql
  console.log('⚡ Executing 03_triggers.sql...');
  const triggersSql = fs.readFileSync(path.join(dbDir, '03_triggers.sql'), 'utf-8');
  await query(triggersSql);

  // Step 5: Run 04_views.sql
  console.log('👁️ Executing 04_views.sql...');
  const viewsSql = fs.readFileSync(path.join(dbDir, '04_views.sql'), 'utf-8');
  await query(viewsSql);

  // Step 6: Run 05_indexes.sql
  console.log('🚀 Executing 05_indexes.sql...');
  const indexesSql = fs.readFileSync(path.join(dbDir, '05_indexes.sql'), 'utf-8');
  await query(indexesSql);

  // Verify created tables
  const tablesRes = await query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  console.log(`✅ Database schema successfully reset! Total base tables created: ${tablesRes.rowCount}`);
  console.log('Tables:', tablesRes.rows.map(r => r.table_name).join(', '));

  process.exit(0);
}

resetDatabase().catch((err) => {
  console.error('❌ Failed to reset database:', err);
  process.exit(1);
});
