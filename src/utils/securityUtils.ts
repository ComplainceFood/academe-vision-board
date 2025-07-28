// Enhanced security utilities with password strength validation and monitoring

import { supabase } from "@/integrations/supabase/client";

// Password strength validation with server-side function
export const validatePasswordStrength = async (password: string) => {
  try {
    const { data, error } = await supabase.rpc('validate_password_strength', {
      password
    });
    
    if (error) {
      console.error('Password validation error:', error);
      return {
        score: 0,
        max_score: 5,
        strength: 'very_weak' as const,
        issues: ['Unable to validate password'],
        valid: false
      };
    }
    
    return data;
  } catch (error) {
    console.error('Password validation failed:', error);
    return {
      score: 0,
      max_score: 5,
      strength: 'very_weak' as const,
      issues: ['Password validation failed'],
      valid: false
    };
  }
};

// Enhanced client-side password validation as fallback
export const clientPasswordValidation = (password: string) => {
  const issues: string[] = [];
  let score = 0;
  
  if (password.length >= 8) score++;
  else issues.push('Password must be at least 8 characters long');
  
  if (/[A-Z]/.test(password)) score++;
  else issues.push('Password must contain at least one uppercase letter');
  
  if (/[a-z]/.test(password)) score++;
  else issues.push('Password must contain at least one lowercase letter');
  
  if (/[0-9]/.test(password)) score++;
  else issues.push('Password must contain at least one number');
  
  if (/[^A-Za-z0-9]/.test(password)) score++;
  else issues.push('Password must contain at least one special character');
  
  const commonPasswords = ['password', '123456', 'password123', 'admin', 'qwerty', '12345678'];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 0;
    issues.push('Password is too common');
  }
  
  const strength = score >= 4 ? 'strong' : score >= 3 ? 'medium' : score >= 2 ? 'weak' : 'very_weak';
  
  return {
    score,
    max_score: 5,
    strength,
    issues,
    valid: score >= 3
  };
};

// Security event logging
export const logSecurityEvent = async (
  actionType: string,
  tableName?: string,
  recordId?: string,
  details?: Record<string, any>
) => {
  try {
    await supabase.rpc('log_security_event', {
      action_type: actionType,
      table_name: tableName,
      record_id: recordId,
      details: details ? JSON.stringify(details) : null
    });
  } catch (error) {
    // Silently fail to not disrupt user experience
    console.warn('Failed to log security event:', error);
  }
};

// Monitor for suspicious activities
export const checkSuspiciousActivity = (activities: Array<{ timestamp: Date; action: string }>) => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  // Check for rapid activities in the last 5 minutes
  const recentActivities = activities.filter(
    activity => activity.timestamp > fiveMinutesAgo
  );
  
  if (recentActivities.length > 20) {
    logSecurityEvent('SUSPICIOUS_RAPID_ACTIVITY', undefined, undefined, {
      activity_count: recentActivities.length,
      time_window: '5_minutes'
    });
    return {
      suspicious: true,
      reason: 'Too many activities in short time period',
      recommendation: 'Consider rate limiting'
    };
  }
  
  return {
    suspicious: false,
    reason: null,
    recommendation: null
  };
};

// Enhanced file upload validation
export const validateFileUpload = (file: File) => {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/json',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
  ];
  
  const errors: string[] = [];
  
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push('File type not allowed');
  }
  
  // Check for potentially dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.js'];
  const fileName = file.name.toLowerCase();
  if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
    errors.push('File extension not allowed for security reasons');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Content security policy helpers
export const sanitizeUserContent = (content: string): string => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:\s*text\/html/gi, '')
    .trim();
};

// Rate limiting tracker (client-side)
export const createClientRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (identifier: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get and filter existing requests for this identifier
    const userRequests = requests.get(identifier) || [];
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    return true;
  };
};

// Session validation
export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return { valid: false, error: error.message };
    }
    
    if (!session) {
      return { valid: false, error: 'No active session' };
    }
    
    // Check if session is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      return { valid: false, error: 'Session expired' };
    }
    
    return { valid: true, session };
  } catch (error) {
    console.error('Session validation failed:', error);
    return { valid: false, error: 'Session validation failed' };
  }
};

// Security configuration validator
export const checkSecurityConfiguration = () => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  // Check if running on HTTPS in production
  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    issues.push('Application should use HTTPS in production');
  }
  
  // Check for Content Security Policy
  const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!metaCSP) {
    warnings.push('Consider adding Content Security Policy headers');
  }
  
  // Check for X-Frame-Options
  const frameOptions = document.querySelector('meta[http-equiv="X-Frame-Options"]');
  if (!frameOptions) {
    warnings.push('Consider adding X-Frame-Options headers to prevent clickjacking');
  }
  
  return {
    issues,
    warnings,
    secure: issues.length === 0
  };
};