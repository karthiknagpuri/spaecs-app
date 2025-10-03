import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { UpdateTabInput } from "@/types/blocks";

// PATCH /api/blocks/tabs/:id - Update a tab
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

  const body: Partial<UpdateTabInput> = await request.json();

  // Verify ownership
  const { data: existingTab } = await supabase
    .from("custom_tabs")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (!existingTab || existingTab.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Build update object
  const updates: any = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.slug !== undefined) {
    updates.slug = body.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.position !== undefined) updates.position = body.position;
  if (body.is_visible !== undefined) updates.is_visible = body.is_visible;

  const { data: tab, error } = await supabase
    .from("custom_tabs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tab });
}

// DELETE /api/blocks/tabs/:id - Delete a tab
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
  const { data: existingTab } = await supabase
    .from("custom_tabs")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (!existingTab || existingTab.creator_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("custom_tabs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
