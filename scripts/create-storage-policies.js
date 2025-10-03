const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createStoragePolicies() {
  console.log('Creating storage policies...\n');

  const policies = [
    `
    CREATE POLICY IF NOT EXISTS "Users can upload their own images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile-images'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
    `,
    `
    CREATE POLICY IF NOT EXISTS "Users can update their own images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING ((storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);
    `,
    `
    CREATE POLICY IF NOT EXISTS "Users can delete their own images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING ((storage.foldername(name))[1] = auth.uid()::text);
    `
  ];

  for (let i = 0; i < policies.length; i++) {
    console.log(`Creating policy ${i + 1}/${policies.length}...`);

    try {
      const response = await fetch(
        `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: policies[i] })
        }
      );

      if (response.ok) {
        console.log(`✅ Policy ${i + 1} created successfully`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Error creating policy ${i + 1}:`, errorText);
      }
    } catch (err) {
      console.error(`❌ Error creating policy ${i + 1}:`, err.message);
    }
  }

  console.log('\n✅ Storage policies setup complete!');
  console.log('You can now upload images to your profile.');
}

createStoragePolicies().catch(console.error);
