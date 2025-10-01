"use client";

import { LucideIcon, Rocket, Calendar } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  estimatedDate?: string;
  features?: string[];
}

export function ComingSoon({
  title,
  description,
  icon: Icon = Rocket,
  estimatedDate,
  features = [],
}: ComingSoonProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="border border-gray-200 rounded p-4 md:p-6">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-8 h-8 border border-gray-200 rounded mb-3">
            <Icon className="w-4 h-4 text-gray-700" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>

          {/* Estimated Date */}
          {estimatedDate && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 border border-gray-200 rounded text-xs text-gray-700 mb-4">
              <Calendar className="w-3 h-3" />
              <span>Expected: {estimatedDate}</span>
            </div>
          )}

          {/* Features List */}
          {features.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-medium text-gray-900 mb-2">
                Planned Features
              </h3>
              <ul className="space-y-1.5">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-xs text-gray-600"
                  >
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
              <span>In development</span>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-4 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
