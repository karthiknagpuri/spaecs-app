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

    // Create the avatars bucket
    const { data: bucket, error: bucketError } = await supabaseAdmin.storage
      .createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('Bucket creation error:', bucketError);
      return NextResponse.json(
        { error: `Failed to create bucket: ${bucketError.message}` },
        { status: 500 }
      );
    }

    // Note: RLS policies need to be set up manually in Supabase Dashboard
    // Go to Storage > Policies and add the following policies:

    const policyInstructions = [
      {
        name: 'Avatar images are publicly accessible',
        policy: 'FOR SELECT USING (bucket_id = \'avatars\')',
        target: 'objects',
        operation: 'SELECT'
      },
      {
        name: 'Users can upload avatar images',
        policy: 'FOR INSERT WITH CHECK (bucket_id = \'avatars\' AND auth.role() = \'authenticated\')',
        target: 'objects',
        operation: 'INSERT'
      },
      {
        name: 'Users can update their own avatar images',
        policy: 'FOR UPDATE USING (bucket_id = \'avatars\' AND auth.uid()::text = (storage.foldername(name))[1])',
        target: 'objects',
        operation: 'UPDATE'
      },
      {
        name: 'Users can delete their own avatar images',
        policy: 'FOR DELETE USING (bucket_id = \'avatars\' AND auth.uid()::text = (storage.foldername(name))[1])',
        target: 'objects',
        operation: 'DELETE'
      }
    ];

    const policyResults = policyInstructions;

    return NextResponse.json({
      message: "Storage setup completed",
      bucket: bucket || { name: 'avatars', status: 'already exists' },
      policies: policyResults
    });

  } catch (error: any) {
    console.error('Storage setup error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}