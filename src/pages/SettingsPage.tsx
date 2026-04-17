import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/MainLayout";
import { PageGuide } from "@/components/common/PageGuide";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, User, Bell, Shield, Camera, Key, Trash2, Link, Save, Database, Mail, CreditCard, Star, CheckCircle2, Zap, Sun, Moon, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
import { EnhancedDataExportImport } from "@/components/common/EnhancedDataExportImport";
import { OutlookIntegrationConsolidated } from "@/components/planning/OutlookIntegrationConsolidated";
import { GoogleCalendarIntegration } from "@/components/planning/GoogleCalendarIntegration";
import { ProGate } from "@/components/common/ProGate";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { Globe, HelpCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { resetOnboarding } from "@/components/common/OnboardingModal";

const PRO_FEATURES = [
  "AI CV Import & Biosketch Generator",
  "Resume / CV Export (DOCX & PDF)",
  "ORCID Integration & Citation Metrics",
  "AI Analytics Insights",
  "Google & Outlook Calendar Sync",
  "AI Grant Narrative Writer",
  "AI Meeting Agenda & Summarizer",
  "AI Task Draft",
  "AI Supply Analysis",
  "Advanced Data Export / Import",
];

interface StripePriceInfo {
  id: string;
  unit_amount: number | null;
  currency: string;
  interval: string;
}

interface PricesData {
  monthly: StripePriceInfo;
  annual: StripePriceInfo;
}

function formatPrice(amount: number | null, currency: string): string {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}

const SettingsPage = () => {
  const { t } = useTranslation();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
  const [prices, setPrices] = useState<PricesData | null>(null);
  const [pricesLoading, setPricesLoading] = useState(true);
  const { subscription, isPro, isTrial } = useSubscription();
  const { theme, setTheme } = useTheme();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const { user } = useAuth();
  const { profile, loading: isLoading, updateProfile } = useProfile();
  const { toast } = useToast();

  // Form fields
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [bio, setBio] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setEmail(profile.email || user?.email || "");
      setPhone(profile.phone || "");
      setDepartment(profile.department || "");
      setPosition(profile.position || "");
      setBio(profile.bio || "");
      setOfficeLocation(profile.office_location || "");
    } else if (user && !isLoading) {
      // Set default values if no profile exists yet
      setEmail(user.email || "");
      setDisplayName(user.email?.split('@')[0] || "");
    }
  }, [profile, user, isLoading]);

  // Fetch live prices directly from Stripe via the get-prices edge function.
  // No amounts are hardcoded - always pulled from Stripe so price changes and
  // promotions are reflected automatically without touching the frontend.
  useEffect(() => {
    setPricesLoading(true);
    supabase.functions.invoke("get-prices")
      .then(({ data, error }) => {
        if (error || !data) return;
        // Only set if we got real data back
        if (data.monthly?.id || data.annual?.id) {
          setPrices(data as PricesData);
        }
      })
      .catch(() => {/* prices stay null, UI shows loading state */})
      .finally(() => setPricesLoading(false));
  }, []);

  // Handle upgrading to Pro via Stripe Checkout
  const handleUpgradeToPro = async (interval: "monthly" | "annual" = billingInterval) => {
    setLoadingCheckout(true);
    const priceId = interval === "annual" ? prices?.annual?.id : prices?.monthly?.id;
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          successUrl: `${window.location.origin}/settings?tab=subscription&upgraded=1`,
          priceId: priceId || undefined,
        },
      });
      if (error || !data?.url) throw error ?? new Error("No checkout URL returned");
      window.location.href = data.url;
    } catch (err) {
      toast({ title: "Could not start checkout", description: String(err), variant: "destructive" });
      setLoadingCheckout(false);
    }
  };

  // Handle opening Stripe Customer Portal
  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session");
      if (error || !data?.url) throw error ?? new Error("No portal URL returned");
      window.location.href = data.url;
    } catch (err) {
      toast({ title: "Could not open billing portal", description: String(err), variant: "destructive" });
      setLoadingPortal(false);
    }
  };

  // Show success toast when returning from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      toast({ title: "Welcome to Pro!", description: "Your subscription is now active. Enjoy all Pro features." });
      // Remove query param without a reload
      window.history.replaceState({}, "", window.location.pathname + "?tab=subscription");
    }
  }, [toast]);

  // Mark form as having unsaved changes
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  // Handle saving profile changes
  const handleSaveProfile = async () => {
    if (!user || !hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        department: department,
        position: position,
        bio: bio,
        office_location: officeLocation,
      });
      
      setHasUnsavedChanges(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Form change handlers
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    markAsChanged();
  };

  const handleFirstNameChange = (value: string) => {
    setFirstName(value);
    markAsChanged();
  };

  const handleLastNameChange = (value: string) => {
    setLastName(value);
    markAsChanged();
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    markAsChanged();
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    markAsChanged();
  };

  const handlePositionChange = (value: string) => {
    setPosition(value);
    markAsChanged();
  };

  const handleBioChange = (value: string) => {
    setBio(value);
    markAsChanged();
  };

  const handleOfficeLocationChange = (value: string) => {
    setOfficeLocation(value);
    markAsChanged();
  };


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image smaller than 1MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: data.publicUrl });
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword) {
      toast({
        title: "Current password required",
        description: "Please enter your current password to proceed",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "Incorrect password",
          description: "Your current password is incorrect",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail || newEmail === (user?.email ?? "")) {
      toast({
        title: "No change",
        description: "Please enter a different email address",
        variant: "destructive",
      });
      return;
    }

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast({
        title: "Confirmation email sent",
        description: "Check your new email address to confirm the change",
      });
      setNewEmail("");
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive",
      });
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      // We cannot delete the auth user from the client side (requires service role key).
      // Sign the user out and instruct them to contact support for full deletion.
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error signing out during deletion request:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
        <PageGuide page="settings" />
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-primary p-5 sm:p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
                <Settings className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Settings</h1>
                <p className="text-primary-foreground/80 text-sm sm:text-lg mt-1">Manage your account settings and preferences</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="p-1.5 bg-muted/70 backdrop-blur-sm rounded-xl grid w-full grid-cols-4 sm:grid-cols-8">
            <TabsTrigger value="profile" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Connections</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{t('settings.language')}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profile Information
                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <span className="text-sm text-muted-foreground">Unsaved changes</span>
                    )}
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={!hasUnsavedChanges || saving}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Update your personal information and how others see you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                      aria-label="Upload avatar image"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Camera className="h-4 w-4" />
                      {uploadingAvatar ? "Uploading..." : "Change Avatar"}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => handleDisplayNameChange(e.target.value)}
                      placeholder="How you'd like to be addressed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-xs text-muted-foreground">(change in Security tab)</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email ?? email}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => handleFirstNameChange(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => handleLastNameChange(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={position}
                      onChange={(e) => handlePositionChange(e.target.value)}
                      placeholder="Assistant Professor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      placeholder="Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="officeLocation">Office Location</Label>
                    <Input
                      id="officeLocation"
                      value={officeLocation}
                      onChange={(e) => handleOfficeLocationChange(e.target.value)}
                      placeholder="Building A, Room 123"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => handleBioChange(e.target.value)}
                    placeholder="Tell us a bit about yourself..."
                    rows={4}
                  />
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Getting Started Tour
                </CardTitle>
                <CardDescription>Replay the onboarding walkthrough to revisit key features.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => { resetOnboarding(); window.location.reload(); }}
                >
                  Replay Tour
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSystem />
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <ProGate featureKey="planning_google_sync" featureLabel="Google Calendar Integration">
              <GoogleCalendarIntegration />
            </ProGate>
            <ProGate featureKey="planning_outlook_sync" featureLabel="Outlook Calendar Integration">
              <OutlookIntegrationConsolidated />
            </ProGate>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <ProGate featureKey="data_export_import" featureLabel="Advanced Data Export / Import">
              <EnhancedDataExportImport />
            </ProGate>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Password & Security Section */}
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Manage your account credentials and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Email */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Change Email
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Current email: <span className="font-medium text-foreground">{user?.email}</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="New email address"
                    />
                    <Button
                      onClick={handleEmailUpdate}
                      disabled={updatingEmail || !newEmail}
                      variant="outline"
                      className="shrink-0"
                    >
                      {updatingEmail ? "Sending..." : "Update Email"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A confirmation link will be sent to your new email address.
                  </p>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Change Password
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="New password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                    variant="outline"
                  >
                    Update Password
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-destructive flex items-center gap-2 mb-4">
                    <Trash2 className="h-4 w-4" />
                    Danger Zone
                  </h4>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-destructive/20 p-4">
                      <h5 className="font-medium mb-2">Request Account Deletion</h5>
                      <p className="text-sm text-muted-foreground mb-4">
                        This will sign you out and submit a deletion request. Our team will permanently remove your account and all associated data within 30 days. This action cannot be undone.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Request Deletion
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Request account deletion?</AlertDialogTitle>
                            <AlertDialogDescription>
                              You will be signed out immediately. Our support team will permanently delete your account and all data within 30 days. You can cancel this request by contacting support before then.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAccountDeletion}>
                              Yes, request deletion
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* ── Subscription Tab ─────────────────────────────────────── */}
          <TabsContent value="subscription" className="space-y-6">
            {/* Current plan card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your active subscription and billing details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {isPro ? (
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                        <Star className="h-5 w-5" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg capitalize">{subscription.tier} Plan</span>
                        {isTrial && <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">Trial</Badge>}
                        {subscription.status === "suspended" && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                        {isPro && !isTrial && <Badge className="text-xs bg-amber-500 hover:bg-amber-600">Pro</Badge>}
                      </div>
                      {subscription.expires_at && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {isTrial ? "Trial ends" : isPro ? "Renews" : "Expired"}:{" "}
                          {new Date(subscription.expires_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      )}
                      {!subscription.expires_at && !isPro && (
                        <p className="text-sm text-muted-foreground mt-0.5">No active subscription</p>
                      )}
                    </div>
                  </div>
                  {isPro ? (
                    <Button variant="outline" onClick={handleManageBilling} disabled={loadingPortal}>
                      {loadingPortal ? "Opening..." : "Manage Billing"}
                    </Button>
                  ) : (
                    <Button onClick={() => handleUpgradeToPro(billingInterval)} disabled={loadingCheckout} className="bg-amber-500 hover:bg-amber-600 text-white">
                      {loadingCheckout ? "Loading..." : `Upgrade to Pro · ${billingInterval === "annual" ? "Annual" : "Monthly"}`}
                    </Button>
                  )}
                </div>

                {/* Billing interval toggle - shown inside card so it's clearly linked to the upgrade button */}
                {!isPro && (
                  <div className="flex items-center justify-center gap-3 py-1">
                    <span className={`text-sm font-medium ${billingInterval === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={billingInterval === "annual" ? "true" : "false"}
                      aria-label="Toggle billing interval between monthly and annual"
                      onClick={() => setBillingInterval(b => b === "monthly" ? "annual" : "monthly")}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${billingInterval === "annual" ? "bg-amber-500" : "bg-muted-foreground/30"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${billingInterval === "annual" ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className={`text-sm font-medium ${billingInterval === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
                      Annual
                      {prices?.annual?.unit_amount && prices?.monthly?.unit_amount && (
                        <span className="ml-1.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold">
                          Save {Math.round((1 - (prices.annual.unit_amount / 12) / prices.monthly.unit_amount) * 100)}%
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {subscription.stripe_subscription_id && (
                  <p className="text-xs text-muted-foreground">
                    Subscription ID: {subscription.stripe_subscription_id}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Plan comparison */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Free */}
              <Card className={!isPro ? "border-primary ring-1 ring-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Free</CardTitle>
                    {!isPro && <Badge variant="outline" className="text-xs">Current</Badge>}
                  </div>
                  <CardDescription className="text-2xl font-bold text-foreground">
                    $0 <span className="text-sm font-normal text-muted-foreground">/ month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {["Goals & semester planning", "Funding tracker", "Meeting notes", "Supply inventory", "Basic analytics"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pro */}
              <Card className={`relative overflow-hidden ${isPro ? "border-amber-400 ring-1 ring-amber-400" : ""}`}>
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  {isPro ? "Active" : "Recommended"}
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-base">Pro</CardTitle>
                    {isPro && <Badge className="text-xs bg-amber-500 hover:bg-amber-600">Current</Badge>}
                  </div>
                  {/* Dynamic price pulled live from Stripe - never hardcoded */}
                  {pricesLoading ? (
                    <div className="h-8 w-28 bg-muted animate-pulse rounded mt-1" />
                  ) : billingInterval === "annual" ? (
                    <div>
                      <CardDescription className="text-2xl font-bold text-foreground">
                        {prices?.annual?.unit_amount != null
                          ? formatPrice(prices.annual.unit_amount, prices.annual.currency)
                          : "-"}
                        <span className="text-sm font-normal text-muted-foreground"> / year</span>
                      </CardDescription>
                      {prices?.annual?.unit_amount != null && prices?.monthly?.unit_amount != null && (
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                          {formatPrice(Math.round(prices.annual.unit_amount / 12), prices.annual.currency)}/mo
                          {" - "}saves {formatPrice(prices.monthly.unit_amount * 12 - prices.annual.unit_amount, prices.annual.currency)}/yr
                        </p>
                      )}
                    </div>
                  ) : (
                    <CardDescription className="text-2xl font-bold text-foreground">
                      {prices?.monthly?.unit_amount != null
                        ? formatPrice(prices.monthly.unit_amount, prices.monthly.currency)
                        : "-"}
                      <span className="text-sm font-normal text-muted-foreground"> / month</span>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Everything in Free, plus:</p>
                  {PRO_FEATURES.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                  {!isPro && (
                    <Button
                      className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={() => handleUpgradeToPro(billingInterval)}
                      disabled={loadingCheckout}
                    >
                      {loadingCheckout ? "Loading..." : `Start 14-day Free Trial · ${billingInterval === "annual" ? "Annual" : "Monthly"}`}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="language" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('settings.language')}
                </CardTitle>
                <CardDescription>{t('settings.selectLanguage')}</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageSwitcher showLabel={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize how Smart-Prof looks on your device.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: "light", label: "Light", icon: Sun },
                      { value: "dark",  label: "Dark",  icon: Moon },
                      { value: "system", label: "System", icon: Monitor },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTheme(value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-sm font-medium ${theme === value ? "text-primary" : "text-muted-foreground"}`}>
                          {label}
                        </span>
                        {theme === value && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {theme === "system"
                      ? "Automatically matches your device's dark/light mode preference."
                      : theme === "dark"
                      ? "Dark mode is active — easier on the eyes in low-light environments."
                      : "Light mode is active."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;