
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { validatePasswordStrength, clientPasswordValidation } from "@/utils/securityUtils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LegalAgreement } from "@/components/legal/LegalAgreement";
import { PrivacyPolicy } from "@/components/legal/PrivacyPolicy";
import { TermsOfService } from "@/components/legal/TermsOfService";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";

const REMEMBER_ME_KEY = "smartprof_remember_email";

const AuthPage = () => {
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_ME_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(REMEMBER_ME_KEY));
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [showLegalAgreement, setShowLegalAgreement] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Sign-ups re-enabled
  const SIGNUPS_ENABLED = true;

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const checkExistingAgreements = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_agreements')
        .select('agreement_type')
        .eq('user_id', userId);

      if (error) {
        console.error('Error checking agreements:', error);
        return false;
      }

      const agreementTypes = data?.map(a => a.agreement_type) || [];
      return agreementTypes.includes('terms_of_service') && agreementTypes.includes('privacy_policy');
    } catch (error) {
      console.error('Error checking agreements:', error);
      return false;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Clean up any existing auth state before attempting new auth
      const cleanupAuthState = () => {
        localStorage.removeItem('supabase.auth.token');
        Object.keys(localStorage).forEach((key) => {
          // Preserve remember-me email when cleaning auth state
          if (key === REMEMBER_ME_KEY) return;
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      };
      
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      if (isSignUp) {
        // Block sign-ups if disabled
        if (!SIGNUPS_ENABLED) {
          toast.error("New registrations are temporarily closed. Please check back later.");
          return;
        }

        // Check if user agreed to terms for signup
        if (!agreedToTerms || !agreedToPrivacy) {
          toast.error("Please agree to the Terms of Service and Privacy Policy to create an account.");
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        
        if (error) {
          // Use generic message to prevent account enumeration
          if (error.message.includes("User already registered")) {
            toast.error("Unable to create account. Please try signing in or use a different email.");
            setIsSignUp(false);
            return;
          }
          throw error;
        }
        
        // Record user agreements in the database after successful signup
        if (data.user) {
          try {
            const agreementPromises = [
              supabase.from('user_agreements').insert({
                user_id: data.user.id,
                agreement_type: 'terms_of_service',
                version: '1.0',
                user_agent: navigator.userAgent,
              }),
              supabase.from('user_agreements').insert({
                user_id: data.user.id,
                agreement_type: 'privacy_policy',
                version: '1.0',
                user_agent: navigator.userAgent,
              })
            ];
            await Promise.all(agreementPromises);

            // Track signup with IP and location (user ID extracted from JWT on server)
            await supabase.functions.invoke('track-login', {
              body: { loginMethod: 'password' }
            });
          } catch (agreementError) {
            console.error('Error recording agreements:', agreementError);
          }
        }
        
        toast.success("Check your email to confirm your account!");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // Use generic message to prevent account enumeration
          // All auth errors get the same message to prevent attackers from discovering valid accounts
          toast.error("Unable to sign in. Please check your email and password, or verify your email if you recently signed up.");
          return;
        }

        // Check if user has agreed to legal terms
        if (data.user) {
          // Track login with IP and location (user ID extracted from JWT on server)
          await supabase.functions.invoke('track-login', {
            body: { loginMethod: 'password' }
          });

          // Persist or clear the remembered email
          if (rememberMe) {
            localStorage.setItem(REMEMBER_ME_KEY, email);
          } else {
            localStorage.removeItem(REMEMBER_ME_KEY);
          }

          const hasAgreements = await checkExistingAgreements(data.user.id);
          if (!hasAgreements) {
            setShowLegalAgreement(true);
            return;
          }
        }

        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error: any) {
      // Use generic error messages to prevent account enumeration
      // Only show specific errors for password format issues (not revealing account existence)
      let errorMessage = "Authentication failed. Please check your credentials and try again.";
      
      if (error.message?.includes("Password should be at least")) {
        errorMessage = "Password must be at least 6 characters long.";
      }
      
      console.error("Auth error:", error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setIsForgotPassword(false);
    } catch (error: any) {
      // Generic message to avoid revealing whether an email exists
      toast.success("If that email is registered, you'll receive a reset link shortly.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setIsForgotPassword(false);
    // Reset agreement states when switching modes
    setAgreedToTerms(false);
    setAgreedToPrivacy(false);
  };

  const handleLegalDialogComplete = async () => {
    setShowLegalAgreement(false);
    // Redirect to main app after completing legal agreements
    window.location.href = '/';
  };

  if (showLegalAgreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <LegalAgreement
          onAgreementComplete={handleLegalDialogComplete}
          showDialog={true}
        />
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Reset your password</CardTitle>
            <CardDescription className="text-center">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Back to sign in
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isSignUp ? "Create an account" : "Welcome back"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? SIGNUPS_ENABLED
                ? "Enter your email and password to create your account"
                : "New registrations are temporarily closed"
              : "Enter your email and password to sign in"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={async (e) => {
                  setPassword(e.target.value);
                  if (isSignUp && e.target.value) {
                    try {
                      const strength = await validatePasswordStrength(e.target.value);
                      setPasswordStrength(strength);
                    } catch {
                      const strength = clientPasswordValidation(e.target.value);
                      setPasswordStrength(strength);
                    }
                  } else {
                    setPasswordStrength(null);
                  }
                }}
                required
              />
              
              {isSignUp && passwordStrength && password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Password Strength:</span>
                    <Badge 
                      variant={passwordStrength.strength === 'strong' ? 'default' : 
                              passwordStrength.strength === 'medium' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {passwordStrength.strength.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <Progress 
                    value={(passwordStrength.score / passwordStrength.max_score) * 100}
                    className="h-1"
                  />
                  {passwordStrength.issues?.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {passwordStrength.issues.slice(0, 2).map((issue: string, index: number) => (
                        <div key={index}>• {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Remember me + Forgot password - sign in mode only */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Legal Agreements for Signup */}
            {isSignUp && (
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms-signup"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="terms-signup" className="text-sm leading-5 text-muted-foreground">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsDialog(true)}
                      className="text-primary underline hover:no-underline font-medium"
                    >
                      Terms of Service
                    </button>
                  </label>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy-signup"
                    checked={agreedToPrivacy}
                    onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="privacy-signup" className="text-sm leading-5 text-muted-foreground">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyDialog(true)}
                      className="text-primary underline hover:no-underline font-medium"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
              </div>
            )}

            {/* Read-only Terms of Service Dialog */}
            <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Terms of Service</DialogTitle>
                  <DialogDescription>Please review our Terms of Service.</DialogDescription>
                </DialogHeader>
                <TermsOfService />
                <div className="flex justify-end mt-4">
                  <Button type="button" onClick={() => setShowTermsDialog(false)} variant="outline">Close</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Read-only Privacy Policy Dialog */}
            <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Privacy Policy</DialogTitle>
                  <DialogDescription>Please review our Privacy Policy.</DialogDescription>
                </DialogHeader>
                <PrivacyPolicy />
                <div className="flex justify-end mt-4">
                  <Button type="button" onClick={() => setShowPrivacyDialog(false)} variant="outline">Close</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="w-full" type="submit" disabled={isLoading || (isSignUp && (!agreedToTerms || !agreedToPrivacy))}>
              {isLoading
                ? "Loading..."
                : isSignUp
                ? "Create account"
                : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            {SIGNUPS_ENABLED ? (
              <button
                onClick={handleModeSwitch}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            ) : (
              !isSignUp && (
                <p className="text-sm text-muted-foreground">
                  New registrations are temporarily closed
                </p>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
