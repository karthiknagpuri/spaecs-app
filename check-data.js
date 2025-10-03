#!/usr/bin/env node

/**
 * Check if database has any data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('🔍 Checking database for existing data...\n');

  // Check users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username, email')
    .limit(5);

  console.log('👥 Users table:');
  if (usersError) {
    console.log(`   ❌ Error: ${usersError.message}`);
  } else {
    console.log(`   ✅ Found ${users?.length || 0} users`);
    if (users?.length > 0) {
      console.log(`   First user: ${users[0].username} (${users[0].email})`);
    }
  }

  // Check creator_pages
  const { data: profiles, error: profilesError } = await supabase
    .from('creator_pages')
    .select('id, slug, title, user_id')
    .limit(5);

  console.log('\n📄 Creator Pages table:');
  if (profilesError) {
    console.log(`   ❌ Error: ${profilesError.message}`);
  } else {
    console.log(`   ✅ Found ${profiles?.length || 0} profiles`);
    if (profiles?.length > 0) {
      profiles.forEach(p => {
        console.log(`   - /${p.slug} - "${p.title}"`);
      });
    } else {
      console.log('   ⚠️  NO PROFILES FOUND - This is why you see "NO DATA"');
    }
  }

  // Check custom_links
  const { data: links, error: linksError } = await supabase
    .from('custom_links')
    .select('id, title, url, creator_id, is_active')
    .limit(5);

  console.log('\n🔗 Custom Links table:');
  if (linksError) {
    console.log(`   ❌ Error: ${linksError.message}`);
  } else {
    console.log(`   ✅ Found ${links?.length || 0} custom links`);
    if (links?.length > 0) {
      links.forEach(l => {
        console.log(`   - ${l.title}: ${l.url} (${l.is_active ? 'active' : 'inactive'})`);
      });
    } else {
      console.log('   ⚠️  NO LINKS FOUND');
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 SOLUTION:');
  if (!profiles || profiles.length === 0) {
    console.log('You need to CREATE A PROFILE first!');
    console.log('\nSteps:');
    console.log('1. Sign up/Login to your app at http://localhost:3002');
    console.log('2. Go to Dashboard');
    console.log('3. Create your creator profile');
    console.log('4. Add custom links\n');
  } else {
    console.log('You have profiles! Check if you are logged in as the correct user.\n');
  }
}

checkData().catch(console.error);
