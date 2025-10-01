const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vnqgdftaxhflidnoksnv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZucWdkZnRheGhmbGlkbm9rc252Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE5MzUzNywiZXhwIjoyMDczNzY5NTM3fQ.gotZv-DCHcknJl0gFwRvjchetL9t3uopIODsVBGrihk';

async function fixRLSPolicies() {
  // Create a Supabase client with the service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('Fixing RLS policies for creator_pages table...\n');

    // Execute SQL statements one by one
    const statements = [
      // Enable RLS
      `ALTER TABLE creator_pages ENABLE ROW LEVEL SECURITY`,

      // Drop existing policies
      `DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON creator_pages`,
      `DROP POLICY IF EXISTS "Users can insert their own profile" ON creator_pages`,
      `DROP POLICY IF EXISTS "Users can update their own profile" ON creator_pages`,
      `DROP POLICY IF EXISTS "Users can delete their own profile" ON creator_pages`,

      // Create new policies
      `CREATE POLICY "Public profiles are viewable by everyone"
        ON creator_pages
        FOR SELECT
        USING (true)`,

      `CREATE POLICY "Users can insert their own profile"
        ON creator_pages
        FOR INSERT
        WITH CHECK (auth.uid() = user_id)`,

      `CREATE POLICY "Users can update their own profile"
        ON creator_pages
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)`,

      `CREATE POLICY "Users can delete their own profile"
        ON creator_pages
        FOR DELETE
        USING (auth.uid() = user_id)`
    ];

    for (const sql of statements) {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { query: sql });

      // Try direct execution if RPC doesn't work
      if (error) {
        // Note: Supabase JS client doesn't support direct SQL execution
        // We need to use the REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
          console.log(`Note: Statement may require dashboard execution: ${sql.substring(0, 30)}...`);
        }
      }
    }

    console.log('\n✅ RLS policies update attempted!');
    console.log('\nNote: Some DDL statements may need to be run directly in the Supabase dashboard.');
    console.log('If you still get errors, please run the SQL in the dashboard:');
    console.log('https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixRLSPolicies();