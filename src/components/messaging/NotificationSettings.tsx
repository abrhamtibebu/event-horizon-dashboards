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
    <Card className="w-full max-w-md mx-auto bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-800 shadow-2xl rounded-2xl overflow-hidden border">
      <CardHeader className="p-6 pb-4 border-b border-gray-50 dark:border-gray-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-gray-900 dark:text-white">Notification Settings</CardTitle>
              <CardDescription className="text-xs font-medium text-gray-500">
                Customize your sound and alert preferences
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Sound Notifications */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                soundEnabled ? "bg-green-50 text-green-600 border border-green-100 dark:bg-green-950/20 dark:border-green-900/30" : "bg-gray-50 text-gray-400 border border-gray-100 dark:bg-gray-900 dark:border-gray-800"
              )}>
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-900 dark:text-white">Sound Notifications</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Audio feedback for system events</span>
              </div>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          {soundEnabled && (
            <div className="space-y-6 pl-12 animate-in slide-in-from-top-2 duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Master Volume</span>
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black px-2 py-0.5 rounded-full">
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

              <div className="h-px bg-gray-50 dark:bg-gray-900" />

              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Feedback</span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotificationSound}
                    disabled={isTestingSound}
                    className="h-9 text-[10px] font-black uppercase tracking-widest border-gray-100 dark:border-gray-800 hover:bg-gray-50 transition-all gap-2"
                  >
                    <TestTube className="w-3 h-3 text-primary" />
                    Reception
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testSentSound}
                    disabled={isTestingSound}
                    className="h-9 text-[10px] font-black uppercase tracking-widest border-gray-100 dark:border-gray-800 hover:bg-gray-50 transition-all gap-2"
                  >
                    <TestTube className="w-3 h-3 text-primary" />
                    Sent Conf.
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-50 dark:bg-gray-900" />

        {/* Browser Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                browserNotifications ? "bg-primary/5 text-primary border border-primary/10" : "bg-gray-50 text-gray-400 border border-gray-100 dark:bg-gray-900 dark:border-gray-800"
              )}>
                {browserNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-900 dark:text-white">Push Notifications</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">System-wide browser alerts</span>
              </div>
            </div>
            <Switch
              checked={browserNotifications}
              onCheckedChange={handleBrowserNotificationToggle}
            />
          </div>

          {!browserNotifications && (
            <div className="pl-12">
              <p className="text-[11px] font-medium text-gray-500 leading-relaxed uppercase tracking-tight">
                Recommended to receive alerts when application is not in foreground.
              </p>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-50 dark:bg-gray-900" />

        {/* Summary / Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Channels</h4>
          <div className="space-y-2">
            {[
              { label: 'Direct Messaging', channel: soundEnabled ? 'Audio + UI' : 'UI Pulse' },
              { label: 'Event Group Chat', channel: soundEnabled ? 'Audio + UI' : 'UI Pulse' },
              { label: 'System Service', channel: browserNotifications ? 'Push Native' : 'In-App Only' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{item.label}</span>
                <Badge className="bg-white dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700 text-[9px] font-black uppercase px-2 py-0">
                  {item.channel}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

  )
}
