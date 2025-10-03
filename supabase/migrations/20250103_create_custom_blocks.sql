-- Custom Blocks System Migration
-- Allows creators to add custom tabs and blocks to their profile

-- Create custom_tabs table
CREATE TABLE IF NOT EXISTS public.custom_tabs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  icon TEXT, -- lucide icon name
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_creator_tab_slug UNIQUE (creator_id, slug)
);

-- Create custom_blocks table
CREATE TABLE IF NOT EXISTS public.custom_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tab_id UUID NOT NULL REFERENCES public.custom_tabs(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Block type: 'reach_goal', 'links', 'announcements', 'book_1on1', 'newsletter', 'text', 'embed'
  block_type TEXT NOT NULL,

  -- Block position within tab
  position INTEGER NOT NULL DEFAULT 0,

  -- Visibility
  is_visible BOOLEAN DEFAULT true,

  -- Block configuration (JSON)
  config JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_block_type CHECK (
    block_type IN (
      'reach_goal',
      'links',
      'announcements',
      'book_1on1',
      'newsletter',
      'text',
      'embed'
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_tabs_creator ON public.custom_tabs(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_tabs_position ON public.custom_tabs(creator_id, position);
CREATE INDEX IF NOT EXISTS idx_custom_tabs_creator_visible ON public.custom_tabs(creator_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_custom_blocks_tab ON public.custom_blocks(tab_id);
CREATE INDEX IF NOT EXISTS idx_custom_blocks_creator ON public.custom_blocks(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_blocks_position ON public.custom_blocks(tab_id, position);
CREATE INDEX IF NOT EXISTS idx_custom_blocks_tab_visible ON public.custom_blocks(tab_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_custom_blocks_config_gin ON public.custom_blocks USING GIN (config);

-- Enable RLS
ALTER TABLE public.custom_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_tabs
-- Public can view visible tabs
CREATE POLICY "Public can view visible tabs"
  ON public.custom_tabs FOR SELECT
  USING (is_visible = true);

-- Creators can manage their own tabs
CREATE POLICY "Creators can manage own tabs"
  ON public.custom_tabs FOR ALL
  USING (auth.uid() = creator_id);

-- RLS Policies for custom_blocks
-- Public can view visible blocks in visible tabs
CREATE POLICY "Public can view visible blocks"
  ON public.custom_blocks FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM public.custom_tabs
      WHERE custom_tabs.id = custom_blocks.tab_id
      AND custom_tabs.is_visible = true
    )
  );

-- Creators can manage their own blocks
CREATE POLICY "Creators can manage own blocks"
  ON public.custom_blocks FOR ALL
  USING (auth.uid() = creator_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_custom_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to enforce tab limits (max 10 tabs per creator)
CREATE OR REPLACE FUNCTION check_tab_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.custom_tabs WHERE creator_id = NEW.creator_id) >= 10 THEN
    RAISE EXCEPTION 'Maximum 10 tabs allowed per creator';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to enforce block limits (max 50 blocks per creator)
CREATE OR REPLACE FUNCTION check_block_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.custom_blocks WHERE creator_id = NEW.creator_id) >= 50 THEN
    RAISE EXCEPTION 'Maximum 50 blocks allowed per creator';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_custom_tabs_updated_at
  BEFORE UPDATE ON public.custom_tabs
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_blocks_updated_at();

CREATE TRIGGER update_custom_blocks_updated_at
  BEFORE UPDATE ON public.custom_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_blocks_updated_at();

-- Add triggers for limits
CREATE TRIGGER enforce_tab_limit
  BEFORE INSERT ON public.custom_tabs
  FOR EACH ROW
  EXECUTE FUNCTION check_tab_limit();

CREATE TRIGGER enforce_block_limit
  BEFORE INSERT ON public.custom_blocks
  FOR EACH ROW
  EXECUTE FUNCTION check_block_limit();

-- Add comments for documentation
COMMENT ON TABLE public.custom_tabs IS 'Custom tabs that creators can add to their profile';
COMMENT ON TABLE public.custom_blocks IS 'Custom blocks (reach goal, links, etc.) within tabs';
COMMENT ON COLUMN public.custom_blocks.config IS 'JSON configuration for each block type:
- reach_goal: { "goal": number, "current": number, "description": string, "show_progress_bar": boolean, "show_percentage": boolean }
- links: { "links": [{ "title": string, "url": string, "icon": string, "description": string }], "layout": "list"|"grid" }
- announcements: { "announcements": [{ "title": string, "content": string, "date": string, "pinned": boolean }], "max_display": number }
- book_1on1: { "duration": number, "price": number, "currency": string, "calendly_url": string, "description": string }
- newsletter: { "service": "custom"|"mailchimp"|"substack"|"convertkit", "embed_code": string, "description": string, "button_text": string }
- text: { "content": string, "markdown": boolean, "alignment": "left"|"center"|"right" }
- embed: { "embed_code": string, "height": number, "allow_fullscreen": boolean }';
