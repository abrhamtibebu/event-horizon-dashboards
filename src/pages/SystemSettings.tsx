import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  RefreshCw,
  Server,
  Mail,
  Shield,
  Database,
  Globe,
  Bell,
  Lock,
  Users,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DashboardCard } from '@/components/DashboardCard'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface SystemSettings {
  general: {
    site_name: string
    site_description: string
    site_url: string
    timezone: string
    language: string
    maintenance_mode: boolean
  }
  email: {
    smtp_host: string
    smtp_port: number
    smtp_username: string
    smtp_password: string
    smtp_encryption: 'tls' | 'ssl' | 'none'
    from_email: string
    from_name: string
  }
  security: {
    password_min_length: number
    password_require_uppercase: boolean
    password_require_lowercase: boolean
    password_require_numbers: boolean
    password_require_symbols: boolean
    session_timeout: number
    max_login_attempts: number
    two_factor_enabled: boolean
  }
  notifications: {
    email_notifications: boolean
    sms_notifications: boolean
    push_notifications: boolean
    admin_email: string
  }
  storage: {
    max_file_size: number
    allowed_file_types: string[]
    storage_driver: 'local' | 's3' | 'azure'
  }
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/settings')
      setSettings(response.data)
    } catch (err: any) {
      console.error('Failed to fetch settings:', err)
      // Use default settings for development
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultSettings = (): SystemSettings => ({
    general: {
      site_name: 'Evella Event Management',
      site_description: 'Professional event management platform',
      site_url: 'https://evella.com',
      timezone: 'Africa/Addis_Ababa',
      language: 'en',
      maintenance_mode: false,
    },
    email: {
      smtp_host: 'smtp.gmail.com',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_encryption: 'tls',
      from_email: 'noreply@evella.com',
      from_name: 'Evella',
    },
    security: {
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      session_timeout: 120,
      max_login_attempts: 5,
      two_factor_enabled: false,
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      admin_email: 'admin@evella.com',
    },
    storage: {
      max_file_size: 5242880, // 5MB
      allowed_file_types: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
      storage_driver: 'local',
    },
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return

    try {
      setSaving(true)
      await api.put('/admin/settings', settings)
      toast.success('Settings saved successfully')
      setHasChanges(false)
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.response?.data?.message || err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSettingChange = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value,
      },
    })
    setHasChanges(true)
  }

  const handleTestEmail = async () => {
    try {
      await api.post('/admin/settings/test-email')
      toast.success('Test email sent successfully')
    } catch (err: any) {
      toast.error(`Failed to send test email: ${err.response?.data?.message || err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading settings..." />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="min-h-screen bg-transparent p-1 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80">
              System Configuration
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure system-wide settings and preferences.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <Button variant="outline" onClick={fetchSettings} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </motion.div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <Database className="w-4 h-4" />
            Storage
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <DashboardCard title="General Settings">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.general.site_name}
                    onChange={(e) => handleSettingChange('general', 'site_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_url">Site URL</Label>
                  <Input
                    id="site_url"
                    value={settings.general.site_url}
                    onChange={(e) => handleSettingChange('general', 'site_url', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.general.site_description}
                  onChange={(e) => handleSettingChange('general', 'site_description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Addis_Ababa">Africa/Addis_Ababa (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) => handleSettingChange('general', 'language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="am">አማርኛ</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable to put the site in maintenance mode
                  </p>
                </div>
                <Switch
                  id="maintenance_mode"
                  checked={settings.general.maintenance_mode}
                  onCheckedChange={(checked) =>
                    handleSettingChange('general', 'maintenance_mode', checked)
                  }
                />
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <DashboardCard title="Email Configuration">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.email.smtp_host}
                    onChange={(e) => handleSettingChange('email', 'smtp_host', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.email.smtp_port}
                    onChange={(e) => handleSettingChange('email', 'smtp_port', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp_username">SMTP Username</Label>
                  <Input
                    id="smtp_username"
                    value={settings.email.smtp_username}
                    onChange={(e) => handleSettingChange('email', 'smtp_username', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">SMTP Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.email.smtp_password}
                    onChange={(e) => handleSettingChange('email', 'smtp_password', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="smtp_encryption">SMTP Encryption</Label>
                  <Select
                    value={settings.email.smtp_encryption}
                    onValueChange={(value: any) => handleSettingChange('email', 'smtp_encryption', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.email.from_email}
                    onChange={(e) => handleSettingChange('email', 'from_email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={settings.email.from_name}
                  onChange={(e) => handleSettingChange('email', 'from_name', e.target.value)}
                />
              </div>

              <Separator />

              <Button variant="outline" onClick={handleTestEmail} className="gap-2">
                <Mail className="w-4 h-4" />
                Send Test Email
              </Button>
            </div>
          </DashboardCard>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <DashboardCard title="Security Settings">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password_min_length">Minimum Password Length</Label>
                <Input
                  id="password_min_length"
                  type="number"
                  value={settings.security.password_min_length}
                  onChange={(e) =>
                    handleSettingChange('security', 'password_min_length', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_uppercase">Require Uppercase</Label>
                    <p className="text-sm text-muted-foreground">Password must contain uppercase letters</p>
                  </div>
                  <Switch
                    id="password_require_uppercase"
                    checked={settings.security.password_require_uppercase}
                    onCheckedChange={(checked) =>
                      handleSettingChange('security', 'password_require_uppercase', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_lowercase">Require Lowercase</Label>
                    <p className="text-sm text-muted-foreground">Password must contain lowercase letters</p>
                  </div>
                  <Switch
                    id="password_require_lowercase"
                    checked={settings.security.password_require_lowercase}
                    onCheckedChange={(checked) =>
                      handleSettingChange('security', 'password_require_lowercase', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_numbers">Require Numbers</Label>
                    <p className="text-sm text-muted-foreground">Password must contain numbers</p>
                  </div>
                  <Switch
                    id="password_require_numbers"
                    checked={settings.security.password_require_numbers}
                    onCheckedChange={(checked) =>
                      handleSettingChange('security', 'password_require_numbers', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_symbols">Require Symbols</Label>
                    <p className="text-sm text-muted-foreground">Password must contain special characters</p>
                  </div>
                  <Switch
                    id="password_require_symbols"
                    checked={settings.security.password_require_symbols}
                    onCheckedChange={(checked) =>
                      handleSettingChange('security', 'password_require_symbols', checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) =>
                      handleSettingChange('security', 'session_timeout', parseInt(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) =>
                      handleSettingChange('security', 'max_login_attempts', parseInt(e.target.value))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="two_factor_enabled">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Enable 2FA for all users</p>
                </div>
                <Switch
                  id="two_factor_enabled"
                  checked={settings.security.two_factor_enabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange('security', 'two_factor_enabled', checked)
                  }
                />
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <DashboardCard title="Notification Settings">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable email notifications</p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange('notifications', 'email_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms_notifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable SMS notifications</p>
                  </div>
                  <Switch
                    id="sms_notifications"
                    checked={settings.notifications.sms_notifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange('notifications', 'sms_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Enable push notifications</p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={settings.notifications.push_notifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange('notifications', 'push_notifications', checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin Email</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={settings.notifications.admin_email}
                  onChange={(e) => handleSettingChange('notifications', 'admin_email', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Email address for system notifications and alerts
                </p>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>

        {/* Storage Settings */}
        <TabsContent value="storage" className="space-y-6">
          <DashboardCard title="Storage Settings">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max_file_size">Max File Size (bytes)</Label>
                <Input
                  id="max_file_size"
                  type="number"
                  value={settings.storage.max_file_size}
                  onChange={(e) =>
                    handleSettingChange('storage', 'max_file_size', parseInt(e.target.value))
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Current: {(settings.storage.max_file_size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storage_driver">Storage Driver</Label>
                <Select
                  value={settings.storage.storage_driver}
                  onValueChange={(value: any) => handleSettingChange('storage', 'storage_driver', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Storage</SelectItem>
                    <SelectItem value="s3">Amazon S3</SelectItem>
                    <SelectItem value="azure">Azure Blob Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed_file_types">Allowed File Types</Label>
                <Input
                  id="allowed_file_types"
                  value={settings.storage.allowed_file_types.join(', ')}
                  onChange={(e) =>
                    handleSettingChange(
                      'storage',
                      'allowed_file_types',
                      e.target.value.split(',').map((t) => t.trim())
                    )
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of allowed file extensions
                </p>
              </div>
            </div>
          </DashboardCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
