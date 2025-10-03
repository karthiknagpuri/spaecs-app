import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { CreateTabInput } from "@/types/blocks";

// GET /api/blocks/tabs - List all tabs for authenticated user
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tabs, error } = await supabase
    .from("custom_tabs")
    .select("*")
    .eq("creator_id", user.id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tabs });
}

// POST /api/blocks/tabs - Create a new tab
export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: CreateTabInput = await request.json();

  // Validation
  if (!body.title || !body.slug) {
    return NextResponse.json(
      { error: "Title and slug are required" },
      { status: 400 }
    );
  }

  // Sanitize slug
  const slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Get next position
  const { data: existingTabs } = await supabase
    .from("custom_tabs")
    .select("position")
    .eq("creator_id", user.id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingTabs && existingTabs.length > 0
    ? existingTabs[0].position + 1
    : 0;

  const { data: tab, error } = await supabase
    .from("custom_tabs")
    .insert({
      creator_id: user.id,
      title: body.title,
      slug,
      icon: body.icon || null,
      position: body.position ?? nextPosition,
      is_visible: body.is_visible ?? true,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('Maximum 10 tabs')) {
      return NextResponse.json(
        { error: "Maximum 10 tabs allowed per creator" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tab }, { status: 201 });
}
