import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Eye,
  EyeOff,
  ClipboardList,
} from 'lucide-react'
import { DashboardCard } from '@/components/DashboardCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function Settings() {
  const { user, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ')[1] || '',
        email: user.email,
        phone: user.phone || '',
        bio: user.bio || '',
      })
    }
  }, [user])

  useEffect(() => {
    if (user?.role === 'usher') {
      api.get('/dashboard/usher').then(res => {
        setAssignedTasks(res.data?.assignedEvents || []);
      });
    }
  }, [user]);

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }))
  }

  const handleProfileSave = async () => {
    try {
      const name = `${profileData.firstName} ${profileData.lastName}`
      await api.put('/user/profile', { ...profileData, name })
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile.')
    }
  }

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }
    try {
      await api.put('/user/password', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      })
      toast.success('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      toast.error('Failed to update password.')
    }
  }

  if (authLoading) {
    return <div>Loading settings...</div>
  }

  const tabs = [
    { icon: User, label: 'Profile' },
    { icon: Bell, label: 'Notifications' },
    { icon: Shield, label: 'Security' },
    { icon: Palette, label: 'Appearance' },
  ]
  if (user?.role === 'usher') {
    tabs.push({ icon: ClipboardList, label: 'Assigned Tasks' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <DashboardCard title="Settings Menu">
            <nav className="space-y-2">
              {tabs.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActiveTab(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.label
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-600 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </DashboardCard>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'Profile' && (
            <DashboardCard title="Profile Information">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Photo
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) =>
                        handleProfileChange('firstName', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) =>
                        handleProfileChange('lastName', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      handleProfileChange('email', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      handleProfileChange('phone', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleProfileSave}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Save Changes
                </Button>
              </div>
            </DashboardCard>
          )}

          {activeTab === 'Notifications' && (
            <DashboardCard title="Notification Preferences">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Event Reminders
                      </h4>
                      <p className="text-sm text-gray-500">
                        Get reminded about upcoming events
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        New Messages
                      </h4>
                      <p className="text-sm text-gray-500">
                        Get notified when you receive new messages
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        System Updates
                      </h4>
                      <p className="text-sm text-gray-500">
                        Receive notifications about system updates
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Save Preferences
                </Button>
              </div>
            </DashboardCard>
          )}

          {activeTab === 'Security' && (
            <DashboardCard title="Security & Privacy">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Change Password
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">
                          Current Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              handlePasswordChange(
                                'currentPassword',
                                e.target.value
                              )
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            tabIndex={-1}
                            onClick={() => setShowCurrentPassword((v) => !v)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              handlePasswordChange(
                                'newPassword',
                                e.target.value
                              )
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            tabIndex={-1}
                            onClick={() => setShowNewPassword((v) => !v)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              handlePasswordChange(
                                'confirmPassword',
                                e.target.value
                              )
                            }
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPassword((v) => !v)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-gray-500">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Login Sessions
                      </h4>
                      <p className="text-sm text-gray-500">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Sessions
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handlePasswordSave}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Update Security Settings
                </Button>
              </div>
            </DashboardCard>
          )}

          {activeTab === 'Assigned Tasks' && user?.role === 'usher' && (
            <DashboardCard title="My Assigned Tasks">
              {assignedTasks.length === 0 ? (
                <div className="text-gray-500">No assigned tasks.</div>
              ) : (
                <div className="space-y-4">
                  {assignedTasks.map((event: any) => (
                    <div key={event.id} className="border-b pb-2 mb-2">
                      <div className="font-semibold text-blue-700">{event.name}</div>
                      <div className="text-sm text-gray-600 mb-1">{event.date} at {event.location}</div>
                      <ul className="list-disc ml-6">
                        {(Array.isArray(event.pivot?.tasks) ? event.pivot.tasks : (event.pivot?.tasks ? JSON.parse(event.pivot.tasks) : [])).map((task: string, idx: number) => (
                          <li key={idx}>{task}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          )}
        </div>
      </div>
    </div>
  )
}
