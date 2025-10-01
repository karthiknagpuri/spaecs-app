import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test if we can access the creator_pages table
    const { data: existingPolicies, error: policiesError } = await supabaseAdmin
      .from('creator_pages')
      .select('*')
      .limit(1);

    console.log('Existing policies check:', { existingPolicies, policiesError });

    // Since we can't execute DDL through the JS client, we need to ensure
    // the table at least allows operations with the service role key

    // Let's test if we can insert with the service role (bypasses RLS)
    const testData = {
      user_id: 'test-user-id-' + Date.now(),
      slug: 'test-slug-' + Date.now(),
      title: 'Test Title',
      description: 'Test Description',
      social_links: {},
      tier_configs: []
    };

    const { data: insertTest, error: insertError } = await supabaseAdmin
      .from('creator_pages')
      .insert(testData)
      .select()
      .single();

    if (insertTest) {
      // Clean up test data
      await supabaseAdmin
        .from('creator_pages')
        .delete()
        .eq('id', insertTest.id);

      return NextResponse.json({
        success: true,
        message: 'Service role key can bypass RLS. The issue is with the RLS policies.',
        solution: 'Please run the SQL in Supabase dashboard to fix the policies.',
        sqlUrl: 'https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new'
      });
    }

    return NextResponse.json({
      success: false,
      error: insertError,
      message: 'Unable to insert even with service role key.',
      solution: 'Please check the table structure in Supabase dashboard.'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      note: 'DDL statements (ALTER TABLE, CREATE POLICY) must be run in the Supabase SQL editor.',
      sqlUrl: 'https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new'
    });
  }
}