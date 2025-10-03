/**
 * Social Platform Detection and Deep Linking Utility
 * Auto-detects social platforms from URLs and provides deep links for native app opening
 */

export interface SocialPlatform {
  name: string;
  icon: string;
  deepLinkScheme: (url: string) => string | null;
  webUrlPattern: RegExp;
}

// Social platform configurations
export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  youtube: {
    name: 'YouTube',
    icon: '🎥',
    webUrlPattern: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i,
    deepLinkScheme: (url: string) => {
      // Extract video ID from various YouTube URL formats
      const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (videoIdMatch && videoIdMatch[1]) {
        return `youtube://watch?v=${videoIdMatch[1]}`;
      }

      // Channel URLs
      const channelMatch = url.match(/youtube\.com\/(@[\w-]+|c\/[\w-]+|channel\/[\w-]+)/i);
      if (channelMatch && channelMatch[1]) {
        return `youtube://user/${channelMatch[1].replace('@', '')}`;
      }

      return null;
    }
  },

  instagram: {
    name: 'Instagram',
    icon: '📸',
    webUrlPattern: /^https?:\/\/(www\.)?instagram\.com\//i,
    deepLinkScheme: (url: string) => {
      // Extract username from profile URLs
      const profileMatch = url.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
      if (profileMatch && profileMatch[1]) {
        const username = profileMatch[1];
        // Post URLs
        if (url.includes('/p/') || url.includes('/reel/')) {
          return url.replace('https://www.instagram.com', 'instagram://').replace('https://instagram.com', 'instagram://');
        }
        // Profile URLs
        return `instagram://user?username=${username}`;
      }
      return null;
    }
  },

  twitter: {
    name: 'Twitter/X',
    icon: '🐦',
    webUrlPattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i,
    deepLinkScheme: (url: string) => {
      // Extract username from profile URLs
      const profileMatch = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i);
      if (profileMatch && profileMatch[1]) {
        const username = profileMatch[1];
        // Tweet URLs
        if (url.includes('/status/')) {
          const tweetIdMatch = url.match(/status\/(\d+)/i);
          if (tweetIdMatch && tweetIdMatch[1]) {
            return `twitter://status?id=${tweetIdMatch[1]}`;
          }
        }
        // Profile URLs
        return `twitter://user?screen_name=${username}`;
      }
      return null;
    }
  },

  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    webUrlPattern: /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\//i,
    deepLinkScheme: (url: string) => {
      // Extract username from profile URLs
      const profileMatch = url.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/i);
      if (profileMatch && profileMatch[1]) {
        return `tiktok://user?username=${profileMatch[1]}`;
      }

      // Video URLs
      const videoMatch = url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/i);
      if (videoMatch && videoMatch[1]) {
        return `tiktok://video/${videoMatch[1]}`;
      }

      return null;
    }
  },

  facebook: {
    name: 'Facebook',
    icon: '👥',
    webUrlPattern: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\//i,
    deepLinkScheme: (url: string) => {
      // Extract page/profile from URLs
      const pageMatch = url.match(/facebook\.com\/([a-zA-Z0-9.]+)/i);
      if (pageMatch && pageMatch[1]) {
        return `fb://profile/${pageMatch[1]}`;
      }
      return null;
    }
  },

  linkedin: {
    name: 'LinkedIn',
    icon: '💼',
    webUrlPattern: /^https?:\/\/(www\.)?linkedin\.com\//i,
    deepLinkScheme: (url: string) => {
      // Profile URLs
      const profileMatch = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
      if (profileMatch && profileMatch[1]) {
        return `linkedin://profile/${profileMatch[1]}`;
      }

      // Company URLs
      const companyMatch = url.match(/linkedin\.com\/company\/([a-zA-Z0-9-]+)/i);
      if (companyMatch && companyMatch[1]) {
        return `linkedin://company/${companyMatch[1]}`;
      }

      return null;
    }
  },

  spotify: {
    name: 'Spotify',
    icon: '🎧',
    webUrlPattern: /^https?:\/\/(www\.)?(open\.)?spotify\.com\//i,
    deepLinkScheme: (url: string) => {
      // Extract track/album/playlist/artist
      const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/i);
      if (spotifyMatch && spotifyMatch[1] && spotifyMatch[2]) {
        return `spotify:${spotifyMatch[1]}:${spotifyMatch[2]}`;
      }
      return null;
    }
  },

  twitch: {
    name: 'Twitch',
    icon: '🎮',
    webUrlPattern: /^https?:\/\/(www\.)?twitch\.tv\//i,
    deepLinkScheme: (url: string) => {
      // Extract channel name
      const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
      if (channelMatch && channelMatch[1]) {
        return `twitch://stream/${channelMatch[1]}`;
      }
      return null;
    }
  },

  discord: {
    name: 'Discord',
    icon: '💬',
    webUrlPattern: /^https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\//i,
    deepLinkScheme: (url: string) => {
      // Extract invite code
      const inviteMatch = url.match(/(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9]+)/i);
      if (inviteMatch && inviteMatch[1]) {
        return `discord://invite/${inviteMatch[1]}`;
      }
      return null;
    }
  },

  telegram: {
    name: 'Telegram',
    icon: '✈️',
    webUrlPattern: /^https?:\/\/(www\.)?(t\.me|telegram\.me)\//i,
    deepLinkScheme: (url: string) => {
      // Extract username/channel
      const telegramMatch = url.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
      if (telegramMatch && telegramMatch[1]) {
        return `tg://resolve?domain=${telegramMatch[1]}`;
      }
      return null;
    }
  },

  whatsapp: {
    name: 'WhatsApp',
    icon: '💚',
    webUrlPattern: /^https?:\/\/(www\.)?(wa\.me|api\.whatsapp\.com)\//i,
    deepLinkScheme: (url: string) => {
      // Extract phone number
      const phoneMatch = url.match(/wa\.me\/(\d+)/i);
      if (phoneMatch && phoneMatch[1]) {
        return `whatsapp://send?phone=${phoneMatch[1]}`;
      }
      return url.replace('https://api.whatsapp.com', 'whatsapp:').replace('https://wa.me', 'whatsapp://send?phone=');
    }
  },

  github: {
    name: 'GitHub',
    icon: '🐙',
    webUrlPattern: /^https?:\/\/(www\.)?github\.com\//i,
    deepLinkScheme: (url: string) => {
      // GitHub doesn't have official deep links, return null to use web URL
      return null;
    }
  },

  reddit: {
    name: 'Reddit',
    icon: '🔴',
    webUrlPattern: /^https?:\/\/(www\.)?reddit\.com\//i,
    deepLinkScheme: (url: string) => {
      // Extract subreddit or post
      const subredditMatch = url.match(/reddit\.com\/r\/([a-zA-Z0-9_]+)/i);
      if (subredditMatch && subredditMatch[1]) {
        return `reddit://reddit.com/r/${subredditMatch[1]}`;
      }
      return null;
    }
  },

  snapchat: {
    name: 'Snapchat',
    icon: '👻',
    webUrlPattern: /^https?:\/\/(www\.)?snapchat\.com\//i,
    deepLinkScheme: (url: string) => {
      // Extract username
      const usernameMatch = url.match(/snapchat\.com\/add\/([a-zA-Z0-9._-]+)/i);
      if (usernameMatch && usernameMatch[1]) {
        return `snapchat://add/${usernameMatch[1]}`;
      }
      return null;
    }
  },

  pinterest: {
    name: 'Pinterest',
    icon: '📌',
    webUrlPattern: /^https?:\/\/(www\.)?pinterest\.com\//i,
    deepLinkScheme: (url: string) => {
      // Pinterest deep links
      const pinMatch = url.match(/pinterest\.com\/pin\/(\d+)/i);
      if (pinMatch && pinMatch[1]) {
        return `pinterest://pin/${pinMatch[1]}`;
      }
      return null;
    }
  }
};

/**
 * Detect social platform from URL
 */
export function detectSocialPlatform(url: string): string | null {
  if (!url) return null;

  for (const [platformKey, platform] of Object.entries(SOCIAL_PLATFORMS)) {
    if (platform.webUrlPattern.test(url)) {
      return platformKey;
    }
  }

  return null;
}

/**
 * Get deep link URL for a social platform
 * Returns deep link URL if platform supports it and on mobile, otherwise returns original URL
 */
export function getSocialDeepLink(url: string, isMobile: boolean = true): string {
  if (!url) return url;

  const platformKey = detectSocialPlatform(url);
  if (!platformKey) return url;

  const platform = SOCIAL_PLATFORMS[platformKey];
  if (!platform) return url;

  // Only use deep links on mobile devices
  if (!isMobile) return url;

  const deepLink = platform.deepLinkScheme(url);
  return deepLink || url;
}

/**
 * Get platform metadata (icon, name) from URL
 */
export function getSocialPlatformMetadata(url: string): { name: string; icon: string; platform: string } | null {
  if (!url) return null;

  const platformKey = detectSocialPlatform(url);
  if (!platformKey) return null;

  const platform = SOCIAL_PLATFORMS[platformKey];
  if (!platform) return null;

  return {
    platform: platformKey,
    name: platform.name,
    icon: platform.icon
  };
}

/**
 * Check if device is mobile (for deep link decision)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get appropriate link href based on platform and device
 * This is the main function to use in components
 */
export function getOptimizedLinkHref(url: string): string {
  const isMobile = isMobileDevice();
  return getSocialDeepLink(url, isMobile);
}
