import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { CreateBlockInput } from "@/types/blocks";
import { sanitizeText } from "@/lib/validation";

// GET /api/blocks/:tab_id - List all blocks in a tab
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tab_id: string }> }
) {
  const supabase = await createClient();
  const { tab_id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify tab ownership
  const { data: tab } = await supabase
    .from("custom_tabs")
    .select("creator_id")
    .eq("id", tab_id)
    .single();

  if (!tab || tab.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: blocks, error } = await supabase
    .from("custom_blocks")
    .select("*")
    .eq("tab_id", tab_id)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ blocks });
}

// POST /api/blocks/:tab_id - Create a new block in a tab
export async function POST(
  request: Request,
  { params }: { params: Promise<{ tab_id: string }> }
) {
  const supabase = await createClient();
  const { tab_id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify tab ownership
  const { data: tab } = await supabase
    .from("custom_tabs")
    .select("creator_id")
    .eq("id", tab_id)
    .single();

  if (!tab || tab.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body: Omit<CreateBlockInput, 'tab_id'> = await request.json();

  // Validation
  if (!body.block_type || !body.config) {
    return NextResponse.json(
      { error: "Block type and config are required" },
      { status: 400 }
    );
  }

  // Sanitize config based on block type
  let sanitizedConfig = { ...body.config };

  if (body.block_type === 'announcements') {
    const config = sanitizedConfig as any;
    if (config.announcements) {
      config.announcements = config.announcements.map((ann: any) => ({
        ...ann,
        title: sanitizeText(ann.title),
        content: sanitizeText(ann.content),
      }));
    }
  } else if (body.block_type === 'links') {
    const config = sanitizedConfig as any;
    if (config.links) {
      config.links = config.links.map((link: any) => ({
        ...link,
        title: sanitizeText(link.title),
        url: link.url?.startsWith('http') ? link.url : `https://${link.url}`,
        description: link.description ? sanitizeText(link.description) : undefined,
      }));
    }
  }

  // Get next position
  const { data: existingBlocks } = await supabase
    .from("custom_blocks")
    .select("position")
    .eq("tab_id", tab_id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = existingBlocks && existingBlocks.length > 0
    ? existingBlocks[0].position + 1
    : 0;

  const { data: block, error } = await supabase
    .from("custom_blocks")
    .insert({
      tab_id,
      creator_id: user.id,
      block_type: body.block_type,
      config: sanitizedConfig,
      position: body.position ?? nextPosition,
      is_visible: body.is_visible ?? true,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('Maximum 50 blocks')) {
      return NextResponse.json(
        { error: "Maximum 50 blocks allowed per creator" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ block }, { status: 201 });
}
