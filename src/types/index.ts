export type TimeUnit = 'nanoseconds' | 'microseconds' | 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'

export type LoopMode = 'infinite' | 'fixed-count' | 'time-limited'

export type AlertTiming = 'inside' | 'outside'

export interface StageSettings {
  soundFile?: string
  randomSound: boolean
  soundCategory?: string
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
