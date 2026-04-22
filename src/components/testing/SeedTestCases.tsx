import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Loader2, CheckCircle2 } from 'lucide-react';

// ─── Test data definition ────────────────────────────────────────────────────
// Each project maps to one platform module. Each project has suites (test types)
// and each suite has test cases with full step-by-step detail.

type Step = { step: number; action: string; expected_result: string };
type TC = {
  title: string;
  description: string;
  preconditions: string;
  test_steps: Step[];
  expected_result: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'manual' | 'automated' | 'ui' | 'security' | 'performance';
  tags: string[];
  estimated_time: number;
};
type Suite = { name: string; description: string; type: 'functional' | 'regression' | 'smoke' | 'security' | 'performance' | 'integration'; cases: TC[] };
type Project = { name: string; description: string; suites: Suite[] };

const PROJECTS: Project[] = [
  // ── 1. Authentication & Onboarding ────────────────────────────────────────
  {
    name: 'Authentication & Onboarding',
    description: 'Sign-up, sign-in, OAuth, password reset, legal agreements, and first-run onboarding flows.',
    suites: [
      {
        name: 'Email / Password Auth',
        description: 'Core credential-based authentication happy paths and edge cases.',
        type: 'functional',
        cases: [
          {
            title: 'Successful email/password sign-up',
            description: 'New user completes full registration with valid credentials and agrees to legal terms.',
            preconditions: 'User is not registered. Supabase email confirmation is enabled.',
            test_steps: [
              { step: 1, action: 'Navigate to /auth', expected_result: 'Auth page loads with Sign In form' },
              { step: 2, action: 'Click "Create account" to switch to sign-up mode', expected_result: 'Sign-up form is shown with email, password, and legal agreement checkboxes' },
              { step: 3, action: 'Enter a valid unused email and a password ≥ 6 characters', expected_result: 'Inputs accept the values' },
              { step: 4, action: 'Check both "Terms of Service" and "Privacy Policy" checkboxes', expected_result: 'Both checkboxes are ticked' },
              { step: 5, action: 'Click "Create Account"', expected_result: 'Success toast appears: "Check your email to confirm your account!"' },
              { step: 6, action: 'Open confirmation email and click the link', expected_result: 'Browser redirects to app root /. User is authenticated.' },
              { step: 7, action: 'Check Supabase user_agreements table for the new user_id', expected_result: 'Two rows exist: terms_of_service and privacy_policy' },
            ],
            expected_result: 'User account created, email confirmed, legal agreements recorded, user lands on dashboard.',
            priority: 'critical', type: 'manual', tags: ['auth', 'signup', 'legal'], estimated_time: 10,
          },
          {
            title: 'Sign-up blocked without legal agreement checkboxes',
            description: 'Verify the form cannot be submitted unless both legal boxes are checked.',
            preconditions: 'User is on the sign-up form.',
            test_steps: [
              { step: 1, action: 'Fill in email and password fields', expected_result: 'Fields populated' },
              { step: 2, action: 'Leave both agreement checkboxes unchecked and click "Create Account"', expected_result: 'Error toast: "Please agree to the Terms of Service and Privacy Policy"' },
              { step: 3, action: 'Check only Terms of Service and click "Create Account"', expected_result: 'Same error toast — both boxes required' },
            ],
            expected_result: 'Form submission is blocked until both agreements are accepted.',
            priority: 'high', type: 'manual', tags: ['auth', 'signup', 'legal', 'validation'], estimated_time: 5,
          },
          {
            title: 'Successful email/password sign-in',
            description: 'Existing confirmed user signs in with correct credentials.',
            preconditions: 'User account exists and email is confirmed.',
            test_steps: [
              { step: 1, action: 'Navigate to /auth', expected_result: 'Sign-in form is shown' },
              { step: 2, action: 'Enter registered email and correct password', expected_result: 'Fields accept input' },
              { step: 3, action: 'Click "Sign In"', expected_result: 'Redirect to dashboard /' },
              { step: 4, action: 'Verify sidebar shows user avatar/initials', expected_result: 'User is recognised and authenticated' },
            ],
            expected_result: 'User successfully authenticated and redirected to dashboard.',
            priority: 'critical', type: 'manual', tags: ['auth', 'signin'], estimated_time: 5,
          },
          {
            title: 'Sign-in rejected with wrong password',
            description: 'System returns a generic error without revealing whether the email exists.',
            preconditions: 'Any state.',
            test_steps: [
              { step: 1, action: 'Enter a valid registered email and an incorrect password', expected_result: 'Fields populated' },
              { step: 2, action: 'Click "Sign In"', expected_result: 'Generic error toast shown — no account-enumeration detail' },
              { step: 3, action: 'Confirm the error message does NOT say "wrong password" or "user not found"', expected_result: 'Message is generic e.g. "Unable to sign in. Please check your email and password"' },
            ],
            expected_result: 'Authentication rejected with a generic, non-enumerable error message.',
            priority: 'high', type: 'security', tags: ['auth', 'security', 'enumeration'], estimated_time: 5,
          },
          {
            title: 'Password reset flow end-to-end',
            description: 'User resets forgotten password via email link.',
            preconditions: 'User account exists with confirmed email.',
            test_steps: [
              { step: 1, action: 'Click "Forgot password?" on sign-in form', expected_result: 'Forgot password form appears' },
              { step: 2, action: 'Enter registered email and submit', expected_result: 'Toast: "Password reset email sent! Check your inbox."' },
              { step: 3, action: 'Open reset email and click the reset link', expected_result: 'Redirected to /reset-password with a valid token in the URL' },
              { step: 4, action: 'Enter a new password and confirm it', expected_result: 'Inputs accept values' },
              { step: 5, action: 'Submit the new password', expected_result: 'Success message shown; redirect to sign-in' },
              { step: 6, action: 'Sign in with the new password', expected_result: 'Authentication succeeds' },
            ],
            expected_result: 'Password successfully reset and user can sign in with new credentials.',
            priority: 'high', type: 'manual', tags: ['auth', 'password-reset'], estimated_time: 12,
          },
        ],
      },
      {
        name: 'OAuth Sign-in (Google & Microsoft)',
        description: 'OAuth sign-up and sign-in flows including legal agreement capture.',
        type: 'functional',
        cases: [
          {
            title: 'Google OAuth sign-up triggers legal agreement modal',
            description: 'New user who signs up via Google is prompted to accept T&S and Privacy Policy before accessing the app.',
            preconditions: 'Google OAuth is configured in Supabase. Test user has no existing account.',
            test_steps: [
              { step: 1, action: 'Navigate to /auth and click "Continue with Google"', expected_result: 'Google account picker opens' },
              { step: 2, action: 'Select or sign in with a Google account', expected_result: 'Redirect back to app after OAuth callback' },
              { step: 3, action: 'Observe the app immediately after redirect', expected_result: 'Legal Agreement modal appears blocking the main UI' },
              { step: 4, action: 'Check both agreement checkboxes and click "Accept and Continue"', expected_result: 'Modal closes; user lands on dashboard' },
              { step: 5, action: 'Check user_agreements table in Supabase for the new user', expected_result: 'Two rows: terms_of_service and privacy_policy with current timestamp' },
            ],
            expected_result: 'OAuth user cannot use the app without accepting legal agreements; agreements are recorded in DB.',
            priority: 'critical', type: 'manual', tags: ['auth', 'oauth', 'google', 'legal'], estimated_time: 10,
          },
          {
            title: 'Microsoft OAuth sign-up triggers legal agreement modal',
            description: 'Same as Google but using Microsoft/Azure OAuth.',
            preconditions: 'Microsoft OAuth is configured in Supabase.',
            test_steps: [
              { step: 1, action: 'Click "Continue with Microsoft" on /auth', expected_result: 'Microsoft login page opens' },
              { step: 2, action: 'Complete Microsoft authentication', expected_result: 'Redirect back to app' },
              { step: 3, action: 'Observe modal on first load', expected_result: 'Legal Agreement modal is shown' },
              { step: 4, action: 'Accept both agreements', expected_result: 'Dashboard loads normally' },
            ],
            expected_result: 'Microsoft OAuth user is captured for legal agreements on first sign-in.',
            priority: 'high', type: 'manual', tags: ['auth', 'oauth', 'microsoft', 'legal'], estimated_time: 10,
          },
          {
            title: 'Returning OAuth user does NOT see legal agreement modal again',
            description: 'Existing OAuth user who already accepted agreements goes straight to dashboard.',
            preconditions: 'OAuth user already has accepted agreements in user_agreements table.',
            test_steps: [
              { step: 1, action: 'Sign out and sign back in with the same OAuth account', expected_result: 'OAuth flow completes' },
              { step: 2, action: 'Observe app after redirect', expected_result: 'No legal modal appears; dashboard loads directly' },
            ],
            expected_result: 'Agreement modal only shown once per user.',
            priority: 'medium', type: 'manual', tags: ['auth', 'oauth', 'legal', 'regression'], estimated_time: 5,
          },
        ],
      },
      {
        name: 'Smoke Tests — Auth',
        description: 'Quick sanity checks for the auth module.',
        type: 'smoke',
        cases: [
          {
            title: 'Auth page loads and both tabs are accessible',
            description: 'Verify /auth renders without errors and sign-in/sign-up modes are toggleable.',
            preconditions: 'User is not authenticated.',
            test_steps: [
              { step: 1, action: 'Navigate to /auth', expected_result: 'Page loads with no console errors' },
              { step: 2, action: 'Toggle between Sign In and Create Account', expected_result: 'Form changes between modes without errors' },
            ],
            expected_result: 'Auth page renders correctly in both modes.',
            priority: 'critical', type: 'ui', tags: ['smoke', 'auth'], estimated_time: 2,
          },
          {
            title: 'Authenticated user is redirected away from /auth',
            description: 'A logged-in user visiting /auth is redirected to the dashboard.',
            preconditions: 'User is signed in.',
            test_steps: [
              { step: 1, action: 'While signed in, manually navigate to /auth', expected_result: 'Redirected to / (dashboard)' },
            ],
            expected_result: 'Auth page is not accessible to authenticated users.',
            priority: 'high', type: 'manual', tags: ['smoke', 'auth', 'redirect'], estimated_time: 2,
          },
        ],
      },
    ],
  },

  // ── 2. Subscription & Promo ───────────────────────────────────────────────
  {
    name: 'Subscription & Promo System',
    description: 'Free/Pro tiers, Stripe checkout, promo toggle, promo grant, grace period, and billing settings.',
    suites: [
      {
        name: 'Promo Flow',
        description: 'Tests covering the free promo toggle and grant lifecycle.',
        type: 'functional',
        cases: [
          {
            title: 'Admin enables promo — landing page shows free pricing',
            description: 'Turning the pro_free_promo feature flag ON causes the landing page Pro card to show struck-through price and "Free" badge.',
            preconditions: 'Logged in as system_admin. Promo flag is currently OFF.',
            test_steps: [
              { step: 1, action: 'Go to /admin/users → Features tab', expected_result: 'Feature Flags admin is shown' },
              { step: 2, action: 'Toggle "Free Promo" switch to ON', expected_result: 'Switch turns green; saving indicator shown; success toast appears' },
              { step: 3, action: 'Open /landing in an incognito/private tab', expected_result: 'Pro card shows struck-through price and "Get Pro free — limited availability" button in green' },
              { step: 4, action: 'Confirm the "Start Pro trial" link is gone', expected_result: 'No Stripe checkout link visible on Pro card CTA' },
            ],
            expected_result: 'Promo flag change propagates to landing page in real-time.',
            priority: 'critical', type: 'manual', tags: ['promo', 'feature-flags', 'landing'], estimated_time: 8,
          },
          {
            title: 'New user signs up during promo gets Pro tier',
            description: 'Clicking "Get Pro free" → signup → email confirm → sign-in should result in tier=pro, status=promo in user_subscriptions.',
            preconditions: 'Promo flag is ON. Test uses a fresh email address.',
            test_steps: [
              { step: 1, action: 'Click "Get Pro free" on the landing page Pro card', expected_result: 'Navigated to /auth with ?plan=pro in URL' },
              { step: 2, action: 'Create a new account with email and password', expected_result: 'Toast: "Check your email to confirm your account!" and localStorage key academe_promo_pending is set' },
              { step: 3, action: 'Click the email confirmation link', expected_result: 'Redirected to app; onAuthStateChange SIGNED_IN fires' },
              { step: 4, action: 'Observe the app briefly after redirect', expected_result: 'grant-promo-pro edge function is called; no visible error' },
              { step: 5, action: 'Navigate to /settings → Plan tab', expected_result: 'Plan shows "Pro" tier. "Free Promo" badge visible. No Stripe upgrade button.' },
              { step: 6, action: 'Check user_subscriptions table in Supabase', expected_result: 'Row exists with tier=pro, status=promo, expires_at=null, stripe_subscription_id=null' },
            ],
            expected_result: 'Promo user has full Pro access without Stripe payment.',
            priority: 'critical', type: 'manual', tags: ['promo', 'signup', 'grant'], estimated_time: 15,
          },
          {
            title: 'Promo grant is idempotent — cannot double-grant',
            description: 'Calling grant-promo-pro multiple times for the same user results in one subscription row, not duplicates.',
            preconditions: 'Promo flag ON. User already has status=promo.',
            test_steps: [
              { step: 1, action: 'Sign out and sign back in with the promo user account within 5 min of account creation', expected_result: 'SIGNED_IN fires; grant-promo-pro called again' },
              { step: 2, action: 'Check user_subscriptions table', expected_result: 'Still exactly one row for this user — no duplicate' },
            ],
            expected_result: 'Grant is idempotent; database upsert prevents duplicate rows.',
            priority: 'high', type: 'manual', tags: ['promo', 'idempotency'], estimated_time: 8,
          },
          {
            title: 'Admin disables promo — grace period assigned to promo users',
            description: 'Turning promo OFF calls expire-promo-users, setting expires_at = now + 15 days for all status=promo accounts.',
            preconditions: 'At least one user has status=promo. Admin is logged in.',
            test_steps: [
              { step: 1, action: 'Go to /admin/users → Features tab', expected_result: 'Promo toggle shows ACTIVE / green' },
              { step: 2, action: 'Toggle the promo switch OFF', expected_result: 'Confirmation shown; expire-promo-users is called; success toast shows number of affected users' },
              { step: 3, action: 'Check user_subscriptions for the promo user', expected_result: 'expires_at is set to approximately today + 15 days' },
              { step: 4, action: 'Sign in as the promo user', expected_result: 'PromoBanner appears at top of app with countdown days' },
              { step: 5, action: 'Verify Pro features are still accessible during grace period', expected_result: 'AI Insights, Calendar Sync etc. are not gated' },
            ],
            expected_result: 'Promo users get 15-day grace period; banner shown; features remain active during grace.',
            priority: 'critical', type: 'manual', tags: ['promo', 'grace-period', 'expire'], estimated_time: 15,
          },
          {
            title: 'Promo user downgraded to free after grace period expires',
            description: 'Once expires_at passes, the promo user loses Pro access.',
            preconditions: 'Promo user has expires_at set in the past (manually set for testing).',
            test_steps: [
              { step: 1, action: 'In Supabase, manually set expires_at to yesterday for the test promo user', expected_result: 'DB updated' },
              { step: 2, action: 'Sign in as the promo user or refresh the page', expected_result: 'useSubscription detects expires_at < now() and returns tier=free' },
              { step: 3, action: 'Navigate to /analytics', expected_result: 'AI Insights panel shows "Pro Feature" gate' },
              { step: 4, action: 'Navigate to /settings → Plan tab', expected_result: 'Plan shows "Free"; upgrade button visible; no promo badge' },
            ],
            expected_result: 'Expired promo user is fully downgraded to free tier.',
            priority: 'critical', type: 'manual', tags: ['promo', 'downgrade', 'expiry'], estimated_time: 10,
          },
        ],
      },
      {
        name: 'Stripe Checkout & Billing',
        description: 'Paid upgrade flows for existing free users via Stripe.',
        type: 'functional',
        cases: [
          {
            title: 'Free user upgrades to Pro via Stripe (monthly)',
            description: 'Free user in Settings clicks Upgrade and completes Stripe checkout.',
            preconditions: 'User has free tier. Stripe test mode keys configured.',
            test_steps: [
              { step: 1, action: 'Go to /settings → Plan tab', expected_result: 'Free plan shown with upgrade button' },
              { step: 2, action: 'Select "Monthly" billing interval (default)', expected_result: 'Toggle shows monthly' },
              { step: 3, action: 'Click "Start 14-day Free Trial · Monthly"', expected_result: 'Stripe Checkout page opens in the same tab' },
              { step: 4, action: 'Fill in Stripe test card 4242 4242 4242 4242 and complete', expected_result: 'Redirected to /settings?tab=subscription&upgraded=1' },
              { step: 5, action: 'Observe the settings page', expected_result: 'Toast: "Welcome to Pro!"; Plan card shows Pro tier' },
            ],
            expected_result: 'User upgraded to Pro with active Stripe subscription.',
            priority: 'critical', type: 'manual', tags: ['stripe', 'upgrade', 'checkout'], estimated_time: 15,
          },
          {
            title: 'Settings page never shows promo pricing for Stripe Pro users',
            description: 'A real paying Pro subscriber should never see struck-through pricing or "Free" label in Settings.',
            preconditions: 'User has active Stripe subscription (status=active, stripe_subscription_id set).',
            test_steps: [
              { step: 1, action: 'Go to /settings → Plan tab', expected_result: 'Pro card shown with actual Stripe price (e.g. $7.99/mo)' },
              { step: 2, action: 'Verify no struck-through text or "Free" label appears anywhere on the page', expected_result: 'Normal pricing displayed' },
              { step: 3, action: 'Verify "Manage Billing" button is present', expected_result: '"Manage Billing" button visible; links to Stripe Customer Portal' },
            ],
            expected_result: 'Stripe Pro users always see standard pricing — promo UI is not shown.',
            priority: 'high', type: 'regression', tags: ['stripe', 'settings', 'promo-isolation'], estimated_time: 5,
          },
          {
            title: 'Billing interval toggle visible for all users',
            description: 'Monthly/Annual toggle is shown regardless of subscription tier so all users can see pricing options.',
            preconditions: 'Test with both a free user and a Pro user.',
            test_steps: [
              { step: 1, action: 'As a free user, go to /settings → Plan tab', expected_result: 'Monthly/Annual toggle is visible' },
              { step: 2, action: 'As a Pro user, go to /settings → Plan tab', expected_result: 'Monthly/Annual toggle is visible' },
              { step: 3, action: 'Toggle from Monthly to Annual', expected_result: 'Savings percentage badge appears next to "Annual"' },
            ],
            expected_result: 'Billing interval toggle is accessible for both free and Pro users.',
            priority: 'medium', type: 'regression', tags: ['settings', 'billing', 'toggle'], estimated_time: 5,
          },
        ],
      },
    ],
  },

  // ── 3. Notes & Tasks ──────────────────────────────────────────────────────
  {
    name: 'Notes & Tasks',
    description: 'Full CRUD lifecycle, folder organisation, priorities, due dates, and recurring tasks.',
    suites: [
      {
        name: 'Core CRUD — Notes',
        description: 'Create, read, update, delete notes.',
        type: 'functional',
        cases: [
          {
            title: 'Create a new note with all fields',
            description: 'User creates a note with title, content, type, priority, and tags.',
            preconditions: 'User is authenticated and on /notes.',
            test_steps: [
              { step: 1, action: 'Click "New Note" or the QuickAdd button', expected_result: 'Create Note dialog opens' },
              { step: 2, action: 'Fill in title, body content, set priority to High, add tags "research, draft"', expected_result: 'Fields accept input' },
              { step: 3, action: 'Click Save', expected_result: 'Dialog closes; note appears in the list' },
              { step: 4, action: 'Click the note to open it', expected_result: 'Note detail view shows all entered fields correctly' },
            ],
            expected_result: 'Note created and persisted with all fields intact.',
            priority: 'critical', type: 'manual', tags: ['notes', 'create', 'crud'], estimated_time: 5,
          },
          {
            title: 'Edit an existing note',
            description: 'User updates note title and body; changes persist on reload.',
            preconditions: 'At least one note exists.',
            test_steps: [
              { step: 1, action: 'Open a note and click Edit', expected_result: 'Edit dialog opens with existing values pre-populated' },
              { step: 2, action: 'Change the title and add new content', expected_result: 'Fields updated' },
              { step: 3, action: 'Save the note', expected_result: 'Dialog closes; updated title shown in list' },
              { step: 4, action: 'Reload the page and reopen the note', expected_result: 'Updated values persist' },
            ],
            expected_result: 'Edits saved and survive page reload.',
            priority: 'high', type: 'manual', tags: ['notes', 'edit', 'crud'], estimated_time: 5,
          },
          {
            title: 'Delete a note',
            description: 'User deletes a note; it is removed from list and database.',
            preconditions: 'At least one note exists.',
            test_steps: [
              { step: 1, action: 'Click the delete action on a note', expected_result: 'Confirmation prompt shown' },
              { step: 2, action: 'Confirm deletion', expected_result: 'Note removed from list; success toast shown' },
              { step: 3, action: 'Reload the page', expected_result: 'Note does not reappear' },
            ],
            expected_result: 'Note permanently deleted.',
            priority: 'high', type: 'manual', tags: ['notes', 'delete', 'crud'], estimated_time: 4,
          },
        ],
      },
      {
        name: 'Core CRUD — Tasks',
        description: 'Create, complete, edit, and delete tasks; due dates and priorities.',
        type: 'functional',
        cases: [
          {
            title: 'Create a task with due date and priority',
            description: 'Task is created with all metadata and appears in the task list.',
            preconditions: 'User on /notes, Tasks view.',
            test_steps: [
              { step: 1, action: 'Click "New Task"', expected_result: 'Create Task dialog opens' },
              { step: 2, action: 'Enter title, set due date to tomorrow, set priority to Urgent', expected_result: 'Fields accept input' },
              { step: 3, action: 'Save', expected_result: 'Task appears in list with due date badge and priority indicator' },
            ],
            expected_result: 'Task created with correct metadata visible in the list.',
            priority: 'critical', type: 'manual', tags: ['tasks', 'create', 'crud'], estimated_time: 5,
          },
          {
            title: 'Mark task as complete',
            description: 'Checking a task marks it complete and moves it to the completed section.',
            preconditions: 'At least one incomplete task exists.',
            test_steps: [
              { step: 1, action: 'Click the checkbox on an incomplete task', expected_result: 'Task struck-through or moved to "Completed" section' },
              { step: 2, action: 'Reload the page', expected_result: 'Task remains in completed state' },
            ],
            expected_result: 'Task completion persists.',
            priority: 'high', type: 'manual', tags: ['tasks', 'complete'], estimated_time: 3,
          },
        ],
      },
      {
        name: 'Regression — Notes',
        description: 'Regression checks for notes after subscription and promo changes.',
        type: 'regression',
        cases: [
          {
            title: 'Notes accessible on free tier',
            description: 'Notes is a free-tier feature and must not be gated.',
            preconditions: 'User has free subscription.',
            test_steps: [
              { step: 1, action: 'Navigate to /notes', expected_result: 'Full notes UI loads — no ProGate overlay' },
              { step: 2, action: 'Create a note', expected_result: 'Note created successfully' },
            ],
            expected_result: 'Notes feature fully accessible without Pro subscription.',
            priority: 'high', type: 'manual', tags: ['notes', 'free-tier', 'regression'], estimated_time: 3,
          },
        ],
      },
    ],
  },

  // ── 4. Meetings ───────────────────────────────────────────────────────────
  {
    name: 'Meetings',
    description: 'Meeting creation, agenda management, AI summarizer, and note-taking.',
    suites: [
      {
        name: 'Core CRUD — Meetings',
        description: 'Create, edit, and delete meetings.',
        type: 'functional',
        cases: [
          {
            title: 'Create a new meeting with agenda',
            description: 'User creates a meeting with title, date, attendees, and agenda items.',
            preconditions: 'User on /meetings.',
            test_steps: [
              { step: 1, action: 'Click "New Meeting" or QuickAdd', expected_result: 'Create Meeting dialog opens' },
              { step: 2, action: 'Enter title, set date/time, add two agenda items, list attendees', expected_result: 'All fields accept input' },
              { step: 3, action: 'Save', expected_result: 'Meeting appears in the meetings list' },
              { step: 4, action: 'Open the meeting detail', expected_result: 'All fields displayed correctly' },
            ],
            expected_result: 'Meeting created and all data persisted.',
            priority: 'critical', type: 'manual', tags: ['meetings', 'create', 'crud'], estimated_time: 8,
          },
          {
            title: 'Edit meeting details',
            description: 'User updates meeting title and adds a new agenda item.',
            preconditions: 'Meeting exists.',
            test_steps: [
              { step: 1, action: 'Open meeting and click Edit', expected_result: 'Edit dialog with pre-filled data' },
              { step: 2, action: 'Change title and add agenda item', expected_result: 'Changes accepted' },
              { step: 3, action: 'Save', expected_result: 'Updated meeting shown; changes persist on reload' },
            ],
            expected_result: 'Meeting edits saved correctly.',
            priority: 'high', type: 'manual', tags: ['meetings', 'edit', 'crud'], estimated_time: 5,
          },
        ],
      },
      {
        name: 'AI Meeting Summarizer (Pro)',
        description: 'AI summarizer is gated to Pro and produces summaries.',
        type: 'functional',
        cases: [
          {
            title: 'AI summarizer blocked for free users',
            description: 'Free-tier users see a Pro gate when accessing AI Meeting Agenda & Summarizer.',
            preconditions: 'User has free subscription.',
            test_steps: [
              { step: 1, action: 'Open a meeting and try to access AI Summarizer', expected_result: 'ProGate overlay shown with upgrade prompt' },
            ],
            expected_result: 'AI summarizer inaccessible on free tier.',
            priority: 'high', type: 'manual', tags: ['meetings', 'pro-gate', 'ai'], estimated_time: 3,
          },
          {
            title: 'AI summarizer available for Pro users',
            description: 'Pro user can generate a meeting summary.',
            preconditions: 'User has Pro subscription. Meeting with notes exists.',
            test_steps: [
              { step: 1, action: 'Open a meeting with content and click "AI Summary"', expected_result: 'AI summarizer panel opens' },
              { step: 2, action: 'Trigger summary generation', expected_result: 'Loading indicator; summary text generated within reasonable time' },
              { step: 3, action: 'Verify summary is relevant to the meeting notes', expected_result: 'Summary content makes sense' },
            ],
            expected_result: 'AI summary generated and displayed for Pro user.',
            priority: 'high', type: 'manual', tags: ['meetings', 'ai', 'pro'], estimated_time: 8,
          },
        ],
      },
    ],
  },

  // ── 5. Planning / Calendar ────────────────────────────────────────────────
  {
    name: 'Planning & Calendar',
    description: 'Semester planning, event creation, Google/Outlook calendar sync, and future tasks.',
    suites: [
      {
        name: 'Event Management',
        description: 'Create, view, edit, and delete calendar events.',
        type: 'functional',
        cases: [
          {
            title: 'Create a calendar event',
            description: 'User adds an event to the planning calendar.',
            preconditions: 'User on /planning.',
            test_steps: [
              { step: 1, action: 'Click on a date on the calendar or click "Add Event"', expected_result: 'Event creation dialog opens' },
              { step: 2, action: 'Enter title, date, time, and description', expected_result: 'Fields populated' },
              { step: 3, action: 'Save event', expected_result: 'Event appears on the calendar on the selected date' },
            ],
            expected_result: 'Event visible on calendar after creation.',
            priority: 'critical', type: 'manual', tags: ['planning', 'events', 'crud'], estimated_time: 5,
          },
        ],
      },
      {
        name: 'Calendar Sync — Pro Feature',
        description: 'Google and Outlook calendar sync are Pro-gated features.',
        type: 'functional',
        cases: [
          {
            title: 'Google Calendar sync blocked for free users',
            description: 'Free users cannot connect Google Calendar.',
            preconditions: 'User has free subscription. Navigate to /settings → Connections.',
            test_steps: [
              { step: 1, action: 'Go to Settings → Connections tab', expected_result: 'Google Calendar Integration card shown with ProGate overlay' },
              { step: 2, action: 'Try to click "Connect"', expected_result: 'Upgrade prompt shown, not OAuth redirect' },
            ],
            expected_result: 'Calendar sync is properly gated for free users.',
            priority: 'high', type: 'manual', tags: ['planning', 'calendar-sync', 'pro-gate'], estimated_time: 5,
          },
          {
            title: 'Google Calendar OAuth connect flow for Pro users',
            description: 'Pro user connects Google Calendar via OAuth.',
            preconditions: 'User has Pro subscription.',
            test_steps: [
              { step: 1, action: 'Go to Settings → Connections and click "Connect Google Calendar"', expected_result: 'Google OAuth consent screen opens' },
              { step: 2, action: 'Authorize the app', expected_result: 'Redirected back; calendar shows as connected' },
              { step: 3, action: 'Navigate to /planning', expected_result: 'Google Calendar events are visible on the calendar' },
            ],
            expected_result: 'Google Calendar successfully connected and events displayed.',
            priority: 'high', type: 'manual', tags: ['planning', 'google-calendar', 'oauth', 'pro'], estimated_time: 12,
          },
        ],
      },
    ],
  },

  // ── 6. Funding & Grants ───────────────────────────────────────────────────
  {
    name: 'Funding & Grants',
    description: 'Funding source management, expenditures, grant notes, and AI narrative writer.',
    suites: [
      {
        name: 'Core CRUD — Funding',
        description: 'Add, edit, and track funding sources and expenditures.',
        type: 'functional',
        cases: [
          {
            title: 'Add a new funding source',
            description: 'User adds a grant with title, amount, agency, and deadline.',
            preconditions: 'User on /funding.',
            test_steps: [
              { step: 1, action: 'Click "Add Funding Source"', expected_result: 'Dialog opens' },
              { step: 2, action: 'Enter grant title, funding agency, total amount, start and end dates', expected_result: 'Fields accept input' },
              { step: 3, action: 'Save', expected_result: 'Grant appears in funding list with correct amounts' },
            ],
            expected_result: 'Funding source created and visible in list.',
            priority: 'critical', type: 'manual', tags: ['funding', 'create', 'crud'], estimated_time: 6,
          },
          {
            title: 'Add expenditure to a funding source',
            description: 'User logs an expense against a grant; remaining balance updates.',
            preconditions: 'At least one funding source exists.',
            test_steps: [
              { step: 1, action: 'Open a funding source and click "Add Expenditure"', expected_result: 'Expenditure dialog opens' },
              { step: 2, action: 'Enter description, amount, and date', expected_result: 'Fields populated' },
              { step: 3, action: 'Save', expected_result: 'Expenditure listed; remaining balance in funding overview decreases by the amount' },
            ],
            expected_result: 'Expenditure recorded and balance calculated correctly.',
            priority: 'high', type: 'manual', tags: ['funding', 'expenditure', 'balance'], estimated_time: 6,
          },
        ],
      },
      {
        name: 'AI Grant Narrative (Pro)',
        description: 'AI Grant Narrative Writer is a Pro-gated feature.',
        type: 'functional',
        cases: [
          {
            title: 'AI Grant Narrative blocked for free users',
            description: 'Free users see Pro gate on the AI narrative writer.',
            preconditions: 'Free user, on a funding source detail page.',
            test_steps: [
              { step: 1, action: 'Navigate to a funding source and locate AI Narrative Writer', expected_result: 'ProGate overlay shown' },
            ],
            expected_result: 'Feature gated correctly.',
            priority: 'high', type: 'manual', tags: ['funding', 'ai', 'pro-gate'], estimated_time: 3,
          },
        ],
      },
    ],
  },

  // ── 7. Achievements & CV ──────────────────────────────────────────────────
  {
    name: 'Achievements & CV',
    description: 'Publications, talks, awards, ORCID integration, CV import and export.',
    suites: [
      {
        name: 'Publications & Achievements CRUD',
        description: 'Add and manage academic achievements.',
        type: 'functional',
        cases: [
          {
            title: 'Add a publication',
            description: 'User adds a journal publication with all metadata.',
            preconditions: 'User on /achievements → Publications.',
            test_steps: [
              { step: 1, action: 'Click "Add Achievement" or "New Publication"', expected_result: 'Create dialog opens' },
              { step: 2, action: 'Enter title, journal name, year, co-authors, DOI', expected_result: 'Fields populated' },
              { step: 3, action: 'Save', expected_result: 'Publication appears in publications list' },
            ],
            expected_result: 'Publication saved and displayed.',
            priority: 'critical', type: 'manual', tags: ['achievements', 'publications', 'crud'], estimated_time: 5,
          },
        ],
      },
      {
        name: 'Pro Features — CV & ORCID',
        description: 'CV import, resume export, and ORCID integration require Pro.',
        type: 'functional',
        cases: [
          {
            title: 'CV Import blocked for free users',
            description: 'Free user cannot use AI CV Import.',
            preconditions: 'Free subscription.',
            test_steps: [
              { step: 1, action: 'Navigate to Achievements and find CV Import button', expected_result: 'ProGate overlay shown' },
            ],
            expected_result: 'CV Import gated on free tier.',
            priority: 'high', type: 'manual', tags: ['achievements', 'cv', 'pro-gate'], estimated_time: 3,
          },
          {
            title: 'Resume export available for Pro users (PDF and DOCX)',
            description: 'Pro user can export CV in both formats.',
            preconditions: 'Pro subscription. At least a few achievements exist.',
            test_steps: [
              { step: 1, action: 'Click "Export CV / Resume"', expected_result: 'Export options shown (PDF, DOCX)' },
              { step: 2, action: 'Click "Export as PDF"', expected_result: 'PDF file downloaded' },
              { step: 3, action: 'Open the PDF', expected_result: 'Document contains the user\'s achievements data' },
              { step: 4, action: 'Click "Export as DOCX"', expected_result: 'DOCX file downloaded and openable in Word' },
            ],
            expected_result: 'Both export formats work correctly for Pro users.',
            priority: 'high', type: 'manual', tags: ['achievements', 'export', 'pro'], estimated_time: 10,
          },
        ],
      },
    ],
  },

  // ── 8. Supplies / Inventory ───────────────────────────────────────────────
  {
    name: 'Supplies & Inventory',
    description: 'Lab/office inventory tracking, shopping lists, expense management.',
    suites: [
      {
        name: 'Core CRUD — Inventory',
        description: 'Add, update, and delete supply items.',
        type: 'functional',
        cases: [
          {
            title: 'Add a new supply item',
            description: 'User adds a supply item with quantity, category, and reorder level.',
            preconditions: 'User on /supplies.',
            test_steps: [
              { step: 1, action: 'Click "Add Item"', expected_result: 'Add Item dialog opens' },
              { step: 2, action: 'Enter name, quantity, category, unit, and reorder level', expected_result: 'Fields populated' },
              { step: 3, action: 'Save', expected_result: 'Item appears in inventory list' },
            ],
            expected_result: 'Supply item created and visible in inventory.',
            priority: 'critical', type: 'manual', tags: ['supplies', 'inventory', 'create'], estimated_time: 5,
          },
          {
            title: 'Low stock alert triggered when below reorder level',
            description: 'Item shows a warning indicator when quantity drops below reorder level.',
            preconditions: 'Item exists with reorder level set to 5.',
            test_steps: [
              { step: 1, action: 'Edit the item and set quantity to 2 (below reorder level 5)', expected_result: 'Save succeeds' },
              { step: 2, action: 'View the inventory list', expected_result: 'Item shows low-stock indicator/badge' },
            ],
            expected_result: 'Visual low-stock alert displayed.',
            priority: 'medium', type: 'manual', tags: ['supplies', 'low-stock', 'alerts'], estimated_time: 5,
          },
        ],
      },
      {
        name: 'Shopping List',
        description: 'Add items to shopping list and manage purchases.',
        type: 'functional',
        cases: [
          {
            title: 'Add item to shopping list',
            description: 'User adds a needed item to the shopping list.',
            preconditions: 'User on /supplies → Shopping List tab.',
            test_steps: [
              { step: 1, action: 'Click "Add to Shopping List"', expected_result: 'Dialog opens' },
              { step: 2, action: 'Enter item name, quantity needed, and estimated cost', expected_result: 'Fields populated' },
              { step: 3, action: 'Save', expected_result: 'Item appears in shopping list' },
            ],
            expected_result: 'Shopping list item added.',
            priority: 'high', type: 'manual', tags: ['supplies', 'shopping-list'], estimated_time: 4,
          },
        ],
      },
    ],
  },

  // ── 9. Analytics ──────────────────────────────────────────────────────────
  {
    name: 'Analytics',
    description: 'Dashboard metrics, charts, and AI Insights (Pro-gated).',
    suites: [
      {
        name: 'Analytics Dashboard',
        description: 'Charts and metrics render correctly for all tiers.',
        type: 'functional',
        cases: [
          {
            title: 'Analytics dashboard loads with data',
            description: 'Analytics page shows charts and summary metrics based on user data.',
            preconditions: 'User has created notes, meetings, and funding sources.',
            test_steps: [
              { step: 1, action: 'Navigate to /analytics', expected_result: 'Dashboard loads without errors' },
              { step: 2, action: 'Verify summary cards show counts matching actual data', expected_result: 'Numbers are accurate' },
              { step: 3, action: 'Verify charts render (no blank areas)', expected_result: 'Charts display data visually' },
            ],
            expected_result: 'Analytics dashboard renders all sections with correct data.',
            priority: 'high', type: 'manual', tags: ['analytics', 'dashboard'], estimated_time: 8,
          },
        ],
      },
      {
        name: 'AI Insights — Pro Gate',
        description: 'AI Insights are gated to Pro subscribers.',
        type: 'functional',
        cases: [
          {
            title: 'AI Insights blocked for free users',
            description: 'Free users see upgrade prompt instead of AI insights panel.',
            preconditions: 'Free subscription.',
            test_steps: [
              { step: 1, action: 'Navigate to /analytics', expected_result: 'AI Insights section shows ProGate overlay' },
              { step: 2, action: 'Verify no AI-generated content is visible', expected_result: 'Only upgrade prompt shown' },
            ],
            expected_result: 'AI Insights correctly gated.',
            priority: 'high', type: 'manual', tags: ['analytics', 'ai', 'pro-gate'], estimated_time: 3,
          },
          {
            title: 'AI Insights visible and functional for Pro users',
            description: 'Pro user can see and interact with AI-generated insights.',
            preconditions: 'Pro subscription. Meaningful data exists.',
            test_steps: [
              { step: 1, action: 'Navigate to /analytics', expected_result: 'AI Insights panel loads (no gate)' },
              { step: 2, action: 'Verify insights are generated and displayed', expected_result: 'Insight cards or text visible' },
            ],
            expected_result: 'AI Insights rendered for Pro users.',
            priority: 'high', type: 'manual', tags: ['analytics', 'ai', 'pro'], estimated_time: 5,
          },
        ],
      },
    ],
  },

  // ── 10. Settings ──────────────────────────────────────────────────────────
  {
    name: 'Settings',
    description: 'Profile, security, connections, notifications, appearance, and subscription management.',
    suites: [
      {
        name: 'Profile Management',
        description: 'Update and persist profile information.',
        type: 'functional',
        cases: [
          {
            title: 'Update profile information',
            description: 'User updates display name, department, and position; changes persist.',
            preconditions: 'User on /settings → Profile tab.',
            test_steps: [
              { step: 1, action: 'Change display name, first/last name, department, and position', expected_result: 'Unsaved changes indicator appears' },
              { step: 2, action: 'Click Save Changes', expected_result: 'Success toast; changes saved' },
              { step: 3, action: 'Reload the page', expected_result: 'Updated values still shown' },
            ],
            expected_result: 'Profile changes persisted to database.',
            priority: 'high', type: 'manual', tags: ['settings', 'profile'], estimated_time: 5,
          },
          {
            title: 'Avatar upload',
            description: 'User uploads a profile image under 1MB; it appears in the sidebar.',
            preconditions: 'User on /settings → Profile.',
            test_steps: [
              { step: 1, action: 'Click "Change Avatar" and select an image file < 1MB', expected_result: 'Upload starts' },
              { step: 2, action: 'Wait for upload to complete', expected_result: 'Success toast; avatar preview updates' },
              { step: 3, action: 'Check the sidebar', expected_result: 'New avatar image shown in sidebar' },
            ],
            expected_result: 'Avatar uploaded and displayed across the app.',
            priority: 'medium', type: 'manual', tags: ['settings', 'avatar', 'upload'], estimated_time: 5,
          },
          {
            title: 'Avatar upload rejected when file > 1MB',
            description: 'Files exceeding 1MB are rejected with a clear error message.',
            preconditions: 'User on /settings → Profile.',
            test_steps: [
              { step: 1, action: 'Attempt to upload an image file > 1MB', expected_result: 'Error toast: "Please choose an image smaller than 1MB"' },
              { step: 2, action: 'Verify avatar does not change', expected_result: 'Previous avatar still shown' },
            ],
            expected_result: 'Large file rejected with appropriate error.',
            priority: 'medium', type: 'manual', tags: ['settings', 'avatar', 'validation'], estimated_time: 3,
          },
        ],
      },
      {
        name: 'Security — Password & Email',
        description: 'Change password and update email address.',
        type: 'functional',
        cases: [
          {
            title: 'Change password with correct current password',
            description: 'User successfully changes password after verifying current one.',
            preconditions: 'User on /settings → Security tab.',
            test_steps: [
              { step: 1, action: 'Enter current password, new password, and confirm new password', expected_result: 'All fields filled' },
              { step: 2, action: 'Click "Update Password"', expected_result: 'Success toast: "Password updated"' },
              { step: 3, action: 'Sign out and sign back in with the new password', expected_result: 'Authentication succeeds' },
            ],
            expected_result: 'Password changed and usable for authentication.',
            priority: 'high', type: 'manual', tags: ['settings', 'security', 'password'], estimated_time: 8,
          },
          {
            title: 'Change password fails with incorrect current password',
            description: 'Incorrect current password is rejected before allowing a change.',
            preconditions: 'User on /settings → Security tab.',
            test_steps: [
              { step: 1, action: 'Enter an incorrect current password and a new password', expected_result: 'Fields filled' },
              { step: 2, action: 'Click "Update Password"', expected_result: 'Error toast: "Incorrect password"' },
              { step: 3, action: 'Verify password is not changed', expected_result: 'Old password still works for sign-in' },
            ],
            expected_result: 'Password change blocked with wrong current password.',
            priority: 'high', type: 'security', tags: ['settings', 'security', 'password'], estimated_time: 5,
          },
        ],
      },
      {
        name: 'Appearance & Language',
        description: 'Theme switching and language selection.',
        type: 'functional',
        cases: [
          {
            title: 'Switch between light, dark, and system themes',
            description: 'Theme changes applied immediately across the UI.',
            preconditions: 'User on /settings → Appearance.',
            test_steps: [
              { step: 1, action: 'Click "Dark" theme option', expected_result: 'UI switches to dark mode' },
              { step: 2, action: 'Click "Light" theme option', expected_result: 'UI switches to light mode' },
              { step: 3, action: 'Click "System" theme option', expected_result: 'UI matches OS theme preference' },
              { step: 4, action: 'Reload the page', expected_result: 'Selected theme persists' },
            ],
            expected_result: 'All three theme modes apply and persist.',
            priority: 'medium', type: 'manual', tags: ['settings', 'theme', 'appearance'], estimated_time: 5,
          },
          {
            title: 'Change app language to Spanish',
            description: 'Switching to Spanish (ES) translates UI strings.',
            preconditions: 'User on /settings → Language.',
            test_steps: [
              { step: 1, action: 'Select "Español" from the language switcher', expected_result: 'Page UI text changes to Spanish' },
              { step: 2, action: 'Navigate to another page (e.g. /notes)', expected_result: 'Page titles and buttons are in Spanish' },
              { step: 3, action: 'Reload the page', expected_result: 'Spanish language persists' },
            ],
            expected_result: 'Language preference applied app-wide and persisted.',
            priority: 'medium', type: 'manual', tags: ['settings', 'i18n', 'language'], estimated_time: 5,
          },
        ],
      },
    ],
  },

  // ── 11. Admin Panel ───────────────────────────────────────────────────────
  {
    name: 'Admin Panel',
    description: 'User management, role assignment, subscription overrides, feature flags, and system health.',
    suites: [
      {
        name: 'Access Control',
        description: 'Admin pages are restricted to system_admin role.',
        type: 'security',
        cases: [
          {
            title: 'Non-admin cannot access /admin/users',
            description: 'Regular authenticated users are blocked from the admin users page.',
            preconditions: 'User with primary_user role is authenticated.',
            test_steps: [
              { step: 1, action: 'Navigate directly to /admin/users', expected_result: 'Access Denied screen shown — not the user table' },
            ],
            expected_result: 'Admin page inaccessible to non-admin users.',
            priority: 'critical', type: 'security', tags: ['admin', 'access-control', 'security'], estimated_time: 3,
          },
          {
            title: 'Non-admin cannot access /testing',
            description: 'Testing platform is admin-only.',
            preconditions: 'Regular user authenticated.',
            test_steps: [
              { step: 1, action: 'Navigate to /testing', expected_result: 'Access Denied or redirect to dashboard' },
            ],
            expected_result: 'Testing platform blocked for non-admins.',
            priority: 'critical', type: 'security', tags: ['admin', 'testing', 'access-control'], estimated_time: 2,
          },
        ],
      },
      {
        name: 'User Management',
        description: 'Override user subscriptions and roles.',
        type: 'functional',
        cases: [
          {
            title: 'Admin upgrades a user to Pro via override',
            description: 'Admin manually sets a free user to Pro tier via the edit dialog.',
            preconditions: 'Logged in as admin. Target user has free subscription.',
            test_steps: [
              { step: 1, action: 'Go to /admin/users → Users tab', expected_result: 'User list displayed' },
              { step: 2, action: 'Click edit (pencil) on the target user', expected_result: 'Override User Access dialog opens' },
              { step: 3, action: 'Change Subscription Tier to "Pro" and Status to "Active", add a note, save', expected_result: 'Success toast; row updates immediately' },
              { step: 4, action: 'Sign in as the target user and go to /analytics', expected_result: 'AI Insights are accessible (no gate)' },
            ],
            expected_result: 'Manual Pro override applies immediately for the target user.',
            priority: 'high', type: 'manual', tags: ['admin', 'user-management', 'subscription'], estimated_time: 10,
          },
          {
            title: 'Admin can filter users by promo status',
            description: 'Status dropdown includes "Promo" filter and shows only promo users when selected.',
            preconditions: 'At least one promo user exists.',
            test_steps: [
              { step: 1, action: 'On /admin/users → Users tab, open the Status filter dropdown', expected_result: '"Promo" option is listed' },
              { step: 2, action: 'Select "Promo"', expected_result: 'Only users with status=promo are shown' },
            ],
            expected_result: 'Promo status filter works correctly.',
            priority: 'medium', type: 'manual', tags: ['admin', 'filter', 'promo'], estimated_time: 3,
          },
          {
            title: 'Overview tab shows Promo Pro count',
            description: 'The Overview statistics card displays the current number of active promo users.',
            preconditions: 'At least one promo user exists.',
            test_steps: [
              { step: 1, action: 'Navigate to /admin/users → Overview tab', expected_result: '"Promo Pro" card shown with count > 0' },
              { step: 2, action: 'Compare count to actual promo users in Users tab', expected_result: 'Counts match' },
            ],
            expected_result: 'Promo Pro count is accurate in Overview.',
            priority: 'medium', type: 'manual', tags: ['admin', 'overview', 'promo'], estimated_time: 3,
          },
        ],
      },
    ],
  },

  // ── 12. Communications ────────────────────────────────────────────────────
  {
    name: 'Communications',
    description: 'Platform-wide messaging and admin communications management.',
    suites: [
      {
        name: 'Communications List',
        description: 'View and interact with platform communications.',
        type: 'functional',
        cases: [
          {
            title: 'View communications list',
            description: 'User can see all communications sent to them.',
            preconditions: 'User on /communications.',
            test_steps: [
              { step: 1, action: 'Navigate to /communications', expected_result: 'Communications list renders without errors' },
              { step: 2, action: 'Verify messages are listed with sender, subject, and date', expected_result: 'All fields visible per message' },
            ],
            expected_result: 'Communications list renders correctly.',
            priority: 'medium', type: 'manual', tags: ['communications', 'list'], estimated_time: 3,
          },
        ],
      },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function SeedTestCases() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState({ projects: 0, suites: 0, cases: 0 });

  const totalSteps = PROJECTS.reduce((p, proj) =>
    p + proj.suites.reduce((s, suite) => s + suite.cases.length + 1, 0) + 1, 0);
  let stepsDone = 0;

  const tick = (msg: string) => {
    stepsDone++;
    setProgress(Math.round((stepsDone / totalSteps) * 100));
    setStatus(msg);
  };

  const handleSeed = async () => {
    if (!user) return;
    setRunning(true);
    setDone(false);
    setProgress(0);
    stepsDone = 0;

    let totalProjects = 0;
    let totalSuites = 0;
    let totalCases = 0;

    try {
      for (const project of PROJECTS) {
        tick(`Creating project: ${project.name}`);

        const { data: projData, error: projErr } = await supabase
          .from('test_projects' as any)
          .insert({ name: project.name, description: project.description, status: 'active', user_id: user.id })
          .select('id')
          .single();

        if (projErr) throw new Error(`Project "${project.name}": ${projErr.message}`);
        totalProjects++;
        const projectId = (projData as any).id;

        for (const suite of project.suites) {
          tick(`  Suite: ${suite.name}`);

          const { data: suiteData, error: suiteErr } = await supabase
            .from('test_suites' as any)
            .insert({ name: suite.name, description: suite.description, type: suite.type, project_id: projectId, user_id: user.id })
            .select('id')
            .single();

          if (suiteErr) throw new Error(`Suite "${suite.name}": ${suiteErr.message}`);
          totalSuites++;
          const suiteId = (suiteData as any).id;

          for (const tc of suite.cases) {
            tick(`    Case: ${tc.title}`);
            const { error: caseErr } = await supabase
              .from('test_cases' as any)
              .insert({
                suite_id: suiteId,
                user_id: user.id,
                title: tc.title,
                description: tc.description,
                preconditions: tc.preconditions,
                test_steps: tc.test_steps,
                expected_result: tc.expected_result,
                priority: tc.priority,
                type: tc.type,
                tags: tc.tags,
                estimated_time: tc.estimated_time,
                status: 'active',
              });
            if (caseErr) throw new Error(`Case "${tc.title}": ${caseErr.message}`);
            totalCases++;
          }
        }
      }

      setSummary({ projects: totalProjects, suites: totalSuites, cases: totalCases });
      setDone(true);
      toast({ title: 'Test cases seeded', description: `${totalProjects} projects · ${totalSuites} suites · ${totalCases} test cases created.` });
    } catch (err: any) {
      toast({ title: 'Seed failed', description: err.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-5 w-5 text-primary" />
          Seed Platform Test Cases
        </CardTitle>
        <CardDescription>
          Populate the testing platform with comprehensive test cases covering all 12 modules — auth, subscriptions, notes, meetings, planning, funding, achievements, supplies, analytics, settings, admin, and communications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!done && !running && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {PROJECTS.map(p => (
              <Badge key={p.name} variant="outline" className="text-[11px]">{p.name}</Badge>
            ))}
          </div>
        )}

        {running && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground truncate">{status}</p>
          </div>
        )}

        {done && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-green-700 dark:text-green-400">Seeding complete</p>
              <p className="text-green-600 dark:text-green-500">
                {summary.projects} projects · {summary.suites} suites · {summary.cases} test cases
              </p>
            </div>
          </div>
        )}

        <Button onClick={handleSeed} disabled={running || done} className="w-full gap-2">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />}
          {running ? `Seeding… ${progress}%` : done ? 'Already seeded' : 'Seed All Test Cases'}
        </Button>
      </CardContent>
    </Card>
  );
}
