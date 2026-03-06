import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import BillingSection from '@/components/BillingSection';
import {
  User,
  Bell,
  Shield,
  Palette,
  Mail,
  Phone,
  CreditCard,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [notifications, setNotifications] = useState({
    email_tasks: true,
    email_updates: true,
    sms_urgent: true,
    sms_assignments: false,
    push_all: true,
  });

  const handleProfileSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Profile updated successfully');
    setLoading(false);
  };

  const handleNotificationsSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Notification preferences saved');
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-[Manrope]">Settings</h2>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5 lg:inline-grid">
          <TabsTrigger value="profile" className="gap-2" data-testid="profile-tab">
            <User className="h-4 w-4 hidden sm:block" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2" data-testid="billing-tab">
            <CreditCard className="h-4 w-4 hidden sm:block" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2" data-testid="notifications-tab">
            <Bell className="h-4 w-4 hidden sm:block" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2" data-testid="security-tab">
            <Shield className="h-4 w-4 hidden sm:block" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2" data-testid="appearance-tab">
            <Palette className="h-4 w-4 hidden sm:block" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="font-[Manrope]">Profile Information</CardTitle>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile.name.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="pl-10"
                      data-testid="profile-name-input"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="pl-10"
                      data-testid="profile-email-input"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="pl-10"
                      placeholder="+1 (555) 123-4567"
                      data-testid="profile-phone-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleProfileSave} 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="save-profile-btn"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <BillingSection />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="font-[Manrope]">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Email Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">Task Assignments</p>
                      <p className="text-sm text-slate-500">Receive email when assigned a new task</p>
                    </div>
                    <Switch
                      checked={notifications.email_tasks}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_tasks: checked })}
                      data-testid="email-tasks-switch"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">System Updates</p>
                      <p className="text-sm text-slate-500">News and feature announcements</p>
                    </div>
                    <Switch
                      checked={notifications.email_updates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email_updates: checked })}
                      data-testid="email-updates-switch"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* SMS Notifications */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">SMS Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">Urgent Tasks</p>
                      <p className="text-sm text-slate-500">SMS for urgent priority tasks</p>
                    </div>
                    <Switch
                      checked={notifications.sms_urgent}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms_urgent: checked })}
                      data-testid="sms-urgent-switch"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-700">Task Assignments</p>
                      <p className="text-sm text-slate-500">SMS when assigned any task</p>
                    </div>
                    <Switch
                      checked={notifications.sms_assignments}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms_assignments: checked })}
                      data-testid="sms-assignments-switch"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Push Notifications */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Push Notifications</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-700">All Notifications</p>
                    <p className="text-sm text-slate-500">Enable browser push notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push_all}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push_all: checked })}
                    data-testid="push-all-switch"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleNotificationsSave}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="save-notifications-btn"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="font-[Manrope]">Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    placeholder="Enter current password"
                    data-testid="current-password-input"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter new password"
                    data-testid="new-password-input"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm new password"
                    data-testid="confirm-password-input"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="change-password-btn">
                  Change Password
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-slate-900 mb-4">Two-Factor Authentication</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-700">2FA Status</p>
                    <p className="text-sm text-slate-500">Add extra security to your account</p>
                  </div>
                  <Button variant="outline" data-testid="setup-2fa-btn">Setup 2FA</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="font-[Manrope]">Appearance</CardTitle>
              <CardDescription>Customize how FieldOps looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Theme</h4>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    className="p-4 border-2 border-blue-600 rounded-lg bg-white text-center"
                    data-testid="theme-light-btn"
                  >
                    <div className="h-12 w-full bg-slate-100 rounded mb-2" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  <button
                    className="p-4 border-2 border-slate-200 rounded-lg bg-white text-center hover:border-blue-300"
                    data-testid="theme-dark-btn"
                  >
                    <div className="h-12 w-full bg-slate-800 rounded mb-2" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                  <button
                    className="p-4 border-2 border-slate-200 rounded-lg bg-white text-center hover:border-blue-300"
                    data-testid="theme-system-btn"
                  >
                    <div className="h-12 w-full bg-gradient-to-r from-slate-100 to-slate-800 rounded mb-2" />
                    <p className="text-sm font-medium">System</p>
                  </button>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-slate-900 mb-4">Density</h4>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-3 border-2 border-slate-200 rounded-lg text-center hover:border-blue-300">
                    <p className="text-sm font-medium">Compact</p>
                  </button>
                  <button className="p-3 border-2 border-blue-600 rounded-lg text-center">
                    <p className="text-sm font-medium">Default</p>
                  </button>
                  <button className="p-3 border-2 border-slate-200 rounded-lg text-center hover:border-blue-300">
                    <p className="text-sm font-medium">Comfortable</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
