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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { cn } from '@/lib/utils'

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
    <div className="container mx-auto p-4 md:p-6 pb-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              System Configuration
            </span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure system-wide assets, SMTP details, and parameters.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 shrink-0"
        >
          <Button variant="outline" onClick={fetchSettings} className="rounded-2xl h-12 px-5 font-semibold gap-2 border-muted-foreground/20">
            <RefreshCw className="w-4 h-4" />
            Reset Defaults
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving} className="rounded-2xl h-12 px-6 font-semibold gap-2 shadow-lg shadow-primary/20">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </motion.div>
      </div>

      {/* Settings Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto p-1.5 bg-muted rounded-2xl border border-border gap-1.5">
          <TabsTrigger value="general" className="gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300">
            <Globe className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300">
            <Bell className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300 col-span-2 sm:col-span-1">
            <Database className="w-4 h-4" />
            Storage
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="focus-visible:outline-none">
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                General System Profile
              </CardTitle>
              <CardDescription>Setup metadata details and site status options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="site_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.general.site_name}
                    onChange={(e) => handleSettingChange('general', 'site_name', e.target.value)}
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="site_url" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Site URL</Label>
                  <Input
                    id="site_url"
                    value={settings.general.site_url}
                    onChange={(e) => handleSettingChange('general', 'site_url', e.target.value)}
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="site_description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.general.site_description}
                  onChange={(e) => handleSettingChange('general', 'site_description', e.target.value)}
                  rows={4}
                  className="rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 resize-none p-4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="timezone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-muted-foreground/20 focus:ring-primary/25 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-black/5">
                      <SelectItem value="Africa/Addis_Ababa">Africa/Addis_Ababa (EAT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="language" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Language</Label>
                  <Select
                    value={settings.general.language}
                    onValueChange={(value) => handleSettingChange('general', 'language', value)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-muted-foreground/20 focus:ring-primary/25 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-black/5">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="am">አማርኛ</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/30">
                <div className="space-y-1">
                  <Label htmlFor="maintenance_mode" className="text-sm font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    Maintenance Mode
                  </Label>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Restricts site registration and ticketing flows to admin-only accesses when enabled.
                  </p>
                </div>
                <Switch
                  id="maintenance_mode"
                  checked={settings.general.maintenance_mode}
                  onCheckedChange={(checked) =>
                    handleSettingChange('general', 'maintenance_mode', checked)
                  }
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="focus-visible:outline-none">
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                SMTP Mail Server Configuration
              </CardTitle>
              <CardDescription>Setup servers for system notifications and order confirmations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp_host" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">SMTP Host</Label>
                  <Input
                    id="smtp_host"
                    value={settings.email.smtp_host}
                    onChange={(e) => handleSettingChange('email', 'smtp_host', e.target.value)}
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp_port" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">SMTP Port</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.email.smtp_port}
                    onChange={(e) => handleSettingChange('email', 'smtp_port', parseInt(e.target.value))}
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp_username" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">SMTP Username</Label>
                  <Input
                    id="smtp_username"
                    value={settings.email.smtp_username}
                    onChange={(e) => handleSettingChange('email', 'smtp_username', e.target.value)}
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp_password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">SMTP Password</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.email.smtp_password}
                    onChange={(e) => handleSettingChange('email', 'smtp_password', e.target.value)}
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp_encryption" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">SMTP Encryption</Label>
                  <Select
                    value={settings.email.smtp_encryption}
                    onValueChange={(value: any) => handleSettingChange('email', 'smtp_encryption', value)}
                  >
                    <SelectTrigger className="h-12 rounded-2xl border-muted-foreground/20 focus:ring-primary/25 px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-black/5">
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="from_email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">From Email Address</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.email.from_email}
                    onChange={(e) => handleSettingChange('email', 'from_email', e.target.value)}
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="from_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">From Name</Label>
                <Input
                  id="from_name"
                  value={settings.email.from_name}
                  onChange={(e) => handleSettingChange('email', 'from_name', e.target.value)}
                  className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                />
              </div>

              <Separator className="bg-border/40" />

              <div className="flex justify-start">
                <Button variant="outline" onClick={handleTestEmail} className="rounded-2xl h-11 px-5 font-semibold gap-2 border-muted-foreground/20">
                  <Mail className="w-4 h-4 text-primary" />
                  Send Test Connection Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="focus-visible:outline-none">
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security & Authentication Parameters
              </CardTitle>
              <CardDescription>Setup minimum passwords lengths, 2FA, and login protections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              <div className="space-y-1.5">
                <Label htmlFor="password_min_length" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Minimum Password Length</Label>
                <Input
                  id="password_min_length"
                  type="number"
                  value={settings.security.password_min_length}
                  onChange={(e) =>
                    handleSettingChange('security', 'password_min_length', parseInt(e.target.value))
                  }
                  className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                />
              </div>

              <div className="space-y-4 rounded-2xl border p-4 bg-muted/10 border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Password Criteria</span>
                
                <div className="flex items-center justify-between py-1 border-b border-border/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_uppercase" className="text-sm font-semibold">Require Uppercase</Label>
                    <p className="text-xs text-muted-foreground">Passwords must contain capital letters</p>
                  </div>
                  <Switch
                    id="password_require_uppercase"
                    checked={settings.security.password_require_uppercase}
                    onCheckedChange={(checked) =>
                      handleSettingChange('security', 'password_require_uppercase', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_lowercase" className="text-sm font-semibold">Require Lowercase</Label>
                    <p className="text-xs text-muted-foreground">Passwords must contain small letters</p>
                  </div>
                  <Switch
                    id="password_require_lowercase"
                    checked={settings.security.password_require_lowercase}
                    onCheckedChange={(checked) =>
                      handleSettingChange('security', 'password_require_lowercase', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_numbers" className="text-sm font-semibold">Require Numbers</Label>
                    <p className="text-xs text-muted-foreground">Passwords must contain integers</p>
                  </div>
                  <Switch
                    id="password_require_numbers"
                    checked={settings.security.password_require_numbers}
                    onCheckedChange={(checked) =>
                      handleSettingChange('security', 'password_require_numbers', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label htmlFor="password_require_symbols" className="text-sm font-semibold">Require Symbols</Label>
                    <p className="text-xs text-muted-foreground">Passwords must contain special symbols (@, #, etc)</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label htmlFor="session_timeout" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.security.session_timeout}
                    onChange={(e) =>
                      handleSettingChange('security', 'session_timeout', parseInt(e.target.value))
                    }
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max_login_attempts" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Max Login Attempts</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) =>
                      handleSettingChange('security', 'max_login_attempts', parseInt(e.target.value))
                    }
                    className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                  />
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/30">
                <div className="space-y-1">
                  <Label htmlFor="two_factor_enabled" className="text-sm font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    Two-Factor Authentication (2FA)
                  </Label>
                  <p className="text-xs text-muted-foreground max-w-md">
                    Require absolute verification via email or mobile codes on login.
                  </p>
                </div>
                <Switch
                  id="two_factor_enabled"
                  checked={settings.security.two_factor_enabled}
                  onCheckedChange={(checked) =>
                    handleSettingChange('security', 'two_factor_enabled', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="focus-visible:outline-none">
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                System Alerts & Notices
              </CardTitle>
              <CardDescription>Setup direct alert methods and primary email receivers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              <div className="space-y-4 rounded-2xl border p-4 bg-muted/10 border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Dispatch Channels</span>
                
                <div className="flex items-center justify-between py-1 border-b border-border/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="email_notifications" className="text-sm font-semibold">Email Alerts</Label>
                    <p className="text-xs text-muted-foreground">Send system updates through outgoing emails</p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={settings.notifications.email_notifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange('notifications', 'email_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms_notifications" className="text-sm font-semibold">SMS Alerts</Label>
                    <p className="text-xs text-muted-foreground">Send verification messages through SMS gateways</p>
                  </div>
                  <Switch
                    id="sms_notifications"
                    checked={settings.notifications.sms_notifications}
                    onCheckedChange={(checked) =>
                      handleSettingChange('notifications', 'sms_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label htmlFor="push_notifications" className="text-sm font-semibold">Web Push Alerts</Label>
                    <p className="text-xs text-muted-foreground">Deliver browser notification card popups</p>
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

              <Separator className="bg-border/40" />

              <div className="space-y-1.5">
                <Label htmlFor="admin_email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">System Master Admin Email</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={settings.notifications.admin_email}
                  onChange={(e) => handleSettingChange('notifications', 'admin_email', e.target.value)}
                  className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                />
                <p className="text-[10.5px] text-muted-foreground ml-1">
                  Receives high-level application critical logs, ticket failures, and payouts requests warnings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Settings */}
        <TabsContent value="storage" className="focus-visible:outline-none">
          <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Asset & Media Storage Limits
              </CardTitle>
              <CardDescription>Setup size bounds, file types, and hosting cloud locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              <div className="space-y-1.5">
                <Label htmlFor="max_file_size" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Max File Upload Size (bytes)</Label>
                <Input
                  id="max_file_size"
                  type="number"
                  value={settings.storage.max_file_size}
                  onChange={(e) =>
                    handleSettingChange('storage', 'max_file_size', parseInt(e.target.value))
                  }
                  className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                />
                <p className="text-[11px] text-muted-foreground ml-1">
                  Current size: <strong className="text-foreground font-semibold">{(settings.storage.max_file_size / 1024 / 1024).toFixed(2)} MB</strong> limit per upload.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="storage_driver" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Storage Driver Location</Label>
                <Select
                  value={settings.storage.storage_driver}
                  onValueChange={(value: any) => handleSettingChange('storage', 'storage_driver', value)}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-muted-foreground/20 focus:ring-primary/25 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-black/5">
                    <SelectItem value="local">Local Storage Disk</SelectItem>
                    <SelectItem value="s3">Amazon Web Services S3</SelectItem>
                    <SelectItem value="azure">Microsoft Azure Cloud Containers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allowed_file_types" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Allowed File Extensions</Label>
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
                  className="h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                />
                <p className="text-[10.5px] text-muted-foreground ml-1">
                  Provide extensions as a simple comma-separated list (e.g. png, jpg, pdf, doc).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
