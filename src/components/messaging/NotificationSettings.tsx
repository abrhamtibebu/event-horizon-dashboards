import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX, Bell, BellOff, Settings, TestTube } from 'lucide-react'
import { Button } from '../ui/button'
import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { 
  isSoundEnabled, 
  setSoundEnabled, 
  getSoundVolume, 
  setSoundVolume, 
  testSound,
  playMessageReceived,
  playMessageSent,
  playNotification
} from '../../lib/sounds'

interface NotificationSettingsProps {
  onClose?: () => void
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled())
  const [volume, setVolumeState] = useState(getSoundVolume())
  const [browserNotifications, setBrowserNotifications] = useState(
    Notification.permission === 'granted'
  )
  const [isTestingSound, setIsTestingSound] = useState(false)

  useEffect(() => {
    setSoundEnabledState(isSoundEnabled())
    setVolumeState(getSoundVolume())
  }, [])

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabledState(enabled)
    setSoundEnabled(enabled)
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0]
    setVolumeState(vol)
    setSoundVolume(vol)
  }

  const handleBrowserNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await Notification.requestPermission()
      setBrowserNotifications(permission === 'granted')
    } else {
      setBrowserNotifications(false)
    }
  }

  const testNotificationSound = async () => {
    if (isTestingSound) return
    
    setIsTestingSound(true)
    try {
      await playMessageReceived()
    } catch (error) {
      console.error('Failed to play test sound:', error)
    } finally {
      setTimeout(() => setIsTestingSound(false), 1000)
    }
  }

  const testSentSound = async () => {
    if (isTestingSound) return
    
    setIsTestingSound(true)
    try {
      await playMessageSent()
    } catch (error) {
      console.error('Failed to play test sound:', error)
    } finally {
      setTimeout(() => setIsTestingSound(false), 1000)
    }
  }

  const testGeneralNotification = async () => {
    if (isTestingSound) return
    
    setIsTestingSound(true)
    try {
      await playNotification()
    } catch (error) {
      console.error('Failed to play test sound:', error)
    } finally {
      setTimeout(() => setIsTestingSound(false), 1000)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-gray-600" />
            <CardTitle className="text-lg">Notification Settings</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <span className="sr-only">Close</span>
              ×
            </Button>
          )}
        </div>
        <CardDescription>
          Customize your notification preferences for messages and alerts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Sound Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-green-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-medium">Sound Notifications</span>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          {soundEnabled && (
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Volume</span>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(volume * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Test Sounds</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotificationSound}
                    disabled={isTestingSound}
                    className="text-xs"
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Message Received
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testSentSound}
                    disabled={isTestingSound}
                    className="text-xs"
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    Message Sent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testGeneralNotification}
                    disabled={isTestingSound}
                    className="text-xs"
                  >
                    <TestTube className="w-3 h-3 mr-1" />
                    General Alert
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Browser Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {browserNotifications ? (
                <Bell className="w-4 h-4 text-green-600" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-400" />
              )}
              <span className="font-medium">Browser Notifications</span>
            </div>
            <Switch
              checked={browserNotifications}
              onCheckedChange={handleBrowserNotificationToggle}
            />
          </div>

          {!browserNotifications && (
            <div className="pl-6">
              <p className="text-sm text-gray-500">
                Enable browser notifications to receive alerts when you're not actively using the app.
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-gray-700">Notification Types</span>
          <div className="space-y-2 pl-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">New Messages</span>
              <Badge variant="outline" className="text-xs">
                {soundEnabled ? 'Sound + Visual' : 'Visual Only'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Message Sent Confirmation</span>
              <Badge variant="outline" className="text-xs">
                {soundEnabled ? 'Sound + Visual' : 'Visual Only'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">System Alerts</span>
              <Badge variant="outline" className="text-xs">
                {soundEnabled ? 'Sound + Visual' : 'Visual Only'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${soundEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-gray-600">
              Sound notifications are {soundEnabled ? 'enabled' : 'disabled'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm mt-1">
            <div className={`w-2 h-2 rounded-full ${browserNotifications ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-gray-600">
              Browser notifications are {browserNotifications ? 'enabled' : 'disabled'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
