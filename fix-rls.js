#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLS() {
  console.log('🔧 Fixing creator_pages foreign key...\n');

  const sql1 = 'ALTER TABLE creator_pages DROP CONSTRAINT IF EXISTS creator_pages_user_id_fkey';
  const sql2 = 'ALTER TABLE creator_pages ADD CONSTRAINT creator_pages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';

  console.log('Running SQL...');
  console.log(sql1);
  console.log(sql2);
  
  console.log('\n⚠️  Supabase JS client cannot run DDL commands via RPC.');
  console.log('Please run this SQL manually in Supabase Dashboard:\n');
  console.log('https://supabase.com/dashboard/project/_/sql/new\n');
  console.log('Copy and paste this SQL:\n');
  console.log('----------------------------------------');
  console.log(sql1 + ';');
  console.log(sql2 + ';');
  console.log('----------------------------------------\n');
}

fixRLS();
