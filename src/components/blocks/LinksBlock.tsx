"use client";

import { motion } from "framer-motion";
import { ExternalLink, Link as LinkIcon } from "lucide-react";
import { LinksConfig } from "@/types/blocks";
import * as Icons from "lucide-react";

interface LinksBlockProps {
  config: LinksConfig;
}

export function LinksBlock({ config }: LinksBlockProps) {
  const { links, layout = 'list' } = config;

  if (links.length === 0) {
    return null;
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return LinkIcon;
    const Icon = (Icons as any)[iconName];
    return Icon || LinkIcon;
  };

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {links.map((link, index) => {
          const Icon = getIcon(link.icon);
          return (
            <motion.a
              key={link.id || index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-4 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-950 transition-colors">
                  <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {link.title}
                  </div>
                  {link.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {link.description}
                    </div>
                  )}
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0" />
              </div>
            </motion.a>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link, index) => {
        const Icon = getIcon(link.icon);
        return (
          <motion.a
            key={link.id || index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-4 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200"
            whileHover={{ x: 4 }}
          >
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-950 transition-colors">
              <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white">
                {link.title}
              </div>
              {link.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {link.description}
                </div>
              )}
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0" />
          </motion.a>
        );
      })}
    </div>
  );
}
