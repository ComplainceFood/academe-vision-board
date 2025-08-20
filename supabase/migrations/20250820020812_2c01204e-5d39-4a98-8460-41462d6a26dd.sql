-- Clear invalid JWT tokens from outlook_integration table
-- These JWT tokens cannot be used with Microsoft Graph API

UPDATE outlook_integration 
SET 
  access_token_encrypted = NULL,
  refresh_token_encrypted = NULL,
  is_connected = false,
  token_expires_at = NULL,
  last_sync = NULL,
  updated_at = NOW()
WHERE access_token_encrypted LIKE 'eyJ%';

-- Add a comment for tracking
COMMENT ON TABLE outlook_integration IS 'Updated to clear invalid JWT tokens and require re-authentication with proper OAuth access tokens';