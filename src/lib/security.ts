/**
 * Security utility functions for input validation and sanitization
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  // Remove potentially dangerous tags and attributes
  const dangerousTags = /<script[^>]*>.*?<\/script>/gi;
  const dangerousAttributes = /on\w+\s*=\s*["'][^"']*["']/gi;
  const dangerousProtocols = /javascript:|data:text\/html/gi;
  
  return html
    .replace(dangerousTags, '')
    .replace(dangerousAttributes, '')
    .replace(dangerousProtocols, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove angle brackets
}

/**
 * Validate file type for uploads
 */
export function isValidFileType(
  mimeType: string,
  allowedTypes: string[] = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html']
): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxBytes;
}

/**
 * Rate limit checker for client-side
 */
export class ClientRateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; remainingAttempts: number } {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return { allowed: true, remainingAttempts: this.maxAttempts - 1 };
    }

    attempt.count++;

    if (attempt.count > this.maxAttempts) {
      return { allowed: false, remainingAttempts: 0 };
    }

    return { allowed: true, remainingAttempts: this.maxAttempts - attempt.count };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Validate and sanitize portfolio data
 */
export function validatePortfolioData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.name && data.name.length > 100) {
    errors.push('Name is too long');
  }

  if (data.title && data.title.length > 150) {
    errors.push('Title is too long');
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.website && !isValidUrl(data.website)) {
    errors.push('Invalid website URL');
  }

  if (data.socials && Array.isArray(data.socials)) {
    data.socials.forEach((social: any, index: number) => {
      if (social.url && !isValidUrl(social.url)) {
        errors.push(`Invalid URL for social link ${index + 1}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
