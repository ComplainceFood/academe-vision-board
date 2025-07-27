// Input validation utilities to prevent XSS and injection attacks

// Sanitize HTML input to prevent XSS
export const sanitizeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/&/g, '&amp;');
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validate and sanitize text input
export const sanitizeTextInput = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  
  // Remove any script tags or dangerous content
  const cleaned = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
  
  // Limit length
  return cleaned.slice(0, maxLength).trim();
};

// Validate numeric input
export const validateNumericInput = (input: string | number): number | null => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  return isNaN(num) || !isFinite(num) ? null : num;
};

// Validate and sanitize filename for uploads
export const sanitizeFilename = (filename: string): string => {
  if (typeof filename !== 'string') return 'file';
  
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.')
    .slice(0, 255);
};

// SQL injection prevention for user input
export const sanitizeForDatabase = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
};

// Validate JSON input safely
export const validateJsonInput = (input: string): any | null => {
  try {
    if (typeof input !== 'string' || input.length > 10000) return null;
    const parsed = JSON.parse(input);
    
    // Ensure it's not a function or contains dangerous content
    const stringified = JSON.stringify(parsed);
    if (stringified.includes('function') || stringified.includes('eval')) {
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
};

// Rate limiting helper
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const userRequests = requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    return true;
  };
};