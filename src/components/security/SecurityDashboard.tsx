import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Key, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  validatePasswordStrength, 
  clientPasswordValidation,
  checkSecurityConfiguration 
} from '@/utils/securityUtils';

interface SecurityCheckProps {
  onConfigurationUpdate?: () => void;
}

export const SecurityDashboard: React.FC<SecurityCheckProps> = ({ onConfigurationUpdate }) => {
  const [passwordTest, setPasswordTest] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [securityConfig, setSecurityConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check security configuration on component mount
    const config = checkSecurityConfiguration();
    setSecurityConfig(config);
  }, []);

  const handlePasswordCheck = async (password: string) => {
    setPasswordTest(password);
    setLoading(true);
    
    try {
      // Try server-side validation first, fallback to client-side
      const result = await validatePasswordStrength(password);
      setPasswordStrength(result);
    } catch (error) {
      // Fallback to client-side validation
      const result = clientPasswordValidation(password);
      setPasswordStrength(result);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'weak': return 'text-orange-600';
      case 'very_weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStrengthVariant = (strength: string) => {
    switch (strength) {
      case 'strong': return 'default';
      case 'medium': return 'secondary';
      case 'weak': return 'outline';
      case 'very_weak': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Security Configuration Status */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Security Configuration Status
            </h3>
            
            {securityConfig && (
              <div className="space-y-2">
                {securityConfig.secure ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Basic security configuration looks good!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Security issues detected that need attention.
                    </AlertDescription>
                  </Alert>
                )}
                
                {securityConfig.issues?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-600">Critical Issues:</p>
                    {securityConfig.issues.map((issue: string, index: number) => (
                      <p key={index} className="text-sm text-red-600">• {issue}</p>
                    ))}
                  </div>
                )}
                
                {securityConfig.warnings?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-600">Recommendations:</p>
                    {securityConfig.warnings.map((warning: string, index: number) => (
                      <p key={index} className="text-sm text-yellow-600">• {warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Password Strength Tester */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Key className="h-4 w-4" />
              Password Strength Tester
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="password-test">Test Password Strength</Label>
              <div className="relative">
                <Input
                  id="password-test"
                  type={showPassword ? "text" : "password"}
                  value={passwordTest}
                  onChange={(e) => handlePasswordCheck(e.target.value)}
                  placeholder="Enter a password to test its strength"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {passwordStrength && passwordTest && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Password Strength:</span>
                  <Badge variant={getStrengthVariant(passwordStrength.strength)}>
                    {passwordStrength.strength.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Score: {passwordStrength.score}/{passwordStrength.max_score}</span>
                    <span className={getStrengthColor(passwordStrength.strength)}>
                      {Math.round((passwordStrength.score / passwordStrength.max_score) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(passwordStrength.score / passwordStrength.max_score) * 100}
                    className="h-2"
                  />
                </div>

                {passwordStrength.issues?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Recommendations:</p>
                    {passwordStrength.issues.map((issue: string, index: number) => (
                      <p key={index} className="text-sm text-muted-foreground">• {issue}</p>
                    ))}
                  </div>
                )}

                {passwordStrength.valid ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      This password meets security requirements!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This password does not meet minimum security requirements.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Manual Configuration Requirements */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Required Manual Configuration
            </h3>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Critical: The following must be configured in your Supabase dashboard:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• <strong>Enable Leaked Password Protection</strong> in Authentication → Settings</li>
                    <li>• <strong>Reduce OTP Expiry</strong> to 10 minutes or less in Authentication → Settings</li>
                    <li>• <strong>Configure Site URL and Redirect URLs</strong> in Authentication → URL Configuration</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Password Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Enable leaked password protection to prevent users from using compromised passwords.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="w-full"
                  >
                    <a 
                      href="https://supabase.com/dashboard/project/ljxwljvodiwtmkiseukb/auth/providers" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Configure Password Settings
                    </a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">OTP Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Reduce OTP expiry time to minimize security risks from delayed email delivery.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    asChild
                    className="w-full"
                  >
                    <a 
                      href="https://supabase.com/dashboard/project/ljxwljvodiwtmkiseukb/auth/providers" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Configure OTP Settings
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;