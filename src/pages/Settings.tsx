import { useState } from 'react'
import { Lock, Bell, Globe, Eye, EyeOff, Save, Shield, Mail, Smartphone } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { SpinnerInline } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useModernAlerts } from '@/hooks/useModernAlerts'
import { useTheme } from 'next-themes'
import api from '@/lib/api'

export default function Settings() {
  const { user } = useAuth()
  const { showSuccess, showError } = useModernAlerts()
  const { theme, setTheme } = useTheme()

  // Password Change State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    event_updates: true,
    message_notifications: true,
    marketing_emails: false,
  })

  // General Preferences (excluding theme, which is handled by next-themes)
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
  })

  const handlePasswordChange = async () => {
    // Validate
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      showError('Please fill in all password fields')
      return
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      showError('New passwords do not match')
      return
    }

    if (passwordData.new_password.length < 8) {
      showError('New password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      await api.put('/user/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.confirm_password,
      })

      showSuccess('Password changed successfully!')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
    } catch (error: any) {
      showError(error.response?.data?.error || error.response?.data?.message || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value }
    setNotifications(newNotifications)

    try {
      await api.put('/user/notification-preferences', newNotifications)
      showSuccess('Notification preferences updated!')
    } catch (error) {
      showError('Failed to update notification preferences')
      // Revert on error
      setNotifications(notifications)
    }
  }

  const handlePreferenceChange = async (key: keyof typeof preferences, value: string) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    try {
      await api.put('/user/preferences', newPreferences)
      showSuccess('Preferences updated!')
    } catch (error) {
      showError('Failed to update preferences')
      // Revert on error
      setPreferences(preferences)
    }
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    showSuccess('Theme updated!')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Settings', href: '/dashboard/settings' }
        ]}
        className="mb-4"
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Security Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-info" />
            Security
          </CardTitle>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current_password">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="current_password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                className="pl-10 pr-10"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="new_password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="new_password"
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                className="pl-10 pr-10"
                placeholder="Enter new password (min 8 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirm_password">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                className="pl-10 pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
            className="bg-brand-gradient"
          >
            {isChangingPassword ? (
              <>
                <SpinnerInline className="mr-2" />
                Changing Password...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Change Password
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-warning" />
            Notifications
          </CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email_notifications" className="cursor-pointer">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email_notifications"
              checked={notifications.email_notifications}
              onCheckedChange={(checked) => handleNotificationChange('email_notifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push_notifications" className="cursor-pointer">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
              </div>
            </div>
            <Switch
              id="push_notifications"
              checked={notifications.push_notifications}
              onCheckedChange={(checked) => handleNotificationChange('push_notifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="event_updates" className="cursor-pointer">Event Updates</Label>
                <p className="text-sm text-muted-foreground">Get notified about event changes</p>
              </div>
            </div>
            <Switch
              id="event_updates"
              checked={notifications.event_updates}
              onCheckedChange={(checked) => handleNotificationChange('event_updates', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="message_notifications" className="cursor-pointer">Message Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
              </div>
            </div>
            <Switch
              id="message_notifications"
              checked={notifications.message_notifications}
              onCheckedChange={(checked) => handleNotificationChange('message_notifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="marketing_emails" className="cursor-pointer">Marketing Emails</Label>
                <p className="text-sm text-muted-foreground">Receive promotional and marketing emails</p>
              </div>
            </div>
            <Switch
              id="marketing_emails"
              checked={notifications.marketing_emails}
              onCheckedChange={(checked) => handleNotificationChange('marketing_emails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* General Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-info" />
            General Preferences
          </CardTitle>
          <CardDescription>Customize your app experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange('language', value)}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={preferences.timezone} onValueChange={(value) => handlePreferenceChange('timezone', value)}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme || 'system'} onValueChange={handleThemeChange}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
