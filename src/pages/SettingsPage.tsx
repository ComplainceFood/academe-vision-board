import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, User, Bell, Shield, Camera, Key, LogOut, Trash2, Download, Link, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { NotificationSystem } from "@/components/notifications/NotificationSystem";
import { EnhancedDataExportImport } from "@/components/common/EnhancedDataExportImport";
import SecurityDashboard from "@/components/security/SecurityDashboard";
import { SecurityScanner } from "@/components/admin/SecurityScanner";
import { SecurityStatus } from "@/components/security/SecurityStatus";
import { OutlookIntegrationConsolidated } from "@/components/planning/OutlookIntegrationConsolidated";

const SettingsPage = () => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
        email: email,
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

  const handleEmailChange = (value: string) => {
    setEmail(value);
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
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

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

  const handleAccountDeletion = async () => {
    try {
      // Sign out and clean up auth state
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Notify user about manual deletion process
      toast({
        title: "Account deletion initiated",
        description: "You have been signed out. For complete account deletion, please contact support.",
        variant: "destructive",
      });
      
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error during account deletion process:", error);
      toast({
        title: "Error",
        description: "Failed to process account deletion request",
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
      <div className="animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security & Data
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="your.email@example.com"
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
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSystem />
          </TabsContent>

          <TabsContent value="connections" className="space-y-6">
            <OutlookIntegrationConsolidated />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Security Status Overview */}
            <SecurityStatus />
            
            {/* Security Scanner (Admin Only) */}
            <SecurityScanner />
            
            {/* Security Dashboard */}
            <SecurityDashboard />
            
            {/* Data Export/Import Section */}
            <EnhancedDataExportImport />
            
            {/* Password & Security Section */}
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Change Password
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                    disabled={!newPassword || !confirmPassword}
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
                      <h5 className="font-medium mb-2">Delete Account</h5>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove all your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAccountDeletion}>
                              Delete Account
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
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;