import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sanitizeText } from "@/lib/validation";

// PATCH /api/blocks/blocks/:id - Update a block
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existingBlock } = await supabase
    .from("custom_blocks")
    .select("creator_id, block_type")
    .eq("id", id)
    .single();

  if (!existingBlock || existingBlock.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body: any = await request.json();

  // Build update object
  const updates: any = {};
  if (body.position !== undefined) updates.position = body.position;
  if (body.is_visible !== undefined) updates.is_visible = body.is_visible;

  // Sanitize config if provided
  if (body.config) {
    let sanitizedConfig = { ...body.config };

    if (existingBlock.block_type === 'announcements') {
      const config = sanitizedConfig as any;
      if (config.announcements) {
        config.announcements = config.announcements.map((ann: any) => ({
          ...ann,
          title: sanitizeText(ann.title),
          content: sanitizeText(ann.content),
        }));
      }
    } else if (existingBlock.block_type === 'links') {
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

    updates.config = sanitizedConfig;
  }

  const { data: block, error } = await supabase
    .from("custom_blocks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ block });
}

// DELETE /api/blocks/blocks/:id - Delete a block
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existingBlock } = await supabase
    .from("custom_blocks")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (!existingBlock || existingBlock.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("custom_blocks")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
