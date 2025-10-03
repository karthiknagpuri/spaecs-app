"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CustomTab, CustomBlock, BLOCK_TYPES, BlockType } from "@/types/blocks";
import { createClient } from "@/lib/supabase/client";
import * as Icons from "lucide-react";

export default function BlocksPage() {
  const [tabs, setTabs] = useState<CustomTab[]>([]);
  const [blocks, setBlocks] = useState<Record<string, CustomBlock[]>>({});
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showNewTabDialog, setShowNewTabDialog] = useState(false);
  const [showNewBlockDialog, setShowNewBlockDialog] = useState<string | null>(null);
  const [newTabTitle, setNewTabTitle] = useState("");
  const [newTabIcon, setNewTabIcon] = useState("");
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadTabs();
  }, []);

  const loadTabs = async () => {
    setLoading(true);
    const res = await fetch("/api/blocks/tabs");
    if (res.ok) {
      const data = await res.json();
      setTabs(data.tabs || []);

      // Load blocks for each tab
      for (const tab of data.tabs || []) {
        loadBlocks(tab.id);
      }
    }
    setLoading(false);
  };

  const loadBlocks = async (tabId: string) => {
    const res = await fetch(`/api/blocks/${tabId}`);
    if (res.ok) {
      const data = await res.json();
      setBlocks((prev) => ({ ...prev, [tabId]: data.blocks || [] }));
    }
  };

  const createTab = async () => {
    if (!newTabTitle.trim()) return;

    const slug = newTabTitle.toLowerCase().replace(/\s+/g, "-");

    const res = await fetch("/api/blocks/tabs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTabTitle,
        slug,
        icon: newTabIcon || undefined,
      }),
    });

    if (res.ok) {
      setNewTabTitle("");
      setNewTabIcon("");
      setShowNewTabDialog(false);
      loadTabs();
    }
  };

  const toggleTabVisibility = async (tab: CustomTab) => {
    await fetch(`/api/blocks/tabs/${tab.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !tab.is_visible }),
    });
    loadTabs();
  };

  const deleteTab = async (tabId: string) => {
    if (!confirm("Delete this tab and all its blocks?")) return;

    await fetch(`/api/blocks/tabs/${tabId}`, { method: "DELETE" });
    loadTabs();
  };

  const toggleExpanded = (tabId: string) => {
    setExpandedTabs((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  };

  const createBlock = async (tabId: string, blockType: BlockType) => {
    const defaultConfig = BLOCK_TYPES[blockType].defaultConfig;

    const res = await fetch(`/api/blocks/${tabId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        block_type: blockType,
        config: defaultConfig,
      }),
    });

    if (res.ok) {
      setShowNewBlockDialog(null);
      setSelectedBlockType(null);
      loadBlocks(tabId);
    }
  };

  const toggleBlockVisibility = async (block: CustomBlock) => {
    await fetch(`/api/blocks/blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !block.is_visible }),
    });
    loadBlocks(block.tab_id);
  };

  const deleteBlock = async (block: CustomBlock) => {
    if (!confirm("Delete this block?")) return;

    await fetch(`/api/blocks/blocks/${block.id}`, { method: "DELETE" });
    loadBlocks(block.tab_id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Custom Blocks
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage custom tabs and blocks for your profile
        </p>
      </div>

      {/* New Tab Button */}
      <motion.button
        onClick={() => setShowNewTabDialog(true)}
        className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="h-4 w-4" />
        New Tab
      </motion.button>

      {/* New Tab Dialog */}
      {showNewTabDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Create New Tab
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Tab Title
                </label>
                <input
                  type="text"
                  value={newTabTitle}
                  onChange={(e) => setNewTabTitle(e.target.value)}
                  placeholder="e.g., Resources, Links, Updates"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Icon (optional)
                </label>
                <input
                  type="text"
                  value={newTabIcon}
                  onChange={(e) => setNewTabIcon(e.target.value)}
                  placeholder="e.g., Link, Star, Heart"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewTabDialog(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTab}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabs List */}
      <div className="space-y-3">
        {tabs.map((tab) => {
          const Icon = newTabIcon && (Icons as any)[tab.icon || ""];
          const isExpanded = expandedTabs.has(tab.id);
          const tabBlocks = blocks[tab.id] || [];

          return (
            <div
              key={tab.id}
              className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden"
            >
              {/* Tab Header */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => toggleExpanded(tab.id)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                <GripVertical className="h-5 w-5 text-gray-400" />

                {Icon && <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {tab.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tabBlocks.length} blocks
                  </p>
                </div>

                <button
                  onClick={() => toggleTabVisibility(tab)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  {tab.is_visible ? (
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => deleteTab(tab.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </div>

              {/* Tab Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-neutral-700 p-4 bg-gray-50 dark:bg-neutral-900">
                  <button
                    onClick={() => setShowNewBlockDialog(tab.id)}
                    className="mb-4 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Block
                  </button>

                  {/* Blocks List */}
                  <div className="space-y-2">
                    {tabBlocks.map((block) => {
                      const blockMeta = BLOCK_TYPES[block.block_type];
                      const BlockIcon = (Icons as any)[blockMeta.icon];

                      return (
                        <div
                          key={block.id}
                          className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg"
                        >
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          {BlockIcon && (
                            <BlockIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-900 dark:text-white">
                              {blockMeta.label}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleBlockVisibility(block)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded transition-colors"
                          >
                            {block.is_visible ? (
                              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteBlock(block)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Block Dialog */}
      {showNewBlockDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            className="bg-white dark:bg-neutral-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add Block
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(BLOCK_TYPES).map((blockType) => {
                const Icon = (Icons as any)[blockType.icon];
                return (
                  <button
                    key={blockType.type}
                    onClick={() => createBlock(showNewBlockDialog, blockType.type)}
                    className="p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      {Icon && <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white mb-1">
                          {blockType.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {blockType.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowNewBlockDialog(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {tabs.length === 0 && (
        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
          No tabs yet. Create your first tab to get started!
        </div>
      )}
    </div>
  );
}
