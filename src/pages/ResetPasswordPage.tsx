
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { validatePasswordStrength, clientPasswordValidation } from "@/utils/securityUtils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands here via the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsReady(true);
      }
    });

    // Also check if there's already an active recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsNoMatch'));
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t('auth.passwordUpdated'));
      await supabase.auth.signOut();
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      let message = t('auth.passwordUpdateFailed');
      if (error.message?.includes("Password should be at least")) {
        message = t('auth.passwordTooShort');
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">{t('auth.invalidLink')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.invalidLinkDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => navigate("/auth")}>
              {t('auth.backToSignIn')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{t('auth.setNewPassword')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.setNewPasswordDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t('auth.newPasswordPlaceholder')}
                value={password}
                onChange={async (e) => {
                  setPassword(e.target.value);
                  if (e.target.value) {
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
              {passwordStrength && password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{t('common.passwordStrength')}</span>
                    <Badge
                      variant={
                        passwordStrength.strength === "strong"
                          ? "default"
                          : passwordStrength.strength === "medium"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {passwordStrength.strength.replace("_", " ").toUpperCase()}
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
            <Input
              type="password"
              placeholder={t('auth.confirmNewPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? t('auth.updatingPassword') : t('auth.updatePasswordBtn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
