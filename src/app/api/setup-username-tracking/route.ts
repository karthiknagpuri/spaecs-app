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

    // Create username_changes table
    const { error: tableError } = await supabaseAdmin.from('username_changes').select('*').limit(1);

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, create it
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.username_changes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          old_username TEXT NOT NULL,
          new_username TEXT NOT NULL,
          changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_username_changes_user_id ON public.username_changes(user_id);
        CREATE INDEX IF NOT EXISTS idx_username_changes_changed_at ON public.username_changes(changed_at DESC);

        -- Enable RLS
        ALTER TABLE public.username_changes ENABLE ROW LEVEL SECURITY;

        -- Create policies
        CREATE POLICY "Users can view their own username history" ON public.username_changes
          FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Service role can insert username changes" ON public.username_changes
          FOR INSERT WITH CHECK (true);
      `;

      // Note: Since we can't execute raw SQL directly, you'll need to run this in Supabase Dashboard
      return NextResponse.json({
        message: "Username tracking table needs to be created",
        sql: createTableQuery,
        instructions: "Please run the following SQL in your Supabase Dashboard SQL Editor"
      });
    }

    return NextResponse.json({
      message: "Username tracking is ready",
      tableExists: !tableError || tableError.code !== '42P01'
    });

  } catch (error: any) {
    console.error('Username tracking setup error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}