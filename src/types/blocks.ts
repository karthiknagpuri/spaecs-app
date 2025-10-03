// Custom Blocks System Types

export type BlockType =
  | 'reach_goal'
  | 'links'
  | 'announcements'
  | 'book_1on1'
  | 'newsletter'
  | 'text'
  | 'embed';

// Block Configuration Types
export interface ReachGoalConfig {
  goal: number;
  current: number;
  description: string;
  show_progress_bar?: boolean;
  show_percentage?: boolean;
}

export interface Link {
  id?: string;
  title: string;
  url: string;
  icon?: string;
  description?: string;
}

export interface LinksConfig {
  links: Link[];
  layout?: 'list' | 'grid';
}

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  date: string;
  pinned?: boolean;
}

export interface AnnouncementsConfig {
  announcements: Announcement[];
  max_display?: number;
}

export interface Book1on1Config {
  duration: number; // in minutes
  price: number;
  currency?: string;
  calendly_url?: string;
  description?: string;
  available_slots?: string[];
}

export interface NewsletterConfig {
  service: 'custom' | 'mailchimp' | 'substack' | 'convertkit' | 'buttondown';
  embed_code?: string;
  description?: string;
  placeholder?: string;
  button_text?: string;
  success_message?: string;
}

export interface TextConfig {
  content: string;
  markdown?: boolean;
  alignment?: 'left' | 'center' | 'right';
}

export interface EmbedConfig {
  embed_code: string;
  height?: number;
  allow_fullscreen?: boolean;
}

export type BlockConfig =
  | ReachGoalConfig
  | LinksConfig
  | AnnouncementsConfig
  | Book1on1Config
  | NewsletterConfig
  | TextConfig
  | EmbedConfig;

// Database Types
export interface CustomTab {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  icon?: string;
  position: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomBlock {
  id: string;
  tab_id: string;
  creator_id: string;
  block_type: BlockType;
  position: number;
  is_visible: boolean;
  config: BlockConfig;
  created_at: string;
  updated_at: string;
}

// Frontend Types
export interface CustomTabWithBlocks extends CustomTab {
  blocks: CustomBlock[];
}

// Form Types for creating/editing
export interface CreateTabInput {
  title: string;
  slug: string;
  icon?: string;
  position?: number;
  is_visible?: boolean;
}

export interface CreateBlockInput {
  tab_id: string;
  block_type: BlockType;
  position?: number;
  is_visible?: boolean;
  config: BlockConfig;
}

export interface UpdateTabInput extends Partial<CreateTabInput> {
  id: string;
}

export interface UpdateBlockInput extends Partial<CreateBlockInput> {
  id: string;
}

// Block metadata for UI
export interface BlockMetadata {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  defaultConfig: BlockConfig;
}

export const BLOCK_TYPES: Record<BlockType, BlockMetadata> = {
  reach_goal: {
    type: 'reach_goal',
    label: 'Reach Goal',
    description: 'Show your progress towards a supporter goal',
    icon: 'Target',
    defaultConfig: {
      goal: 100,
      current: 0,
      description: 'Help me reach my goal!',
      show_progress_bar: true,
      show_percentage: true,
    } as ReachGoalConfig,
  },
  links: {
    type: 'links',
    label: 'Links',
    description: 'Display a list of custom links',
    icon: 'Link',
    defaultConfig: {
      links: [],
      layout: 'list',
    } as LinksConfig,
  },
  announcements: {
    type: 'announcements',
    label: 'Announcements',
    description: 'Share updates and announcements',
    icon: 'Megaphone',
    defaultConfig: {
      announcements: [],
      max_display: 5,
    } as AnnouncementsConfig,
  },
  book_1on1: {
    type: 'book_1on1',
    label: 'Book 1:1',
    description: 'Allow supporters to book 1-on-1 sessions',
    icon: 'Calendar',
    defaultConfig: {
      duration: 30,
      price: 0,
      currency: 'INR',
      description: 'Book a 1-on-1 session with me',
    } as Book1on1Config,
  },
  newsletter: {
    type: 'newsletter',
    label: 'Newsletter',
    description: 'Newsletter subscription form',
    icon: 'Mail',
    defaultConfig: {
      service: 'custom',
      description: 'Subscribe to my newsletter',
      placeholder: 'Enter your email',
      button_text: 'Subscribe',
      success_message: 'Thanks for subscribing!',
    } as NewsletterConfig,
  },
  text: {
    type: 'text',
    label: 'Text Block',
    description: 'Add custom text content',
    icon: 'FileText',
    defaultConfig: {
      content: '',
      markdown: true,
      alignment: 'left',
    } as TextConfig,
  },
  embed: {
    type: 'embed',
    label: 'Embed',
    description: 'Embed external content',
    icon: 'Code',
    defaultConfig: {
      embed_code: '',
      height: 400,
      allow_fullscreen: true,
    } as EmbedConfig,
  },
};
