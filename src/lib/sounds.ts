// Sound Manager for Event Horizon Dashboards
// Handles playing notification sounds for messages and other events

export interface SoundOptions {
  volume?: number
  loop?: boolean
  preload?: boolean
}

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private isEnabled: boolean = true
  private masterVolume: number = 0.7

  constructor() {
    // Check if user has previously disabled sounds
    const savedSetting = localStorage.getItem('sound-enabled')
    if (savedSetting !== null) {
      this.isEnabled = JSON.parse(savedSetting)
    }

    // Preload common sounds
    this.preloadSounds()
  }

  private preloadSounds() {
    // Create audio elements for common sounds
    const soundFiles = [
      { name: 'message-received', url: '/sounds/message-received.mp3' },
      { name: 'message-sent', url: '/sounds/message-sent.mp3' },
      { name: 'notification', url: '/sounds/notification.mp3' },
      { name: 'error', url: '/sounds/error.mp3' },
      { name: 'success', url: '/sounds/success.mp3' },
    ]

    soundFiles.forEach(({ name, url }) => {
      const audio = new Audio(url)
      audio.preload = 'auto'
      audio.volume = this.masterVolume
      this.sounds.set(name, audio)
    })
  }

  private createAudioElement(url: string, options: SoundOptions = {}): HTMLAudioElement {
    const audio = new Audio(url)
    audio.volume = (options.volume || 1) * this.masterVolume
    audio.loop = options.loop || false
    audio.preload = options.preload ? 'auto' : 'none'
    return audio
  }

  async playSound(soundName: string, options: SoundOptions = {}): Promise<void> {
    if (!this.isEnabled) return

    try {
      let audio = this.sounds.get(soundName)
      
      if (!audio) {
        // Create audio element if not preloaded
        const url = `/sounds/${soundName}.mp3`
        audio = this.createAudioElement(url, options)
        this.sounds.set(soundName, audio)
      }

      // Reset audio to beginning
      audio.currentTime = 0
      
      // Update volume if provided
      if (options.volume !== undefined) {
        audio.volume = options.volume * this.masterVolume
      }

      await audio.play()
    } catch (error) {
      console.warn(`Failed to play sound ${soundName}:`, error)
    }
  }

  async playMessageReceived(): Promise<void> {
    await this.playSound('message-received', { volume: 0.6 })
  }

  async playMessageSent(): Promise<void> {
    await this.playSound('message-sent', { volume: 0.4 })
  }

  async playNotification(): Promise<void> {
    await this.playSound('notification', { volume: 0.5 })
  }

  async playError(): Promise<void> {
    await this.playSound('error', { volume: 0.7 })
  }

  async playSuccess(): Promise<void> {
    await this.playSound('success', { volume: 0.6 })
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    localStorage.setItem('sound-enabled', JSON.stringify(enabled))
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    localStorage.setItem('sound-volume', JSON.stringify(this.masterVolume))
    
    // Update volume for all preloaded sounds
    this.sounds.forEach(audio => {
      audio.volume = this.masterVolume
    })
  }

  isSoundEnabled(): boolean {
    return this.isEnabled
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  // Test sound functionality
  async testSound(soundName: string = 'notification'): Promise<void> {
    await this.playSound(soundName, { volume: 0.5 })
  }
}

// Create singleton instance
export const soundManager = new SoundManager()

// Export convenience functions
export const playMessageReceived = () => soundManager.playMessageReceived()
export const playMessageSent = () => soundManager.playMessageSent()
export const playNotification = () => soundManager.playNotification()
export const playError = () => soundManager.playError()
export const playSuccess = () => soundManager.playSuccess()
export const setSoundEnabled = (enabled: boolean) => soundManager.setEnabled(enabled)
export const setSoundVolume = (volume: number) => soundManager.setMasterVolume(volume)
export const isSoundEnabled = () => soundManager.isSoundEnabled()
export const getSoundVolume = () => soundManager.getMasterVolume()
export const testSound = (soundName?: string) => soundManager.testSound(soundName)




