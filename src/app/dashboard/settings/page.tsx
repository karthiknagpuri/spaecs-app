"use client";

import Link from "next/link";
import { Palette, Bell, Lock, CreditCard, Globe, User, ChevronRight } from "lucide-react";

const settingsSections = [
  {
    title: "Appearance",
    description: "Customize your public profile theme and colors",
    icon: Palette,
    href: "/dashboard/settings/appearance",
    available: true,
    badge: "New"
  },
  {
    title: "Account",
    description: "Update your account information and email preferences",
    icon: User,
    href: "#",
    available: false
  },
  {
    title: "Notifications",
    description: "Manage email, SMS, and push notification preferences",
    icon: Bell,
    href: "#",
    available: false
  },
  {
    title: "Security",
    description: "Two-factor authentication and security settings",
    icon: Lock,
    href: "#",
    available: false
  },
  {
    title: "Payments",
    description: "Configure payment methods and payout preferences",
    icon: CreditCard,
    href: "#",
    available: false
  },
  {
    title: "Localization",
    description: "Language and regional preferences",
    icon: Globe,
    href: "#",
    available: false
  }
];

export default function SettingsPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences and profile settings
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-4">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isAvailable = section.available;

            if (isAvailable) {
              return (
                <Link
                  key={section.title}
                  href={section.href}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                        <Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {section.title}
                          </h3>
                          {section.badge && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                              {section.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  </div>
                </Link>
              );
            }

            return (
              <div
                key={section.title}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {section.title}
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
