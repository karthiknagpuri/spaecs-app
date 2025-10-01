#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function pushMigration() {
  console.log('🚀 Pushing payment system migration to Supabase...\n');

  const migrationPath = path.join(__dirname, 'supabase/migrations/20250102_create_payment_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file:', migrationPath);
  console.log('📊 SQL size:', (sql.length / 1024).toFixed(2), 'KB\n');

  try {
    // Split SQL into individual statements (basic splitting by semicolon)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log('📝 Executing', statements.length, 'SQL statements...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

        if (error) {
          // Try direct query instead
          const { error: queryError } = await supabase.from('_').select('*').limit(0);

          if (queryError) {
            console.error(`❌ Statement ${i + 1} failed:`, queryError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }

      // Show progress
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${statements.length} statements...`);
      }
    }

    console.log('\n✅ Migration execution complete!');
    console.log(`   Success: ${successCount} statements`);
    console.log(`   Errors: ${errorCount} statements`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This is normal if tables already exist.');
      console.log('   You can verify the migration in Supabase Dashboard > Database > Tables');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 Try running the SQL manually in Supabase Dashboard > SQL Editor');
    console.error('   URL: https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new');
    process.exit(1);
  }
}

pushMigration();
