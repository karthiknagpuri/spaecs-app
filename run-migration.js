#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const projectRef = 'vnqgdftaxhflidnoksnv';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function pushMigration() {
  console.log('🚀 Pushing payment system migration to Supabase...\n');

  const migrationPath = path.join(__dirname, 'supabase/migrations/20250102_create_payment_system.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Reading migration file...');
  console.log('📊 Size:', (sql.length / 1024).toFixed(2), 'KB\n');

  console.log('⚠️  Note: Supabase REST API cannot execute DDL statements directly.\n');
  console.log('📋 Please use one of these methods:\n');
  console.log('1. Supabase Dashboard SQL Editor (Recommended):');
  console.log('   https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new\n');
  console.log('2. Copy migration to clipboard:');
  console.log('   cat supabase/migrations/20250102_create_payment_system.sql | pbcopy\n');
  console.log('3. Use psql with database password:');
  console.log('   PGPASSWORD=your_password psql "postgresql://postgres.vnqgdftaxhflidnoksnv@db.vnqgdftaxhflidnoksnv.supabase.co:5432/postgres" -f supabase/migrations/20250102_create_payment_system.sql\n');

  // Try to copy to clipboard
  const { exec } = require('child_process');
  exec(`cat "${migrationPath}" | pbcopy`, (error) => {
    if (!error) {
      console.log('✅ Migration SQL copied to clipboard!');
      console.log('   Just paste it in the SQL Editor and click Run.\n');
    }
  });

  // Open browser
  console.log('🌐 Opening Supabase SQL Editor in browser...\n');
  exec(`open "https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new"`);
}

pushMigration();
