export type TimeUnit = 'nanoseconds' | 'microseconds' | 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

export type LoopMode = 'infinite' | 'count' | 'duration'

export interface Stage {
  id: string
  name: string
  duration: number
  unit: TimeUnit
  runningSettings: {
    soundFile?: string
    randomSound: boolean
    soundCategory?: string
    wallpaper?: string
    wallpaperMode: 'fixed' | 'random'
    vibrationPattern?: number[]
    enableVibration: boolean
  }
  endSettings: {
    soundFile?: string
    randomSound: boolean
    soundCategory?: string
    wallpaper?: string
    wallpaperMode: 'fixed' | 'random'
    vibrationPattern?: number[]
    enableVibration: boolean
  }
}

export interface Loop {
  id: string
  name: string
  stages: (Stage | Loop)[]
  loopMode: LoopMode
  loopCount?: number
  loopDuration?: number
  loopDurationUnit?: TimeUnit
}

export interface Wallpaper {
  id: string
  url: string
  type: 'static' | 'video' | 'dark'
  name: string
}

export interface Settings {
  showFullscreenAlert: boolean
  forceAcknowledge: boolean
  wallpaperMode: 'fixed' | 'random'
  selectedWallpaper?: string
  enableVibration: boolean
  muteAudio: boolean
}

export interface TimerState {
  isRunning: boolean
  isPaused: boolean
  currentStageIndex: number[]
  currentStageElapsed: number
  totalElapsed: number
  currentLoopIteration: number[]
}
