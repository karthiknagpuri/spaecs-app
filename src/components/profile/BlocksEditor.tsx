"use client";

import { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Settings,
  Copy,
} from "lucide-react";
import * as Icons from "lucide-react";
import { CustomTab, CustomBlock, BLOCK_TYPES, BlockType, BlockConfig } from "@/types/blocks";
import BlockConfigEditor from "./BlockConfigEditor";

interface BlocksEditorProps {
  tabs: CustomTab[];
  blocks: Record<string, CustomBlock[]>;
  onTabsChange: () => void;
  onBlocksChange: () => void;
}

export default function BlocksEditor({
  tabs,
  blocks,
  onTabsChange,
  onBlocksChange,
}: BlocksEditorProps) {
  const [expandedTabs, setExpandedTabs] = useState<Set<string>>(new Set());
  const [showNewTabDialog, setShowNewTabDialog] = useState(false);
  const [showNewBlockDialog, setShowNewBlockDialog] = useState<string | null>(null);
  const [editingBlock, setEditingBlock] = useState<CustomBlock | null>(null);
  const [newTabTitle, setNewTabTitle] = useState("");
  const [newTabIcon, setNewTabIcon] = useState("");
  const [draggedBlock, setDraggedBlock] = useState<CustomBlock | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

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
      onTabsChange();
    }
  };

  const toggleTabVisibility = async (tab: CustomTab) => {
    await fetch(`/api/blocks/tabs/${tab.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !tab.is_visible }),
    });
    onTabsChange();
  };

  const deleteTab = async (tabId: string) => {
    if (!confirm("Delete this tab and all its blocks?")) return;

    await fetch(`/api/blocks/tabs/${tabId}`, { method: "DELETE" });
    onTabsChange();
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
      onBlocksChange();
    }
  };

  const toggleBlockVisibility = async (block: CustomBlock) => {
    await fetch(`/api/blocks/blocks/${block.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_visible: !block.is_visible }),
    });
    onBlocksChange();
  };

  const deleteBlock = async (block: CustomBlock) => {
    if (!confirm("Delete this block?")) return;

    await fetch(`/api/blocks/blocks/${block.id}`, { method: "DELETE" });
    onBlocksChange();
  };

  const duplicateBlock = async (block: CustomBlock) => {
    const res = await fetch(`/api/blocks/${block.tab_id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        block_type: block.block_type,
        config: block.config,
      }),
    });

    if (res.ok) {
      onBlocksChange();
    }
  };

  const updateBlockConfig = async (blockId: string, config: BlockConfig) => {
    await fetch(`/api/blocks/blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config }),
    });
    onBlocksChange();
  };

  const handleDragStart = (block: CustomBlock) => {
    setDraggedBlock(block);
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDragOverTab(null);
  };

  const handleDragOver = (e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    setDragOverTab(tabId);
  };

  const handleDrop = async (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (!draggedBlock) return;

    // Move block to new tab
    await fetch(`/api/blocks/blocks/${draggedBlock.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tab_id: targetTabId }),
    });

    setDraggedBlock(null);
    setDragOverTab(null);
    onBlocksChange();
  };

  const reorderBlocks = async (tabId: string, newOrder: CustomBlock[]) => {
    // Update positions
    for (let i = 0; i < newOrder.length; i++) {
      await fetch(`/api/blocks/blocks/${newOrder[i].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: i }),
      });
    }
    onBlocksChange();
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Custom Blocks</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Create tabs and add blocks to customize your profile
          </p>
        </div>
        <motion.button
          onClick={() => setShowNewTabDialog(true)}
          className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" />
          New Tab
        </motion.button>
      </div>

      {/* Tabs List */}
      <div className="space-y-3">
        {tabs.map((tab) => {
          const IconComponent = tab.icon ? (Icons as any)[tab.icon] : null;
          const isExpanded = expandedTabs.has(tab.id);
          const tabBlocks = blocks[tab.id] || [];

          return (
            <div
              key={tab.id}
              className={`bg-white dark:bg-neutral-900 border-2 rounded-xl overflow-hidden transition-all ${
                dragOverTab === tab.id
                  ? 'border-gray-900 dark:border-white shadow-lg'
                  : 'border-gray-200 dark:border-neutral-800'
              }`}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDrop={(e) => handleDrop(e, tab.id)}
            >
              {/* Tab Header */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800/50">
                <button
                  onClick={() => toggleExpanded(tab.id)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white rounded focus-visible:outline-none"
                  aria-label={isExpanded ? "Collapse tab" : "Expand tab"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />

                {IconComponent && (
                  <IconComponent className="h-5 w-5 text-gray-900 dark:text-white" />
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {tab.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tabBlocks.length} {tabBlocks.length === 1 ? 'block' : 'blocks'}
                  </p>
                </div>

                <button
                  onClick={() => toggleTabVisibility(tab)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
                  aria-label={tab.is_visible ? "Hide tab" : "Show tab"}
                >
                  {tab.is_visible ? (
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                <button
                  onClick={() => deleteTab(tab.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                  aria-label="Delete tab"
                >
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </button>
              </div>

              {/* Tab Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-neutral-800"
                  >
                    <div className="p-4 space-y-3">
                      <button
                        onClick={() => setShowNewBlockDialog(tab.id)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-neutral-700 focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
                      >
                        <Plus className="h-4 w-4" />
                        Add Block to {tab.title}
                      </button>

                      {/* Blocks List with Drag & Drop */}
                      {tabBlocks.length > 0 && (
                        <div className="space-y-2">
                          {tabBlocks.map((block) => {
                            const blockMeta = BLOCK_TYPES[block.block_type];
                            const BlockIcon = (Icons as any)[blockMeta.icon];

                            return (
                              <div
                                key={block.id}
                                draggable
                                onDragStart={() => handleDragStart(block)}
                                onDragEnd={handleDragEnd}
                                className={`bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-lg cursor-move hover:border-gray-900 dark:hover:border-white transition-all ${
                                  draggedBlock?.id === block.id ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3 p-3">
                                  <GripVertical className="h-4 w-4 text-gray-400 cursor-grab flex-shrink-0" />

                                  {BlockIcon && (
                                    <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg flex-shrink-0">
                                      <BlockIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                                    </div>
                                  )}

                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {blockMeta.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                      {blockMeta.description}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => setEditingBlock(block)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none flex-shrink-0"
                                    aria-label="Edit block"
                                  >
                                    <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </button>

                                  <button
                                    onClick={() => duplicateBlock(block)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none flex-shrink-0"
                                    aria-label="Duplicate block"
                                  >
                                    <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </button>

                                  <button
                                    onClick={() => toggleBlockVisibility(block)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none flex-shrink-0"
                                    aria-label={block.is_visible ? "Hide block" : "Show block"}
                                  >
                                    {block.is_visible ? (
                                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                    ) : (
                                      <EyeOff className="h-4 w-4 text-gray-400" />
                                    )}
                                  </button>

                                  <button
                                    onClick={() => deleteBlock(block)}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none flex-shrink-0"
                                    aria-label="Delete block"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {tabs.length === 0 && (
          <div className="text-center py-12 px-4 bg-gray-50 dark:bg-neutral-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-neutral-700">
            <div className="max-w-sm mx-auto">
              <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                No custom tabs yet
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Create your first tab to add custom blocks to your profile
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Tab Dialog */}
      <AnimatePresence>
        {showNewTabDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white dark:bg-neutral-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-neutral-800"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create New Tab
                </h3>
                <button
                  onClick={() => setShowNewTabDialog(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

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
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Icon (Lucide icon name)
                  </label>
                  <input
                    type="text"
                    value={newTabIcon}
                    onChange={(e) => setNewTabIcon(e.target.value)}
                    placeholder="e.g., Link, Star, Heart, Sparkles"
                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white text-gray-900 dark:text-white text-sm"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Visit <a href="https://lucide.dev" target="_blank" rel="noopener noreferrer" className="underline">lucide.dev</a> for icon names
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowNewTabDialog(false)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTab}
                    disabled={!newTabTitle.trim()}
                    className="flex-1 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
                  >
                    Create Tab
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Block Dialog */}
      <AnimatePresence>
        {showNewBlockDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewBlockDialog(null)}>
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 rounded-xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-neutral-800"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Add Block
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Choose a block type to add to your tab
                  </p>
                </div>
                <button
                  onClick={() => setShowNewBlockDialog(null)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
                >
                  <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(BLOCK_TYPES).map((blockType) => {
                  const Icon = (Icons as any)[blockType.icon];
                  return (
                    <button
                      key={blockType.type}
                      onClick={() => createBlock(showNewBlockDialog, blockType.type)}
                      className="p-4 border-2 border-gray-200 dark:border-neutral-700 rounded-xl hover:border-gray-900 dark:hover:border-white hover:shadow-lg transition-all text-left group focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:outline-none"
                    >
                      <div className="flex items-start gap-3">
                        {Icon && (
                          <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-lg group-hover:bg-gray-900 dark:group-hover:bg-white transition-colors flex-shrink-0">
                            <Icon className="h-5 w-5 text-gray-900 dark:text-white group-hover:text-white dark:group-hover:text-gray-900 transition-colors" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                            {blockType.label}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {blockType.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Block Config Editor Modal */}
      <AnimatePresence>
        {editingBlock && (
          <BlockConfigEditor
            block={editingBlock}
            onClose={() => setEditingBlock(null)}
            onSave={(config) => {
              updateBlockConfig(editingBlock.id, config);
              setEditingBlock(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
