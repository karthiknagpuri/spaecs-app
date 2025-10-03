/**
 * Validation utilities for input sanitization and security
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a server-side DOMPurify instance
const window = new JSDOM('').window;
const purify = DOMPurify(window as unknown as Window);

// Reserved usernames that cannot be claimed
const RESERVED_USERNAMES = [
  'admin', 'api', 'support', 'help', 'system', 'root', 'moderator',
  'staff', 'team', 'official', 'spaecs', 'dashboard', 'settings',
  'login', 'signup', 'auth', 'logout', 'profile', 'user', 'users',
  'account', 'billing', 'payment', 'checkout', 'subscription',
  'about', 'contact', 'privacy', 'terms', 'legal', 'dmca',
  'blog', 'news', 'press', 'media', 'careers', 'jobs'
];

// Username validation constants
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Text field length limits
export const TEXT_LIMITS = {
  USERNAME: { min: 3, max: 30 },
  DISPLAY_NAME: { min: 1, max: 50 },
  BIO: { min: 0, max: 500 },
  LINK_TITLE: { min: 1, max: 100 },
  LINK_DESCRIPTION: { min: 0, max: 200 },
  TIER_NAME: { min: 1, max: 50 },
  TIER_DESCRIPTION: { min: 0, max: 500 },
  BENEFIT_TEXT: { min: 1, max: 200 }
};

/**
 * Validate username with comprehensive checks
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  // Trim whitespace
  username = username.trim();

  // Length checks
  if (username.length < MIN_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at least ${MIN_USERNAME_LENGTH} characters` };
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be at most ${MAX_USERNAME_LENGTH} characters` };
  }

  // Format check
  if (!USERNAME_REGEX.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscore, and dash' };
  }

  // Reserved words check
  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' };
  }

  // Cannot start or end with dash/underscore
  if (/^[-_]|[-_]$/.test(username)) {
    return { valid: false, error: 'Username cannot start or end with dash or underscore' };
  }

  // Cannot have consecutive dashes or underscores
  if (/[-_]{2,}/.test(username)) {
    return { valid: false, error: 'Username cannot have consecutive dashes or underscores' };
  }

  return { valid: true };
}

/**
 * Validate URL to prevent XSS and malicious redirects
 */
export function validateURL(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }

  // Trim whitespace
  url = url.trim();

  // Length check
  if (url.length > 2000) {
    return { valid: false, error: 'URL is too long' };
  }

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Block suspicious patterns (case-insensitive)
    const urlLower = url.toLowerCase();
    const dangerousPatterns = [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      'about:',
      'blob:',
      '<script',
      'onerror=',
      'onclick='
    ];

    for (const pattern of dangerousPatterns) {
      if (urlLower.includes(pattern)) {
        return { valid: false, error: 'URL contains prohibited content' };
      }
    }

    // Block localhost/private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.16.') ||
          hostname === '0.0.0.0') {
        return { valid: false, error: 'Private/local URLs are not allowed' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize HTML/text input to prevent XSS
 */
export function sanitizeText(text: string, allowHTML: boolean = false): string {
  if (!text) return '';

  // Trim whitespace
  text = text.trim();

  if (allowHTML) {
    // Allow safe HTML tags only
    return purify.sanitize(text, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target']
    });
  } else {
    // Strip all HTML tags
    return purify.sanitize(text, { ALLOWED_TAGS: [] });
  }
}

/**
 * Validate text length
 */
export function validateTextLength(
  text: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): { valid: boolean; error?: string } {
  if (!text && minLength > 0) {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = text?.trim() || '';

  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }

  return { valid: true };
}

/**
 * Validate hex color code
 */
export function validateHexColor(color: string): { valid: boolean; error?: string } {
  if (!color) {
    return { valid: true }; // Optional field
  }

  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!hexRegex.test(color)) {
    return { valid: false, error: 'Invalid hex color format (use #RRGGBB)' };
  }

  return { valid: true };
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  }
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;

  // Size check
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  // MIME type check
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  // Extension check
  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, error: `File extension .${extension} is not allowed` };
    }
  }

  return { valid: true };
}

/**
 * Validate image file specifically
 */
export function validateImageUpload(file: File, maxSize: number = 5 * 1024 * 1024): { valid: boolean; error?: string } {
  return validateFileUpload(file, {
    maxSize,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif']
  });
}

/**
 * Validate ISO date string
 */
export function validateISODate(dateString: string | null): { valid: boolean; error?: string } {
  if (!dateString) {
    return { valid: true }; // Null is valid for optional dates
  }

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid date format' };
  }
}

/**
 * Validate price (in cents)
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (typeof price !== 'number' || isNaN(price)) {
    return { valid: false, error: 'Price must be a number' };
  }

  if (price < 0) {
    return { valid: false, error: 'Price cannot be negative' };
  }

  if (price > 100000000) { // 1 million dollars in cents
    return { valid: false, error: 'Price is too high' };
  }

  if (!Number.isInteger(price)) {
    return { valid: false, error: 'Price must be in cents (whole number)' };
  }

  return { valid: true };
}
