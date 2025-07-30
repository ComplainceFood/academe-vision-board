
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { validatePasswordStrength, clientPasswordValidation } from "@/utils/securityUtils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LegalAgreement } from "@/components/legal/LegalAgreement";
import { useAuth } from "@/hooks/useAuth";

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [showLegalAgreement, setShowLegalAgreement] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<{email: string, password: string} | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

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
        // For signup, show legal agreement first
        setPendingSignupData({ email, password });
        setShowLegalAgreement(true);
        return;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please check your credentials and try again.");
          } else if (error.message.includes("Email not confirmed")) {
            toast.error("Please check your email and click the confirmation link before signing in.");
          } else {
            toast.error(error.message);
          }
          return;
        }

        // Check if user has agreed to legal terms
        if (data.user) {
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
      // Enhanced error handling with specific messages
      let errorMessage = "Authentication failed";
      
      if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please check your email and confirm your account before signing in.";
      } else if (error.message?.includes("User already registered")) {
        errorMessage = "An account with this email already exists. Try signing in instead.";
      } else if (error.message?.includes("Password should be at least")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error("Auth error:", error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLegalAgreementComplete = async () => {
    if (pendingSignupData) {
      // Complete the signup process
      try {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: pendingSignupData.email,
          password: pendingSignupData.password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("An account with this email already exists. Please sign in instead.");
            setIsSignUp(false);
          } else {
            throw error;
          }
        } else {
          toast.success("Check your email to confirm your account!");
        }
      } catch (error: any) {
        console.error("Signup error:", error);
        toast.error(error.message || "Failed to create account");
      }
      setPendingSignupData(null);
    }
    
    setShowLegalAgreement(false);
    
    // If user was signing in and just completed agreements, redirect to main app
    if (!isSignUp) {
      window.location.href = '/';
    }
  };

  if (showLegalAgreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <LegalAgreement 
          onAgreementComplete={handleLegalAgreementComplete}
          showDialog={true}
        />
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
              ? "Enter your email and password to create your account"
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
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading
                ? "Loading..."
                : isSignUp
                ? "Create account"
                : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
