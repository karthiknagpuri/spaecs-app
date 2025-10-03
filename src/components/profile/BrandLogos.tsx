'use client';

import { useEffect, useRef } from 'react';

interface BrandLogo {
  id: string;
  brand_name: string;
  logo_url: string;
  website_url?: string;
}

interface BrandLogosProps {
  logos: BrandLogo[];
}

export default function BrandLogos({ logos }: BrandLogosProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!logos || logos.length === 0) return null;

  // Duplicate logos for seamless loop
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <div className="py-8 border-t border-gray-200 dark:border-neutral-800">
      <div className="text-center mb-6">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Brands Collaborated With
        </p>
      </div>

      {/* Scrolling Container */}
      <div className="relative overflow-hidden">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />

        {/* Scrolling Logos */}
        <div
          ref={scrollRef}
          className="flex gap-8 animate-scroll"
          style={{
            width: 'max-content'
          }}
        >
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.id}-${index}`}
              className="flex-shrink-0 h-12 w-32 relative group"
            >
              {logo.website_url ? (
                <a
                  href={logo.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full w-full"
                >
                  <img
                    src={logo.logo_url}
                    alt={logo.brand_name}
                    className="h-full w-full object-contain filter grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                    title={logo.brand_name}
                  />
                </a>
              ) : (
                <div className="h-full w-full">
                  <img
                    src={logo.logo_url}
                    alt={logo.brand_name}
                    className="h-full w-full object-contain filter grayscale opacity-60"
                    title={logo.brand_name}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
