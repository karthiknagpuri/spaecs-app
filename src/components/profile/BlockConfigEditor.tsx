"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Save,
  Plus,
  Trash2,
  Check,
  Link as LinkIcon,
  Megaphone,
  Calendar,
  Mail,
  FileText,
  Code,
  Target,
} from "lucide-react";
import {
  CustomBlock,
  BlockConfig,
  BLOCK_TYPES,
  ReachGoalConfig,
  LinksConfig,
  AnnouncementsConfig,
  Book1on1Config,
  NewsletterConfig,
  TextConfig,
  EmbedConfig,
  Link,
  Announcement,
} from "@/types/blocks";

interface BlockConfigEditorProps {
  block: CustomBlock;
  onClose: () => void;
  onSave: (config: BlockConfig) => void;
}

export default function BlockConfigEditor({
  block,
  onClose,
  onSave,
}: BlockConfigEditorProps) {
  const [config, setConfig] = useState<BlockConfig>(block.config);
  const blockMeta = BLOCK_TYPES[block.block_type];

  const handleSave = () => {
    onSave(config);
  };

  const renderEditor = () => {
    switch (block.block_type) {
      case "reach_goal":
        return <ReachGoalEditor config={config as ReachGoalConfig} setConfig={setConfig} />;
      case "links":
        return <LinksEditor config={config as LinksConfig} setConfig={setConfig} />;
      case "announcements":
        return <AnnouncementsEditor config={config as AnnouncementsConfig} setConfig={setConfig} />;
      case "book_1on1":
        return <Book1on1Editor config={config as Book1on1Config} setConfig={setConfig} />;
      case "newsletter":
        return <NewsletterEditor config={config as NewsletterConfig} setConfig={setConfig} />;
      case "text":
        return <TextEditor config={config as TextConfig} setConfig={setConfig} />;
      case "embed":
        return <EmbedEditor config={config as EmbedConfig} setConfig={setConfig} />;
      default:
        return <div>Unsupported block type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg">
              {block.block_type === "reach_goal" && <Target className="h-5 w-5 text-gray-900 dark:text-white" />}
              {block.block_type === "links" && <LinkIcon className="h-5 w-5 text-gray-900 dark:text-white" />}
              {block.block_type === "announcements" && <Megaphone className="h-5 w-5 text-gray-900 dark:text-white" />}
              {block.block_type === "book_1on1" && <Calendar className="h-5 w-5 text-gray-900 dark:text-white" />}
              {block.block_type === "newsletter" && <Mail className="h-5 w-5 text-gray-900 dark:text-white" />}
              {block.block_type === "text" && <FileText className="h-5 w-5 text-gray-900 dark:text-white" />}
              {block.block_type === "embed" && <Code className="h-5 w-5 text-gray-900 dark:text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit {blockMeta.label}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {blockMeta.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderEditor()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Reach Goal Editor
function ReachGoalEditor({
  config,
  setConfig,
}: {
  config: ReachGoalConfig;
  setConfig: (config: BlockConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Goal Amount
        </label>
        <input
          type="number"
          value={config.goal}
          onChange={(e) => setConfig({ ...config, goal: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Amount
        </label>
        <input
          type="number"
          value={config.current}
          onChange={(e) => setConfig({ ...config, current: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
          min="0"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={config.description}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.show_progress_bar}
            onChange={(e) => setConfig({ ...config, show_progress_bar: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-neutral-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Progress Bar</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.show_percentage}
            onChange={(e) => setConfig({ ...config, show_percentage: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 dark:border-neutral-700"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show Percentage</span>
        </label>
      </div>
    </div>
  );
}

// Links Editor
function LinksEditor({
  config,
  setConfig,
}: {
  config: LinksConfig;
  setConfig: (config: BlockConfig) => void;
}) {
  const addLink = () => {
    setConfig({
      ...config,
      links: [...config.links, { title: "", url: "", icon: "", description: "" }],
    });
  };

  const removeLink = (index: number) => {
    setConfig({
      ...config,
      links: config.links.filter((_, i) => i !== index),
    });
  };

  const updateLink = (index: number, updates: Partial<Link>) => {
    const newLinks = [...config.links];
    newLinks[index] = { ...newLinks[index], ...updates };
    setConfig({ ...config, links: newLinks });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Layout
        </label>
        <select
          value={config.layout}
          onChange={(e) => setConfig({ ...config, layout: e.target.value as "list" | "grid" })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
        >
          <option value="list">List</option>
          <option value="grid">Grid</option>
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Links
          </label>
          <button
            onClick={addLink}
            className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Link
          </button>
        </div>

        <div className="space-y-3">
          {config.links.map((link, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateLink(index, { title: e.target.value })}
                    placeholder="Link Title"
                    className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Icon/Emoji
                  </label>
                  <input
                    type="text"
                    value={link.icon}
                    onChange={(e) => updateLink(index, { icon: e.target.value })}
                    placeholder="🔗"
                    maxLength={2}
                    className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  URL
                </label>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateLink(index, { url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={link.description}
                  onChange={(e) => updateLink(index, { description: e.target.value })}
                  placeholder="Link description"
                  className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded text-sm"
                />
              </div>

              <button
                onClick={() => removeLink(index)}
                className="w-full px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Link
              </button>
            </div>
          ))}

          {config.links.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No links added yet. Click "Add Link" to create one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Announcements Editor
function AnnouncementsEditor({
  config,
  setConfig,
}: {
  config: AnnouncementsConfig;
  setConfig: (config: BlockConfig) => void;
}) {
  const addAnnouncement = () => {
    setConfig({
      ...config,
      announcements: [
        ...config.announcements,
        {
          title: "",
          content: "",
          date: new Date().toISOString(),
          pinned: false,
        },
      ],
    });
  };

  const removeAnnouncement = (index: number) => {
    setConfig({
      ...config,
      announcements: config.announcements.filter((_, i) => i !== index),
    });
  };

  const updateAnnouncement = (index: number, updates: Partial<Announcement>) => {
    const newAnnouncements = [...config.announcements];
    newAnnouncements[index] = { ...newAnnouncements[index], ...updates };
    setConfig({ ...config, announcements: newAnnouncements });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Maximum Displayed
        </label>
        <input
          type="number"
          value={config.max_display}
          onChange={(e) => setConfig({ ...config, max_display: parseInt(e.target.value) || 5 })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
          min="1"
          max="20"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Announcements
          </label>
          <button
            onClick={addAnnouncement}
            className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Announcement
          </button>
        </div>

        <div className="space-y-3">
          {config.announcements.map((announcement, index) => (
            <div key={index} className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={announcement.title}
                  onChange={(e) => updateAnnouncement(index, { title: e.target.value })}
                  placeholder="Announcement title"
                  className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Content
                </label>
                <textarea
                  value={announcement.content}
                  onChange={(e) => updateAnnouncement(index, { content: e.target.value })}
                  placeholder="Announcement content"
                  className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded text-sm resize-none"
                  rows={3}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.pinned}
                  onChange={(e) => updateAnnouncement(index, { pinned: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 dark:border-neutral-700"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Pin to top</span>
              </label>

              <button
                onClick={() => removeAnnouncement(index)}
                className="w-full px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs rounded hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Announcement
              </button>
            </div>
          ))}

          {config.announcements.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No announcements added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Book 1:1 Editor
function Book1on1Editor({
  config,
  setConfig,
}: {
  config: Book1on1Config;
  setConfig: (config: BlockConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={config.duration}
            onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) || 30 })}
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
            min="15"
            step="15"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price
          </label>
          <input
            type="number"
            value={config.price}
            onChange={(e) => setConfig({ ...config, price: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Currency
        </label>
        <select
          value={config.currency}
          onChange={(e) => setConfig({ ...config, currency: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
        >
          <option value="INR">INR (₹)</option>
          <option value="USD">USD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Calendly URL (optional)
        </label>
        <input
          type="url"
          value={config.calendly_url || ""}
          onChange={(e) => setConfig({ ...config, calendly_url: e.target.value })}
          placeholder="https://calendly.com/your-link"
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={config.description}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}

// Newsletter Editor
function NewsletterEditor({
  config,
  setConfig,
}: {
  config: NewsletterConfig;
  setConfig: (config: BlockConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Service
        </label>
        <select
          value={config.service}
          onChange={(e) => setConfig({ ...config, service: e.target.value as any })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
        >
          <option value="custom">Custom</option>
          <option value="mailchimp">Mailchimp</option>
          <option value="substack">Substack</option>
          <option value="convertkit">ConvertKit</option>
          <option value="buttondown">Buttondown</option>
        </select>
      </div>

      {config.service === "custom" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Embed Code
          </label>
          <textarea
            value={config.embed_code}
            onChange={(e) => setConfig({ ...config, embed_code: e.target.value })}
            placeholder="Paste your newsletter subscription form embed code here"
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm resize-none font-mono text-xs"
            rows={6}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          value={config.description}
          onChange={(e) => setConfig({ ...config, description: e.target.value })}
          placeholder="Subscribe to get updates"
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Placeholder Text
          </label>
          <input
            type="text"
            value={config.placeholder}
            onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
            placeholder="Enter your email"
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Button Text
          </label>
          <input
            type="text"
            value={config.button_text}
            onChange={(e) => setConfig({ ...config, button_text: e.target.value })}
            placeholder="Subscribe"
            className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Success Message
        </label>
        <input
          type="text"
          value={config.success_message}
          onChange={(e) => setConfig({ ...config, success_message: e.target.value })}
          placeholder="Thanks for subscribing!"
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
        />
      </div>
    </div>
  );
}

// Text Editor
function TextEditor({
  config,
  setConfig,
}: {
  config: TextConfig;
  setConfig: (config: BlockConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content
        </label>
        <textarea
          value={config.content}
          onChange={(e) => setConfig({ ...config, content: e.target.value })}
          placeholder="Enter your text content here..."
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm resize-none"
          rows={8}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Alignment
        </label>
        <select
          value={config.alignment}
          onChange={(e) => setConfig({ ...config, alignment: e.target.value as any })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={config.markdown}
          onChange={(e) => setConfig({ ...config, markdown: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 dark:border-neutral-700"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Enable Markdown</span>
      </label>
    </div>
  );
}

// Embed Editor
function EmbedEditor({
  config,
  setConfig,
}: {
  config: EmbedConfig;
  setConfig: (config: BlockConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Embed Code
        </label>
        <textarea
          value={config.embed_code}
          onChange={(e) => setConfig({ ...config, embed_code: e.target.value })}
          placeholder="Paste your embed code here (iframe, script, etc.)"
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm resize-none font-mono text-xs"
          rows={8}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Height (pixels)
        </label>
        <input
          type="number"
          value={config.height}
          onChange={(e) => setConfig({ ...config, height: parseInt(e.target.value) || 400 })}
          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-sm"
          min="100"
          step="50"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={config.allow_fullscreen}
          onChange={(e) => setConfig({ ...config, allow_fullscreen: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 dark:border-neutral-700"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Allow Fullscreen</span>
      </label>
    </div>
  );
}
