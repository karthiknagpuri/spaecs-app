import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Execute SQL policies directly
    const policies = [
      `
        DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
        CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
      `,
      `
        DROP POLICY IF EXISTS "Users can upload avatar images" ON storage.objects;
        CREATE POLICY "Users can upload avatar images" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
      `,
      `
        DROP POLICY IF EXISTS "Users can update their own avatar images" ON storage.objects;
        CREATE POLICY "Users can update their own avatar images" ON storage.objects
        FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
      `,
      `
        DROP POLICY IF EXISTS "Users can delete their own avatar images" ON storage.objects;
        CREATE POLICY "Users can delete their own avatar images" ON storage.objects
        FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
      `
    ];

    const results = [];

    for (let i = 0; i < policies.length; i++) {
      try {
        // Use the postgres connection directly
        const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('execute_sql', {
          query: policies[i]
        });

        results.push({
          policy: i + 1,
          success: !sqlError,
          error: sqlError?.message
        });
      } catch (error: any) {
        results.push({
          policy: i + 1,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      message: "Storage policies setup attempted",
      results,
      note: "If this fails, please run the SQL commands manually in Supabase Dashboard > SQL Editor"
    });

  } catch (error: any) {
    console.error('Storage policies setup error:', error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        sql_commands: [
          "DROP POLICY IF EXISTS \"Avatar images are publicly accessible\" ON storage.objects;",
          "CREATE POLICY \"Avatar images are publicly accessible\" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');",
          "",
          "DROP POLICY IF EXISTS \"Users can upload avatar images\" ON storage.objects;",
          "CREATE POLICY \"Users can upload avatar images\" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');",
          "",
          "DROP POLICY IF EXISTS \"Users can update their own avatar images\" ON storage.objects;",
          "CREATE POLICY \"Users can update their own avatar images\" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);",
          "",
          "DROP POLICY IF EXISTS \"Users can delete their own avatar images\" ON storage.objects;",
          "CREATE POLICY \"Users can delete their own avatar images\" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);"
        ]
      },
      { status: 500 }
    );
  }
}