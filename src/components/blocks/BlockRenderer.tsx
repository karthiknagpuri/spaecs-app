"use client";

import { CustomBlock } from "@/types/blocks";
import { ReachGoalBlock } from "./ReachGoalBlock";
import { LinksBlock } from "./LinksBlock";
import { AnnouncementsBlock } from "./AnnouncementsBlock";
import { Book1on1Block } from "./Book1on1Block";
import { NewsletterBlock } from "./NewsletterBlock";

interface BlockRendererProps {
  block: CustomBlock;
  onBook?: () => void;
  onSubscribe?: (email: string) => Promise<void>;
}

export function BlockRenderer({ block, onBook, onSubscribe }: BlockRendererProps) {
  if (!block.is_visible) {
    return null;
  }

  switch (block.block_type) {
    case 'reach_goal':
      return <ReachGoalBlock config={block.config as any} />;

    case 'links':
      return <LinksBlock config={block.config as any} />;

    case 'announcements':
      return <AnnouncementsBlock config={block.config as any} />;

    case 'book_1on1':
      return <Book1on1Block config={block.config as any} onBook={onBook} />;

    case 'newsletter':
      return <NewsletterBlock config={block.config as any} onSubscribe={onSubscribe} />;

    case 'text':
      // TODO: Implement text block with markdown support
      return null;

    case 'embed':
      // TODO: Implement embed block
      return null;

    default:
      return null;
  }
}
