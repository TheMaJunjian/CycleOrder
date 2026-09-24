export type TimeUnit = 'nanoseconds' | 'microseconds' | 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

export type LoopMode = 'infinite' | 'fixed-count' | 'time-limited'

export type AlertTiming = 'inside' | 'outside'

export type SoundIntensity = 'weak' | 'strong'

export const SOUND_CATEGORIES = [
  { value: 'wind', label: '风声' },
  { value: 'thunder', label: '雷声' },
  { value: 'rain', label: '雨声' },
  { value: 'fire', label: '火焰声' },
  { value: 'ocean', label: '海浪声' },
  { value: 'stream', label: '溪流水声' },
  { value: 'forest', label: '森林鸟鸣' },
  { value: 'night', label: '夜间虫鸣' },
] as const

export type SoundCategory = typeof SOUND_CATEGORIES[number]['value']

export interface StageSettings {
  soundFile?: string
  randomSound: boolean
  soundCategory?: SoundCategory
  soundIntensity?: SoundIntensity
  wallpaper?: string
  wallpaperMode: 'fixed' | 'random'
  vibrationPattern?: number[]
  enableVibration: boolean
  alertTime?: number
  alertTimeUnit?: TimeUnit
  alertTiming?: AlertTiming
}

export interface Stage {
  id: string
  name: string
  duration: number
  unit: TimeUnit
  runningSettings: StageSettings
  endSettings: StageSettings
  isMerged?: boolean
  isEmbeddedStrategy?: boolean
  embeddedStrategyId?: string
  embeddedStrategyStages?: Stage[]
}

export interface Loop {
  id: string
  name: string
  stages: Stage[]
  loopMode: LoopMode
  loopCount?: number
  loopDuration?: number
  loopDurationUnit?: TimeUnit
  currentIteration?: number
  totalElapsed?: number
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
  lastUpdatedAt?: number
}

export type StrategyLoadMode = 'expand' | 'embed'

export interface Strategy {
  id: string
  name: string
  description?: string
  stages: Stage[]
  loop: Loop
  settings: Settings
  createdAt: number
  updatedAt: number
  loadMode?: StrategyLoadMode
  isCollapsed?: boolean
}

export interface AppState {
  currentStrategyName?: string
}
