"use client";

import { CustomBlock, BLOCK_TYPES, BlockConfig } from "@/types/blocks";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { ExternalLink, Check, Target } from "lucide-react";

interface PublicBlockRendererProps {
  block: CustomBlock;
}

export default function PublicBlockRenderer({ block }: PublicBlockRendererProps) {
  const blockMeta = BLOCK_TYPES[block.block_type];

  switch (block.block_type) {
    case "reach_goal":
      return <ReachGoalBlock config={block.config as any} />;
    case "links":
      return <LinksBlock config={block.config as any} />;
    case "announcements":
      return <AnnouncementsBlock config={block.config as any} />;
    case "book_1on1":
      return <Book1on1Block config={block.config as any} />;
    case "newsletter":
      return <NewsletterBlock config={block.config as any} />;
    case "text":
      return <TextBlock config={block.config as any} />;
    case "embed":
      return <EmbedBlock config={block.config as any} />;
    default:
      return null;
  }
}

// Reach Goal Block
function ReachGoalBlock({ config }: { config: any }) {
  const percentage = Math.min((config.current / config.goal) * 100, 100);

  return (
    <div className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-gray-900 dark:text-white" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Goal Progress
        </h3>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {config.description}
      </p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">
            {config.current} / {config.goal}
          </span>
          {config.show_percentage && (
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>

        {config.show_progress_bar && (
          <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gray-900 dark:bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Links Block
function LinksBlock({ config }: { config: any }) {
  if (!config.links || config.links.length === 0) return null;

  return (
    <div className="space-y-2">
      {config.links.map((link: any, index: number) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl hover:border-gray-900 dark:hover:border-white transition-all group"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {link.icon && <span className="text-xl flex-shrink-0">{link.icon}</span>}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {link.title}
              </div>
              {link.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {link.description}
                </div>
              )}
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

// Announcements Block
function AnnouncementsBlock({ config }: { config: any }) {
  if (!config.announcements || config.announcements.length === 0) return null;

  const displayAnnouncements = config.announcements
    .sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, config.max_display || 5);

  return (
    <div className="space-y-3">
      {displayAnnouncements.map((announcement: any, index: number) => (
        <div
          key={index}
          className="p-4 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {announcement.title}
            </h4>
            {announcement.pinned && (
              <span className="px-2 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-full font-medium flex-shrink-0">
                Pinned
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {announcement.content}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {new Date(announcement.date).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

// Book 1:1 Block
function Book1on1Block({ config }: { config: any }) {
  const currencySymbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };

  const handleBooking = () => {
    if (config.calendly_url) {
      window.open(config.calendly_url, "_blank");
    }
  };

  return (
    <div className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        Book a 1:1 Session
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {config.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Duration</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {config.duration} minutes
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {currencySymbols[config.currency || "INR"] || ""}
            {config.price}
          </div>
        </div>
      </div>

      {config.calendly_url && (
        <button
          onClick={handleBooking}
          className="w-full px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm"
        >
          Book Now
        </button>
      )}
    </div>
  );
}

// Newsletter Block
function NewsletterBlock({ config }: { config: any }) {
  return (
    <div className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        Newsletter
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {config.description}
      </p>

      {config.service === "custom" && config.embed_code ? (
        <div dangerouslySetInnerHTML={{ __html: config.embed_code }} />
      ) : (
        <form className="flex gap-2">
          <input
            type="email"
            placeholder={config.placeholder || "Enter your email"}
            className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
          >
            {config.button_text || "Subscribe"}
          </button>
        </form>
      )}
    </div>
  );
}

// Text Block
function TextBlock({ config }: { config: any }) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className="p-5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl">
      <div
        className={`text-sm text-gray-900 dark:text-white whitespace-pre-wrap ${
          alignmentClasses[config.alignment as keyof typeof alignmentClasses] || alignmentClasses.left
        }`}
      >
        {config.content}
      </div>
    </div>
  );
}

// Embed Block
function EmbedBlock({ config }: { config: any }) {
  return (
    <div
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden"
      style={{ height: `${config.height || 400}px` }}
    >
      <div dangerouslySetInnerHTML={{ __html: config.embed_code }} className="h-full w-full" />
    </div>
  );
}
