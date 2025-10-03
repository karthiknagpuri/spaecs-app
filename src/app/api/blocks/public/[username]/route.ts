import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/blocks/public/:username - Get public tabs and blocks for a creator
export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const supabase = await createClient();
  const { username } = await params;

  // Get creator by username
  const { data: creator } = await supabase
    .from("creator_pages")
    .select("user_id")
    .eq("slug", username)
    .single();

  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  // Get visible tabs
  const { data: tabs, error: tabsError } = await supabase
    .from("custom_tabs")
    .select("*")
    .eq("creator_id", creator.user_id)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  if (tabsError) {
    return NextResponse.json({ error: tabsError.message }, { status: 500 });
  }

  if (!tabs || tabs.length === 0) {
    return NextResponse.json({ tabs: [], blocks: {} });
  }

  // Get visible blocks for all tabs
  const tabIds = tabs.map((t) => t.id);

  const { data: blocks, error: blocksError } = await supabase
    .from("custom_blocks")
    .select("*")
    .in("tab_id", tabIds)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  // Group blocks by tab_id
  const blocksByTab: Record<string, any[]> = {};
  (blocks || []).forEach((block) => {
    if (!blocksByTab[block.tab_id]) {
      blocksByTab[block.tab_id] = [];
    }
    blocksByTab[block.tab_id].push(block);
  });

  return NextResponse.json({ tabs, blocks: blocksByTab });
}
