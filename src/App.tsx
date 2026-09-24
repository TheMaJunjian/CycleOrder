import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { Stage, Loop, Settings, TimerState, TimeUnit, LoopMode, StrategyLoadMode, Strategy, AppState, SOUND_CATEGORIES, SoundCategory } from '@/types'
import { convertToMilliseconds, formatTime, generateId, TIME_UNITS } from '@/lib/timer-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumericInput } from '@/components/ui/numeric-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, SkipForward, Stop, Plus, Trash, GearSix, Repeat, Copy, Unite, StackSimple, Eye, PlayCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { StageSettingsDialog } from '@/components/StageSettingsDialog'
import { StageViewDialog } from '@/components/StageViewDialog'
import { LoopSettingsDialog } from '@/components/LoopSettingsDialog'
import { getAudioDisplayName, getAudioReferenceId, getLocalAudioBlob, isMissingAudioReference } from '@/lib/audio-storage'
import { useLocalStorage } from '@/hooks/use-local-storage'

const StrategyManagementDialog = lazy(() =>
  import('@/components/StrategyManagementDialog').then(({ StrategyManagementDialog }) => ({
    default: StrategyManagementDialog,
  }))
)

function App() {
  useEffect(() => {
    const audioSession = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (!audioSession) return

    try {
      audioSession.type = 'playback'
    } catch (error) {
      console.warn('Failed to set ambient audio session', error)
    }
  }, [])

  const [stages, setStages] = useLocalStorage<Stage[]>('timer-stages', [])
  const [loop, setLoop] = useLocalStorage<Loop>('timer-loop', {
    id: generateId(),
    name: '主循环',
    stages: [],
    loopMode: 'infinite',
    currentIteration: 0,
    totalElapsed: 0,
  })
  const [settings, setSettings] = useLocalStorage<Settings>('timer-settings', {
    showFullscreenAlert: true,
    forceAcknowledge: false,
    wallpaperMode: 'random',
    enableVibration: true,
    muteAudio: false,
  })
  const [appState, setAppState] = useLocalStorage<AppState>('app-state', {})
  
  const [timerState, setTimerState] = useLocalStorage<TimerState>('timer-state', {
    isRunning: false,
    isPaused: false,
    currentStageIndex: [0],
    currentStageElapsed: 0,
    totalElapsed: 0,
    currentLoopIteration: [0],
    lastUpdatedAt: Date.now(),
  })

  const [selectedStageIds, setSelectedStageIds] = useState<Set<string>>(new Set())
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false)
  const [missingCurrentSoundReference, setMissingCurrentSoundReference] = useState<string | null>(null)
  const [activeSoundPlayers, setActiveSoundPlayers] = useState<{ id: string; label: string }[]>([])
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const noiseCategoryRef = useRef<SoundCategory>('wind')
  const sharedSoundRef = useRef<HTMLAudioElement | null>(null)
  const sharedSoundReferenceRef = useRef<string | null>(null)
  const sharedSoundGenerationRef = useRef(0)
  const sharedSoundKindRef = useRef<'file' | 'noise' | 'beep' | null>(null)
  const outsideAlertSoundsRef = useRef(new Map<number, {
    playerId: string
    category: SoundCategory
    label: string
    audio: HTMLAudioElement | null
    beepKey: string | null
    timeout: number | null
    remainingMs: number
    deadline: number
  }>())
  const beepSourcesRef = useRef(new Map<string, AudioBufferSourceNode>())
  const beepGenerationsRef = useRef(new Map<string, number>())
  const beepCategoriesRef = useRef(new Map<string, SoundCategory>())
  const beepLabelsRef = useRef(new Map<string, string>())
  const noiseGenerationRef = useRef(0)
  const outsideAlertGenerationRef = useRef(0)
  const outsideAlertSequenceRef = useRef(0)
  const activeAlertStageIdRef = useRef<string | null>(null)
  const isNoiseStartingRef = useRef(false)
  const audioPausedRef = useRef(false)
  const activeSoundPlayersRef = useRef<{ id: string; label: string }[]>([])
  const noiseSoundLabelRef = useRef('随机音效-风声')
  const prevStageIndexRef = useRef<string>('')
  const prevStageSoundKeyRef = useRef('')
  const hasRecoveredTimerRef = useRef(false)
  const recoverAudioOnFocusRef = useRef<() => void>(() => {})

  const updateActiveSoundPlayer = (id: string, label?: string) => {
    const nextPlayers = label
      ? [...activeSoundPlayersRef.current.filter((player) => player.id !== id), { id, label }]
      : activeSoundPlayersRef.current.filter((player) => player.id !== id)
    activeSoundPlayersRef.current = nextPlayers
    queueMicrotask(() => setActiveSoundPlayers([...activeSoundPlayersRef.current]))
  }

  useEffect(() => {
    if (hasRecoveredTimerRef.current) return
    hasRecoveredTimerRef.current = true

    if (!timerState.isRunning || timerState.isPaused || !timerState.lastUpdatedAt) return

    const elapsedSinceLastUpdate = Math.max(0, Date.now() - timerState.lastUpdatedAt)
    if (elapsedSinceLastUpdate === 0) return

    setTimerState((previous) => ({
      ...previous,
      currentStageElapsed: previous.currentStageElapsed + elapsedSinceLastUpdate,
      totalElapsed: previous.totalElapsed + elapsedSinceLastUpdate,
      lastUpdatedAt: Date.now(),
    }))
  }, [setTimerState, timerState.isPaused, timerState.isRunning, timerState.lastUpdatedAt])

  useEffect(() => {
    const recoverAudio = () => {
      if (document.visibilityState === 'visible') {
        recoverAudioOnFocusRef.current()
      }
    }

    window.addEventListener('focus', recoverAudio)
    document.addEventListener('visibilitychange', recoverAudio)

    return () => {
      window.removeEventListener('focus', recoverAudio)
      document.removeEventListener('visibilitychange', recoverAudio)
    }
  }, [])

  useEffect(() => {
    const recoveryInterval = window.setInterval(() => {
      recoverAudioOnFocusRef.current()
    }, 1000)

    return () => window.clearInterval(recoveryInterval)
  }, [])

  useEffect(() => {
    if (!stages) return
    setLoop((currentLoop) => {
      if (!currentLoop) {
        return {
          id: generateId(),
          name: '主循环',
          stages,
          loopMode: 'infinite' as LoopMode,
          currentIteration: 0,
          totalElapsed: 0,
        }
      }
      return { ...currentLoop, stages }
    })
  }, [setLoop, stages])

  const shouldContinueLoop = (loopState: Loop | undefined = loop): boolean => {
    if (!loopState) return false
    
    if (loopState.loopMode === 'infinite') return true
    
    if (loopState.loopMode === 'fixed-count') {
      return (loopState.currentIteration || 0) < (loopState.loopCount || 1)
    }
    
    if (loopState.loopMode === 'time-limited') {
      const maxDuration = convertToMilliseconds(
        loopState.loopDuration || 60,
        loopState.loopDurationUnit || 'minutes'
      )
      return (loopState.totalElapsed || 0) < maxDuration
    }
    
    return true
  }

  const getStageAtPath = (stageList: Stage[], path: number[]): Stage | undefined => {
    let stage: Stage | undefined = stageList[path[0]]
    for (let depth = 1; stage && depth < path.length; depth += 1) {
      const nextStage = stage.embeddedStrategyStages?.[path[depth]]
      stage = nextStage
    }
    return stage
  }

  const getStageDisplayName = (stageList: Stage[], path: number[]): string => {
    if (path.length <= 1) return getStageAtPath(stageList, path)?.name || ''

    const prefixes: string[] = []
    let currentStage: Stage | undefined = stageList[path[0]]
    if (currentStage?.isMerged || currentStage?.isEmbeddedStrategy) prefixes.push(currentStage.name)

    for (let depth = 1; depth < path.length - 1 && currentStage; depth += 1) {
      const nextStage = currentStage.embeddedStrategyStages?.[path[depth]]
      currentStage = nextStage
      if (currentStage?.isMerged || currentStage?.isEmbeddedStrategy) prefixes.push(currentStage.name)
    }

    const leafStage = getStageAtPath(stageList, path)
    return [...prefixes, leafStage?.name || ''].filter(Boolean).join(' / ')
  }

  const getSoundDisplayLabel = (soundSettings: Stage['runningSettings']): string => {
    const soundName = soundSettings.randomSound
      ? `随机音效-${SOUND_CATEGORIES.find(({ value }) => value === (soundSettings.soundCategory ?? 'wind'))?.label ?? '风声'}`
      : soundSettings.soundFile
        ? isMissingAudioReference(soundSettings.soundFile)
          ? `缺少音效文件：${getAudioDisplayName(soundSettings.soundFile) || '未知文件'}`
          : getAudioDisplayName(soundSettings.soundFile) || '已上传音效文件'
        : '未设置音效'
    return soundName
  }

  const getInitialStagePath = (stageList: Stage[]): number[] => {
    return getFirstLeafPath(stageList, [0])
  }

  const getFirstLeafPath = (stageList: Stage[], path: number[]): number[] => {
    const stage = getStageAtPath(stageList, path)
    return stage?.embeddedStrategyStages?.length
      ? getFirstLeafPath(stageList, [...path, 0])
      : path
  }

  const getNextStagePath = (stageList: Stage[], path: number[]): number[] | undefined => {
    const currentStage = getStageAtPath(stageList, path)
    if (currentStage?.embeddedStrategyStages?.length) {
      return getFirstLeafPath(stageList, [...path, 0])
    }

    let candidatePath = [...path]
    while (candidatePath.length > 0) {
      const parentPath = candidatePath.slice(0, -1)
      const siblings = parentPath.length === 0
        ? stageList
        : getStageAtPath(stageList, parentPath)?.embeddedStrategyStages
      const nextIndex = candidatePath[candidatePath.length - 1] + 1
      if (siblings && nextIndex < siblings.length) {
        return getFirstLeafPath(stageList, [...parentPath, nextIndex])
      }
      candidatePath = parentPath
    }
    return undefined
  }

  const timerEffectCallbacksRef = useRef({
    getFirstLeafPath,
    getStageAtPath,
    getInitialStagePath,
    getNextStagePath,
    shouldContinueLoop,
    setLoop,
    setTimerState,
    stopAllEffects: () => {},
    stopStageRunningEffects: () => {},
    stopAlertSound: () => {},
    playStageRunningEffects: (_stage: Stage) => {},
    playAlertSound: (_stage: Stage, _isOutside?: boolean, _outsideDurationMs?: number) => {},
    playStageEndSound: (_stage: Stage, _nextStage: Stage) => {},
  })

  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && stages && settings && loop) {
      const runtimeStagePath = timerEffectCallbacksRef.current.getFirstLeafPath(stages, timerState.currentStageIndex)
      const currentStage = timerEffectCallbacksRef.current.getStageAtPath(stages, runtimeStagePath)
      const stagePathKey = runtimeStagePath.join('.')
      const stageChanged = prevStageIndexRef.current !== stagePathKey
      prevStageIndexRef.current = stagePathKey

      const runningSoundKey = currentStage
        ? `${currentStage.id}:${currentStage.runningSettings?.randomSound}:${currentStage.runningSettings?.soundFile}:${currentStage.runningSettings?.soundCategory}`
        : ''
      const soundSettingsChanged = prevStageSoundKeyRef.current !== runningSoundKey
      prevStageSoundKeyRef.current = runningSoundKey
      
      if (currentStage && (stageChanged || soundSettingsChanged)) {
        timerEffectCallbacksRef.current.playStageRunningEffects(currentStage)
      }

      intervalRef.current = window.setInterval(() => {
        timerEffectCallbacksRef.current.setTimerState((prev) => {
          const now = Date.now()
          const elapsedSinceLastUpdate = Math.max(0, now - (prev.lastUpdatedAt || now))
          const newElapsed = prev.currentStageElapsed + elapsedSinceLastUpdate
          const runtimeStagePath = timerEffectCallbacksRef.current.getFirstLeafPath(stages, prev.currentStageIndex)
          const currentStage = timerEffectCallbacksRef.current.getStageAtPath(stages, runtimeStagePath)
          
          if (!currentStage) return prev

          const stageDuration = Math.max(1, convertToMilliseconds(currentStage.duration, currentStage.unit))
          
          const alertTime = currentStage.endSettings?.alertTime ?? 0
          const alertTimeUnit = currentStage.endSettings?.alertTimeUnit ?? 'seconds'
          const alertTiming = currentStage.endSettings?.alertTiming ?? 'inside'
          const alertTimeMs = convertToMilliseconds(alertTime, alertTimeUnit)
          
          const timeUntilEnd = stageDuration - newElapsed
          if (
            alertTiming === 'inside' &&
            alertTime !== 0 &&
            activeAlertStageIdRef.current !== currentStage.id &&
            timeUntilEnd <= alertTimeMs &&
            timeUntilEnd > 0
          ) {
            timerEffectCallbacksRef.current.playAlertSound(currentStage)
          }

          if (newElapsed >= stageDuration) {
            const nextStagePath = timerEffectCallbacksRef.current.getNextStagePath(stages, runtimeStagePath)
            
            if (!nextStagePath) {
              const nextLoop: Loop = loop
                ? {
                    ...loop,
                    currentIteration: (loop.currentIteration || 0) + 1,
                    totalElapsed: (loop.totalElapsed || 0) + prev.totalElapsed + newElapsed,
                  }
                : {
                    id: generateId(),
                    name: '主循环',
                    stages,
                    loopMode: 'infinite',
                    currentIteration: 1,
                    totalElapsed: prev.totalElapsed + newElapsed,
                  }
              timerEffectCallbacksRef.current.setLoop(nextLoop)
              
              if (!timerEffectCallbacksRef.current.shouldContinueLoop(nextLoop)) {
                timerEffectCallbacksRef.current.stopAllEffects()
                toast.success('循环已完成')
                return {
                  ...prev,
                  isRunning: false,
                  currentStageIndex: [0],
                  currentStageElapsed: 0,
                  totalElapsed: 0,
                  lastUpdatedAt: now,
                }
              }

              const nextStage = timerEffectCallbacksRef.current.getStageAtPath(
                stages,
                timerEffectCallbacksRef.current.getInitialStagePath(stages)
              )
              if (nextStage) timerEffectCallbacksRef.current.playStageEndSound(currentStage, nextStage)
              
              return {
                ...prev,
                currentStageIndex: timerEffectCallbacksRef.current.getInitialStagePath(stages),
                currentStageElapsed: 0,
                totalElapsed: 0,
                lastUpdatedAt: now,
              }
            }

            const nextStage = timerEffectCallbacksRef.current.getStageAtPath(stages, nextStagePath)
            if (nextStage) timerEffectCallbacksRef.current.playStageEndSound(currentStage, nextStage)
            
            return {
              ...prev,
              currentStageIndex: nextStagePath,
              currentStageElapsed: 0,
              totalElapsed: prev.totalElapsed + newElapsed,
              lastUpdatedAt: now,
            }
          }

          return {
            ...prev,
            currentStageElapsed: newElapsed,
            totalElapsed: prev.totalElapsed + elapsedSinceLastUpdate,
            lastUpdatedAt: now,
          }
        })
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!timerState.isRunning) {
        timerEffectCallbacksRef.current.stopAllEffects()
        timerEffectCallbacksRef.current.stopAlertSound()
        prevStageIndexRef.current = ''
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState.isRunning, timerState.isPaused, timerState.currentStageIndex, stages, settings, loop])

  const playStageRunningEffects = (stage: Stage) => {
    activeAlertStageIdRef.current = null
    if (!stage.runningSettings) {
      stopStageRunningEffects()
      return
    }

    const soundReference = !settings?.muteAudio &&
      !stage.runningSettings.randomSound &&
      stage.runningSettings.soundFile &&
      !isMissingAudioReference(stage.runningSettings.soundFile)
      ? stage.runningSettings.soundFile
      : null
    const soundLabel = getSoundDisplayLabel(stage.runningSettings)
    if (soundReference && sharedSoundReferenceRef.current === soundReference) {
      void playSharedSound(soundReference, 0.3, soundLabel)
      return
    }
    if (
      !soundReference &&
      !settings?.muteAudio &&
      stage.runningSettings.randomSound &&
      noiseCategoryRef.current === (stage.runningSettings.soundCategory ?? 'wind') &&
      sharedSoundKindRef.current === 'noise' &&
      (noiseSourceRef.current || isNoiseStartingRef.current)
    ) {
      updateActiveSoundPlayer('shared', soundLabel)
      return
    }

    stopStageRunningEffects()
    if (soundReference) {
      playSharedSound(soundReference, 0.3, soundLabel)
    } else if (!settings?.muteAudio && stage.runningSettings.randomSound) {
      playBackgroundNoise(stage.runningSettings.soundCategory ?? 'wind', soundLabel)
    }

  }

  const stopStageRunningEffects = () => {
    sharedSoundGenerationRef.current += 1
    noiseGenerationRef.current += 1
    isNoiseStartingRef.current = false
    if (sharedSoundRef.current) {
      sharedSoundRef.current.pause()
      sharedSoundRef.current.currentTime = 0
      revokeAudioSource(sharedSoundRef.current)
      sharedSoundRef.current = null
    }
    sharedSoundReferenceRef.current = null
    sharedSoundKindRef.current = null
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop()
      noiseSourceRef.current = null
    }
    stopBeep('shared')
  }

  const resumeAudioContext = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }

  const retryActiveAudio = () => {
    if (settings?.muteAudio || audioPausedRef.current) return

    const activeAudio = [
      sharedSoundRef.current,
      ...[...outsideAlertSoundsRef.current.values()].map(({ audio }) => audio),
    ]
    for (const audio of activeAudio) {
      if (audio?.paused) {
        void audio.play().catch(() => {})
      }
    }
  }

  recoverAudioOnFocusRef.current = () => {
    if (audioPausedRef.current) return
    if (noiseSourceRef.current || beepSourcesRef.current.size > 0) {
      void resumeAudioContext().catch(() => {})
    }
    retryActiveAudio()
  }

  const resolveAudioSource = async (soundReference: string): Promise<string> => {
    const audioId = getAudioReferenceId(soundReference)
    if (!audioId) {
      return soundReference.includes('|||')
        ? soundReference.split('|||')[1]
        : soundReference
    }

    const blob = await getLocalAudioBlob(audioId)
    return URL.createObjectURL(blob)
  }

  const revokeAudioSource = (audio: HTMLAudioElement | null) => {
    if (audio?.src.startsWith('blob:')) {
      URL.revokeObjectURL(audio.src)
    }
  }

  const playSharedSound = async (soundReference: string, volume: number, label: string) => {
    if (sharedSoundReferenceRef.current === soundReference) {
      updateActiveSoundPlayer('shared', label)
      if (sharedSoundRef.current) {
        sharedSoundRef.current.volume = volume
        if (sharedSoundRef.current.paused && !audioPausedRef.current) {
          void sharedSoundRef.current.play().catch((error) => console.error('Failed to resume shared sound', error))
        }
      }
      return
    }

    stopStageRunningEffects()
    const generation = sharedSoundGenerationRef.current
    sharedSoundReferenceRef.current = soundReference
    sharedSoundKindRef.current = 'file'
    updateActiveSoundPlayer('shared', label)
    try {
      const actualDataUrl = await resolveAudioSource(soundReference)
      if (generation !== sharedSoundGenerationRef.current) {
        if (actualDataUrl.startsWith('blob:')) URL.revokeObjectURL(actualDataUrl)
        return
      }

      const audio = new Audio(actualDataUrl)
      audio.loop = true
      audio.volume = volume
      sharedSoundRef.current = audio
      if (!audioPausedRef.current) {
        audio.play().catch((error) => console.error('Failed to play shared sound', error))
      }
    } catch (error) {
      if (generation === sharedSoundGenerationRef.current) {
        sharedSoundReferenceRef.current = null
        sharedSoundKindRef.current = null
        updateActiveSoundPlayer('shared', `${label}（文件缺失或无法读取）`)
      }
      console.error('Failed to load shared sound', error)
    }
  }

  const playAlertSound = async (stage: Stage) => {
    if (!stage.endSettings?.alertTime || settings?.muteAudio) return
    const soundReference = stage.endSettings.soundFile
    const hasSound = stage.endSettings.randomSound || Boolean(soundReference && !isMissingAudioReference(soundReference))
    if (!hasSound) return
    if (activeAlertStageIdRef.current === stage.id) return

    if (soundReference && !isMissingAudioReference(soundReference) && !stage.endSettings.randomSound) {
      const playback = playSharedSound(
        soundReference,
        0.5,
        getSoundDisplayLabel(stage.endSettings)
      )
      activeAlertStageIdRef.current = stage.id
      await playback
    } else if (stage.endSettings.randomSound) {
      stopStageRunningEffects()
      sharedSoundKindRef.current = 'beep'
      activeAlertStageIdRef.current = stage.id
      await playBeep(
        'shared',
        stage.endSettings.soundCategory ?? 'wind',
        getSoundDisplayLabel(stage.endSettings)
      )
    }
  }

  const stopOutsideAlert = (alertId: number) => {
    const alert = outsideAlertSoundsRef.current.get(alertId)
    if (!alert) return
    outsideAlertSoundsRef.current.delete(alertId)
    const timeout = alert.timeout
    alert.timeout = null
    if (typeof timeout === 'number') window.clearTimeout(timeout)
    if (alert.audio) {
      alert.audio.pause()
      alert.audio.currentTime = 0
      revokeAudioSource(alert.audio)
    }
    if (alert.beepKey) stopBeep(alert.beepKey)
    updateActiveSoundPlayer(alert.playerId)
  }

  const playOutsideAlertSound = async (stage: Stage, durationMs: number) => {
    if (settings?.muteAudio) return
    const endSettings = stage.endSettings
    const soundReference = endSettings.soundFile
    const hasSound = endSettings.randomSound || Boolean(soundReference && !isMissingAudioReference(soundReference))
    if (!hasSound || durationMs <= 0) return

    const alertId = ++outsideAlertSequenceRef.current
    const generation = outsideAlertGenerationRef.current
    const category = endSettings.soundCategory ?? 'wind'
    const label = getSoundDisplayLabel(endSettings)
    const playerId = `outside-alert-${alertId}`
    const alert = {
      playerId,
      category,
      label,
      audio: null as HTMLAudioElement | null,
      beepKey: endSettings.randomSound ? playerId : null,
      timeout: null as number | null,
      remainingMs: durationMs,
      deadline: Date.now() + durationMs,
    }
    outsideAlertSoundsRef.current.set(alertId, alert)
    updateActiveSoundPlayer(playerId, label)
    if (!audioPausedRef.current) {
      alert.timeout = window.setTimeout(() => stopOutsideAlert(alertId), durationMs)
    }

    if (endSettings.randomSound) {
      void playBeep(alert.beepKey!, category, label)
      return
    }

    try {
      const actualDataUrl = await resolveAudioSource(soundReference!)
      if (generation !== outsideAlertGenerationRef.current || outsideAlertSoundsRef.current.get(alertId) !== alert) {
        if (actualDataUrl.startsWith('blob:')) URL.revokeObjectURL(actualDataUrl)
        return
      }

      const audio = new Audio(actualDataUrl)
      audio.loop = true
      audio.volume = 0.5
      alert.audio = audio
      if (!audioPausedRef.current) {
        audio.play().catch((error) => console.error('Failed to play outside alert', error))
      }
    } catch (error) {
      if (outsideAlertSoundsRef.current.get(alertId) === alert) {
        updateActiveSoundPlayer(playerId, `${label}（文件缺失或无法读取）`)
      }
      console.error('Failed to load outside alert', error)
    }
  }

  const createRandomSoundSource = (audioContext: AudioContext, category: SoundCategory, loop = true) => {
    const durationSeconds = loop ? 6 : 8 + Math.floor(Math.random() * 5)
    const sampleRate = audioContext.sampleRate
    const buffer = audioContext.createBuffer(1, sampleRate * durationSeconds, sampleRate)
    const samples = buffer.getChannelData(0)
    let lowFrequencyState = 0
    let crackle = 0
    let nextBirdCall = Math.random() * sampleRate
    let birdCallSamples = 0
    let birdCallPhase = 0
    let birdCallFrequency = 0
    const swellPeriod = 4 + Math.random() * 5
    const swellPhase = Math.random() * Math.PI * 2

    for (let index = 0; index < samples.length; index += 1) {
      const whiteNoise = Math.random() * 2 - 1
      const time = index / sampleRate
      if (category === 'wind') {
        const swell = 0.55 + 0.45 * Math.sin((2 * Math.PI * time) / swellPeriod + swellPhase)
        samples[index] = whiteNoise * swell * 0.3
      } else if (category === 'thunder') {
        lowFrequencyState = lowFrequencyState * 0.997 + whiteNoise * 0.018
        samples[index] = lowFrequencyState * 2.5
      } else if (category === 'rain') {
        if (Math.random() < 0.00012) crackle = 0.55
        samples[index] = whiteNoise * 0.2 + crackle
        crackle *= 0.998
      } else if (category === 'fire') {
        if (Math.random() < 0.0001) crackle = 0.8
        samples[index] = whiteNoise * 0.05 + crackle
        crackle *= 0.994
      } else if (category === 'ocean') {
        lowFrequencyState = lowFrequencyState * 0.997 + whiteNoise * 0.016
        const swell = Math.max(0, Math.sin((2 * Math.PI * time) / swellPeriod + swellPhase))
        samples[index] = lowFrequencyState * (0.4 + swell * 2.2) + whiteNoise * swell * 0.12
      } else if (category === 'stream') {
        lowFrequencyState = lowFrequencyState * 0.94 + whiteNoise * 0.06
        const ripple = 0.82 + 0.18 * Math.sin((2 * Math.PI * time) / (0.7 + swellPeriod / 8) + swellPhase)
        samples[index] = (whiteNoise * 0.18 + lowFrequencyState * 0.3) * ripple
      } else if (category === 'forest') {
        nextBirdCall -= 1
        if (nextBirdCall <= 0 && birdCallSamples <= 0) {
          birdCallSamples = Math.floor(sampleRate * (0.08 + Math.random() * 0.14))
          birdCallFrequency = 1500 + Math.random() * 1100
          birdCallPhase = 0
          nextBirdCall = sampleRate * (0.9 + Math.random() * 2.8)
        }
        if (birdCallSamples > 0) {
          const progress = 1 - birdCallSamples / (sampleRate * 0.22)
          samples[index] = whiteNoise * 0.035 + Math.sin(birdCallPhase) * Math.sin(Math.PI * progress) * 0.13
          birdCallPhase += (2 * Math.PI * (birdCallFrequency + progress * 350)) / sampleRate
          birdCallSamples -= 1
        } else {
          samples[index] = whiteNoise * 0.035
        }
      } else {
        const chirpCycle = time % 1.4
        const chirpEnvelope = chirpCycle < 0.18 ? Math.sin((Math.PI * chirpCycle) / 0.18) : 0
        samples[index] = whiteNoise * 0.025 + Math.sin(2 * Math.PI * 4100 * time) * chirpEnvelope * 0.08
      }

      if (!loop) {
        const fadeSamples = Math.floor(sampleRate * 0.18)
        const fadeIn = Math.min(1, index / fadeSamples)
        const fadeOut = Math.min(1, (samples.length - index) / fadeSamples)
        samples[index] *= Math.min(fadeIn, fadeOut)
      }
    }

    const filter = audioContext.createBiquadFilter()
    filter.type = category === 'wind' || category === 'thunder' || category === 'ocean' ? 'lowpass' : 'bandpass'
    filter.frequency.value = category === 'wind' ? 650
      : category === 'thunder' ? 220
        : category === 'rain' ? 2400
          : category === 'fire' ? 1100
            : category === 'ocean' ? 900
              : category === 'stream' ? 1700
                : category === 'forest' ? 3200
                  : 4100
    filter.frequency.value *= 0.85 + Math.random() * 0.3
    filter.Q.value = category === 'fire' || category === 'night' ? 0.7 : 0.5

    const volume = audioContext.createGain()
    volume.gain.value = category === 'thunder' ? 0.18
      : category === 'forest' || category === 'night' ? 0.14
        : 0.2
    volume.gain.value *= 0.9 + Math.random() * 0.2
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = loop
    source.connect(filter)
    filter.connect(volume)
    volume.connect(audioContext.destination)
    return source
  }

  const startBackgroundNoiseSegment = (audioContext: AudioContext, category: SoundCategory, generation: number) => {
    if (generation !== noiseGenerationRef.current || audioPausedRef.current) return

    const source = createRandomSoundSource(audioContext, category, false)
    source.addEventListener('ended', () => {
      if (noiseSourceRef.current === source) noiseSourceRef.current = null
      startBackgroundNoiseSegment(audioContext, category, generation)
    }, { once: true })
    source.start()
    noiseSourceRef.current = source
  }

  const playBackgroundNoise = async (
    category: SoundCategory = 'wind',
    label: string = noiseSoundLabelRef.current
  ) => {
    if (!settings || settings.muteAudio) return
    if (noiseSourceRef.current || isNoiseStartingRef.current) return

    const generation = noiseGenerationRef.current
    noiseCategoryRef.current = category
    noiseSoundLabelRef.current = label
    sharedSoundKindRef.current = 'noise'
    isNoiseStartingRef.current = true
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current
      await resumeAudioContext()
      if (generation !== noiseGenerationRef.current || audioPausedRef.current) {
        isNoiseStartingRef.current = false
        return
      }

      startBackgroundNoiseSegment(audioContext, category, generation)
      updateActiveSoundPlayer('shared', label)
      isNoiseStartingRef.current = false
    } catch (e) {
      if (generation === noiseGenerationRef.current) isNoiseStartingRef.current = false
      console.error('Failed to play background noise', e)
    }
  }

  const stopAlertSound = () => {
    activeAlertStageIdRef.current = null
    stopStageRunningEffects()
  }

  const stopAllOutsideAlerts = () => {
    outsideAlertGenerationRef.current += 1
    for (const alertId of outsideAlertSoundsRef.current.keys()) {
      stopOutsideAlert(alertId)
    }
  }

  const stopAllEffects = () => {
    audioPausedRef.current = false
    stopStageRunningEffects()
    stopAllOutsideAlerts()
  }

  const pauseAllEffects = () => {
    audioPausedRef.current = true
    sharedSoundRef.current?.pause()
    for (const alert of outsideAlertSoundsRef.current.values()) {
      alert.audio?.pause()
      if (alert.timeout !== null) {
        alert.remainingMs = Math.max(0, alert.deadline - Date.now())
        window.clearTimeout(alert.timeout)
        alert.timeout = null
      }
    }
    if (audioContextRef.current?.state === 'running') {
      void audioContextRef.current.suspend().catch((error) => console.error('Failed to suspend audio context', error))
    }
  }

  const resumeAllEffects = () => {
    audioPausedRef.current = false
    if (sharedSoundRef.current?.paused) {
      void sharedSoundRef.current.play().catch((error) => console.error('Failed to resume shared sound', error))
    }
    if (!noiseSourceRef.current && sharedSoundKindRef.current === 'noise') {
      void playBackgroundNoise(noiseCategoryRef.current, noiseSoundLabelRef.current)
    }
    if (sharedSoundKindRef.current === 'beep' && !beepSourcesRef.current.has('shared')) {
      void playBeep(
        'shared',
        beepCategoriesRef.current.get('shared') ?? 'wind',
        beepLabelsRef.current.get('shared') ?? '随机音效-风声'
      )
    }
    if (audioContextRef.current?.state === 'suspended') {
      void resumeAudioContext().catch((error) => console.error('Failed to resume audio context', error))
    }
    for (const [alertId, alert] of outsideAlertSoundsRef.current) {
      if (alert.audio?.paused) {
        void alert.audio.play().catch((error) => console.error('Failed to resume outside alert', error))
      }
      if (alert.timeout !== null) continue
      if (alert.remainingMs <= 0) {
        stopOutsideAlert(alertId)
        continue
      }
      alert.deadline = Date.now() + alert.remainingMs
      alert.timeout = window.setTimeout(() => stopOutsideAlert(alertId), alert.remainingMs)
      if (alert.beepKey && !beepSourcesRef.current.has(alert.beepKey)) {
        void playBeep(alert.beepKey, alert.category, alert.label)
      }
    }
  }

  const playStageEndSound = (stage: Stage, nextStage: Stage) => {
    const endSettings = stage.endSettings
    const alertTime = endSettings?.alertTime ?? 0
    const hasSound = Boolean(
      endSettings &&
      alertTime > 0 &&
      (endSettings.randomSound || (endSettings.soundFile && !isMissingAudioReference(endSettings.soundFile)))
    )
    if (!hasSound || settings?.muteAudio) return
    if (endSettings?.alertTiming !== 'outside') return

    const outsideDurationMs = Math.min(
      convertToMilliseconds(alertTime, endSettings.alertTimeUnit ?? 'seconds'),
      convertToMilliseconds(nextStage.duration, nextStage.unit)
    )
    void playOutsideAlertSound(stage, outsideDurationMs)
  }

  timerEffectCallbacksRef.current = {
    getFirstLeafPath,
    getStageAtPath,
    getInitialStagePath,
    getNextStagePath,
    shouldContinueLoop,
    setLoop,
    setTimerState,
    stopAllEffects,
    stopStageRunningEffects,
    stopAlertSound,
    playStageRunningEffects,
    playAlertSound,
    playStageEndSound,
  }

  const stopBeep = (key: string) => {
    const currentGeneration = beepGenerationsRef.current.get(key) ?? 0
    beepGenerationsRef.current.set(key, currentGeneration + 1)
    const source = beepSourcesRef.current.get(key)
    if (source) {
      try {
        source.stop()
      } catch (error) {
        console.error('[audio] Failed to stop beep', error)
      }
    }
    beepSourcesRef.current.delete(key)
    beepCategoriesRef.current.delete(key)
    beepLabelsRef.current.delete(key)
    updateActiveSoundPlayer(key)
  }

  const playBeep = async (key: string, category: SoundCategory = 'wind', label = '随机音效-风声') => {
    const generation = (beepGenerationsRef.current.get(key) ?? 0) + 1
    beepGenerationsRef.current.set(key, generation)
    beepCategoriesRef.current.set(key, category)
    beepLabelsRef.current.set(key, label)
    updateActiveSoundPlayer(key, label)
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      await resumeAudioContext()
      if (generation !== beepGenerationsRef.current.get(key) || audioPausedRef.current) return

      const source = createRandomSoundSource(audioContextRef.current, category)
      source.addEventListener('ended', () => {
        if (beepSourcesRef.current.get(key) === source) beepSourcesRef.current.delete(key)
      }, { once: true })
      beepSourcesRef.current.set(key, source)
      source.start()
    } catch (e) {
      console.error('Failed to play beep', e)
    }
  }

  const handleStart = () => {
    if (!stages || stages.length === 0) {
      toast.error('请先添加阶段才能开始运行')
      return
    }
    audioPausedRef.current = false
    setTimerState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      currentStageIndex: getInitialStagePath(stages),
      lastUpdatedAt: Date.now(),
    }))
  }

  const handlePause = () => {
    const willPause = !timerState.isPaused
    if (willPause) {
      pauseAllEffects()
    } else {
      resumeAllEffects()
    }
    setTimerState((prev) => ({ ...prev, isPaused: !prev.isPaused, lastUpdatedAt: Date.now() }))
  }

  const handleSkip = () => {
    if (!stages) return
    stopAllEffects()
    stopAlertSound()
    setTimerState((prev) => {
      const activePath = getFirstLeafPath(stages, prev.currentStageIndex)
      const nextPath = getNextStagePath(stages, activePath) || getInitialStagePath(stages)
      return {
        ...prev,
        currentStageIndex: nextPath,
        currentStageElapsed: 0,
      }
    })
  }

  const handleReset = () => {
    stopAllEffects()
    stopAlertSound()
    prevStageIndexRef.current = ''
    setTimerState({
      isRunning: false,
      isPaused: false,
                currentStageIndex: getInitialStagePath(stages),
      currentStageElapsed: 0,
      totalElapsed: 0,
      currentLoopIteration: [0],
      lastUpdatedAt: Date.now(),
    })
    setLoop((currentLoop) => {
      if (!currentLoop) {
        return {
          id: generateId(),
          name: '主循环',
          stages: stages || [],
          loopMode: 'infinite' as LoopMode,
          currentIteration: 0,
          totalElapsed: 0,
        }
      }
      return {
        ...currentLoop,
        currentIteration: 0,
        totalElapsed: 0,
      }
    })
  }

  const updateLoop = (updates: Partial<Loop>) => {
    setLoop((currentLoop) => {
      if (!currentLoop) {
        return {
          id: generateId(),
          name: '主循环',
          stages: stages || [],
          loopMode: 'infinite' as LoopMode,
          currentIteration: 0,
          totalElapsed: 0,
          ...updates,
        }
      }
      return { ...currentLoop, ...updates }
    })
  }

  const addStage = () => {
    if (!stages) return
    const newStage: Stage = {
      id: generateId(),
      name: `阶段 ${stages.length + 1}`,
      duration: 5,
      unit: 'minutes',
      runningSettings: {
        randomSound: false,
        wallpaperMode: 'random',
        enableVibration: true,
      },
      endSettings: {
        randomSound: false,
        wallpaperMode: 'random',
        enableVibration: true,
      },
    }
    setStages((current) => [...(current || []), newStage])
  }

  const deleteStage = (id: string) => {
    setStages((current) => (current || []).filter((s) => s.id !== id))
  }

  const updateStage = (id: string, updates: Partial<Stage>) => {
    setStages((current) => (current || []).map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const updateEmbeddedStage = (embeddedStageId: string, childStageId: string, updates: Partial<Stage>) => {
    setStages((current) => (current || []).map((stage) => {
      if (stage.id !== embeddedStageId || !stage.embeddedStrategyStages) return stage
      const embeddedStrategyStages = stage.embeddedStrategyStages.map((childStage) =>
        childStage.id === childStageId ? { ...childStage, ...updates } : childStage
      )
      const totalDurationMs = embeddedStrategyStages.reduce(
        (total, childStage) => total + convertToMilliseconds(childStage.duration, childStage.unit),
        0
      )
      return {
        ...stage,
        duration: totalDurationMs / TIME_UNITS.minutes,
        embeddedStrategyStages,
      }
    }))
  }

  const deleteEmbeddedStage = (embeddedStageId: string, childStageId: string) => {
    setStages((current) => (current || []).map((stage) => {
      if (stage.id !== embeddedStageId || !stage.embeddedStrategyStages) return stage
      const embeddedStrategyStages = stage.embeddedStrategyStages.filter((childStage) => childStage.id !== childStageId)
      const totalDurationMs = embeddedStrategyStages.reduce(
        (total, childStage) => total + convertToMilliseconds(childStage.duration, childStage.unit),
        0
      )
      return {
        ...stage,
        duration: totalDurationMs / TIME_UNITS.minutes,
        embeddedStrategyStages,
      }
    }))
  }

  const duplicateEmbeddedStage = (embeddedStageId: string, childStageId: string) => {
    setStages((current) => (current || []).map((stage) => {
      if (stage.id !== embeddedStageId || !stage.embeddedStrategyStages) return stage
      const childIndex = stage.embeddedStrategyStages.findIndex((childStage) => childStage.id === childStageId)
      if (childIndex < 0) return stage
      const childStage = stage.embeddedStrategyStages[childIndex]
      const duplicatedStage = {
        ...childStage,
        id: generateId(),
        name: `${childStage.name} (副本)`,
      }
      const embeddedStrategyStages = [...stage.embeddedStrategyStages]
      embeddedStrategyStages.splice(childIndex + 1, 0, duplicatedStage)
      const totalDurationMs = embeddedStrategyStages.reduce(
        (total, childStage) => total + convertToMilliseconds(childStage.duration, childStage.unit),
        0
      )
      return {
        ...stage,
        duration: totalDurationMs / TIME_UNITS.minutes,
        embeddedStrategyStages,
      }
    }))
    toast.success('子阶段已复制')
  }

  const duplicateStage = (id: string) => {
    if (!stages) return
    const stageToDuplicate = stages.find((s) => s.id === id)
    if (!stageToDuplicate) return
    
    const newStage: Stage = {
      ...stageToDuplicate,
      id: generateId(),
      name: `${stageToDuplicate.name} (副本)`,
    }
    
    const stageIndex = stages.findIndex((s) => s.id === id)
    setStages((current) => {
      const updated = [...(current || [])]
      updated.splice(stageIndex + 1, 0, newStage)
      return updated
    })
    toast.success('阶段已复制')
  }

  const toggleStageSelection = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }
    setSelectedStageIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const mergeSelectedStages = () => {
    if (!stages || selectedStageIds.size < 1) {
      toast.error('请至少选择一个阶段进行合并')
      return
    }

    const selectedStages = stages.filter((s) => selectedStageIds.has(s.id))
    const sortedSelectedStages = selectedStages.sort((a, b) => {
      return stages.indexOf(a) - stages.indexOf(b)
    })

    let totalDurationMs = 0
    sortedSelectedStages.forEach((stage) => {
      totalDurationMs += convertToMilliseconds(stage.duration, stage.unit)
    })

    const mergedStage: Stage = {
      id: generateId(),
      name: sortedSelectedStages.map((s) => s.name).join(' + '),
      duration: totalDurationMs / TIME_UNITS.minutes,
      unit: 'minutes',
      runningSettings: {
        ...sortedSelectedStages[0].runningSettings,
      },
      endSettings: {
        ...sortedSelectedStages[sortedSelectedStages.length - 1].endSettings,
      },
      isMerged: true,
      embeddedStrategyStages: sortedSelectedStages,
    }

    const firstSelectedIndex = stages.indexOf(sortedSelectedStages[0])
    
    setStages((current) => {
      const filtered = (current || []).filter((s) => !selectedStageIds.has(s.id))
      filtered.splice(firstSelectedIndex, 0, mergedStage)
      return filtered
    })

    setSelectedStageIds(new Set())
    toast.success(`已合并 ${selectedStageIds.size} 个阶段`)
  }

  const clearSelection = () => {
    setSelectedStageIds(new Set())
  }

  const handleLoadStrategy = (strategyStages: Stage[], mode: StrategyLoadMode, strategyId: string, strategyName: string) => {
    if (mode === 'expand') {
      setStages((current) => [...(current || []), ...strategyStages])
      toast.success(`已展开 ${strategyStages.length} 个阶段`)
    } else {
      let totalDurationMs = 0
      strategyStages.forEach((stage) => {
        totalDurationMs += convertToMilliseconds(stage.duration, stage.unit)
      })

      const embeddedStage: Stage = {
        id: generateId(),
        name: strategyName,
        duration: totalDurationMs / TIME_UNITS.minutes,
        unit: 'minutes',
        runningSettings: {
          ...strategyStages[0].runningSettings,
        },
        endSettings: {
          ...strategyStages[strategyStages.length - 1].endSettings,
        },
        isMerged: true,
        isEmbeddedStrategy: true,
        embeddedStrategyId: strategyId,
        embeddedStrategyStages: strategyStages,
      }

      setStages((current) => [...(current || []), embeddedStage])
      toast.success(`已嵌入策略"${strategyName}"`)
    }
  }

  const handleRunStrategy = (strategy: Strategy) => {
    stopAllEffects()
    stopAlertSound()
    prevStageIndexRef.current = ''
    setStages(() => strategy.stages)
    setLoop(() => strategy.loop)
    setSettings(() => strategy.settings)
    setAppState(() => ({ currentStrategyName: strategy.name }))
    setTimerState({
      isRunning: true,
      isPaused: false,
      currentStageIndex: getInitialStagePath(strategy.stages),
      currentStageElapsed: 0,
      totalElapsed: 0,
      currentLoopIteration: [0],
      lastUpdatedAt: Date.now(),
    })
    toast.success(`策略"${strategy.name}"已开始运行`)
  }

  const currentStagePath = stages
    ? getFirstLeafPath(stages, timerState.currentStageIndex)
    : timerState.currentStageIndex
  const currentStage = stages ? getStageAtPath(stages, currentStagePath) : undefined
  const currentSoundReference = currentStage?.runningSettings?.soundFile

  useEffect(() => {
    if (!currentSoundReference || currentStage?.runningSettings?.randomSound) {
      setMissingCurrentSoundReference(null)
      return
    }
    if (isMissingAudioReference(currentSoundReference)) {
      setMissingCurrentSoundReference(currentSoundReference)
      return
    }

    const audioId = getAudioReferenceId(currentSoundReference)
    if (!audioId) {
      setMissingCurrentSoundReference(null)
      return
    }

    let isCurrentReference = true
    setMissingCurrentSoundReference(null)
    void getLocalAudioBlob(audioId).catch(() => {
      if (isCurrentReference) setMissingCurrentSoundReference(currentSoundReference)
    })
    return () => {
      isCurrentReference = false
    }
  }, [currentSoundReference, currentStage?.runningSettings?.randomSound])

  const currentSoundLabel = currentStage?.runningSettings?.randomSound
    ? `随机音效-${SOUND_CATEGORIES.find(({ value }) => value === (currentStage.runningSettings.soundCategory ?? 'wind'))?.label ?? '风声'}`
    : currentSoundReference
      ? missingCurrentSoundReference === currentSoundReference
        ? `缺少音效文件：${getAudioDisplayName(currentSoundReference) || '未知文件'}`
        : `音效：${getAudioDisplayName(currentSoundReference) || '已上传音效文件'}`
      : '未设置音效'
  const displayedSoundPlayers = (activeSoundPlayers.length > 0
    ? [...activeSoundPlayers]
    : [{ id: 'configured-stage-sound', label: currentSoundLabel }]
  ).sort((left, right) => {
    if (left.id === 'shared') return right.id === 'shared' ? 0 : -1
    if (right.id === 'shared') return 1
    const leftAlertId = Number(left.id.match(/^outside-alert-(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER)
    const rightAlertId = Number(right.id.match(/^outside-alert-(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER)
    return leftAlertId - rightAlertId
  })

  useEffect(() => {
    if (!timerState.isRunning || currentStage) return

    setTimerState((previous) => ({
      ...previous,
      isRunning: false,
      isPaused: false,
      currentStageIndex: timerEffectCallbacksRef.current.getInitialStagePath(stages || []),
      currentStageElapsed: 0,
      totalElapsed: 0,
      lastUpdatedAt: Date.now(),
    }))
  }, [currentStage, setTimerState, stages, timerState.isRunning])

  const remainingTime = currentStage
    ? convertToMilliseconds(currentStage.duration, currentStage.unit) - timerState.currentStageElapsed
    : 0
  const runningWallpaper = currentStage?.runningSettings?.wallpaperMode === 'fixed' && !currentStage.runningSettings.wallpaper?.startsWith('missing-wallpaper://')
    ? currentStage.runningSettings.wallpaper?.split('|||').pop()
    : undefined

  return (
    <div className="min-h-screen overflow-y-auto bg-background p-4 pb-20 md:p-6 md:pb-24 lg:p-8 lg:pb-28">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="text-center space-y-1 pb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">环序</h1>
          <p className="text-sm text-muted-foreground">循环次序 (CycleOrder)</p>
        </div>

        {timerState.isRunning && currentStage && (
          <Card
            className="p-6 md:p-8 text-center space-y-5 border-2 bg-cover bg-center"
            style={runningWallpaper ? {
              backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.78)), url(${runningWallpaper})`,
            } : undefined}
          >
            {appState?.currentStrategyName && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">当前策略</p>
                <h3 className="text-lg font-semibold text-foreground">{appState?.currentStrategyName}</h3>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">当前阶段</p>
              <h2
                className="truncate text-2xl md:text-3xl font-bold text-foreground"
                title={getStageDisplayName(stages || [], currentStagePath)}
              >
                {getStageDisplayName(stages || [], currentStagePath)}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-primary tabular-nums">{formatTime(remainingTime, true)}</div>
                <p className="text-xs text-muted-foreground">剩余时间</p>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-100 rounded-full"
                    style={{
                      width: `${(timerState.currentStageElapsed / convertToMilliseconds(currentStage.duration, currentStage.unit)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 text-xs">
                {loop?.loopMode === 'fixed-count' && loop?.loopCount && (
                  <Badge variant="secondary">
                    第 {(loop?.currentIteration || 0) + 1} / {loop?.loopCount} 次
                  </Badge>
                )}
                {loop?.loopMode === 'time-limited' && loop?.loopDuration && loop?.loopDurationUnit && (
                  <Badge variant="secondary">
                    {formatTime(loop?.totalElapsed || 0)} / {loop?.loopDuration} {loop?.loopDurationUnit}
                  </Badge>
                )}
                {loop?.loopMode === 'infinite' && (
                  <Badge variant="secondary">第 {(loop?.currentIteration || 0) + 1} 次</Badge>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={handlePause} size="lg" variant="secondary" className="flex-1 sm:flex-initial h-12">
                  {timerState.isPaused ? (
                    <>
                      <PlayCircle size={20} className="mr-2" weight="fill" />
                      继续
                    </>
                  ) : (
                    <>
                      <Pause size={20} className="mr-2" weight="fill" />
                      暂停
                    </>
                  )}
                </Button>
                <Button onClick={handleSkip} size="lg" variant="outline" className="flex-1 sm:flex-initial h-12">
                  <SkipForward size={20} className="mr-2" weight="fill" />
                  跳过
                </Button>
                <Button onClick={handleReset} size="lg" variant="outline" className="flex-1 sm:flex-initial h-12 text-destructive hover:text-destructive">
                  <Stop size={20} className="mr-2" weight="fill" />
                  停止
                </Button>
              </div>
              <div className="flex flex-col items-center gap-2 text-xs">
                {displayedSoundPlayers.map(({ id, label }) => (
                  <Badge key={id} variant="outline" className="max-w-full" title={label}>
                    <span className="truncate">{label}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4 md:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">阶段列表</h3>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {selectedStageIds.size > 0 && (
                <>
                  <Button 
                    onClick={mergeSelectedStages} 
                    size="sm" 
                    variant="secondary"
                    className="flex-1 sm:flex-initial"
                  >
                    <Unite size={16} className="mr-1.5" />
                    合并 ({selectedStageIds.size})
                  </Button>
                  <Button 
                    onClick={clearSelection} 
                    size="sm" 
                    variant="ghost"
                    className="flex-1 sm:flex-initial"
                  >
                    清除选择
                  </Button>
                </>
              )}
              <Button onClick={() => setStrategyDialogOpen(true)} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                <StackSimple size={16} className="mr-1.5" />
                策略
              </Button>
              {strategyDialogOpen && (
                <Suspense fallback={null}>
                  <StrategyManagementDialog
                    open={strategyDialogOpen}
                    onOpenChange={setStrategyDialogOpen}
                    currentStages={stages}
                    currentLoop={loop}
                    currentSettings={settings}
                    onLoadStrategy={handleLoadStrategy}
                    onRunStrategy={handleRunStrategy}
                  />
                </Suspense>
              )}
              <LoopSettingsDialog loop={loop!} onUpdate={updateLoop}>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                  <Repeat size={16} className="mr-1.5" />
                  循环
                </Button>
              </LoopSettingsDialog>
              <Button onClick={addStage} size="sm" className="flex-1 sm:flex-initial">
                <Plus size={16} className="mr-1.5" />
                添加
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {(stages || []).map((stage, index) => {
              const isMerged = stage.isMerged === true
              const isEmbedded = stage.isEmbeddedStrategy === true
              const isSelected = selectedStageIds.has(stage.id)
              
              const getTimeUnitLabel = (unit: string): string => {
                const labels: Record<string, string> = {
                  nanoseconds: '纳秒',
                  microseconds: '微秒',
                  milliseconds: '毫秒',
                  seconds: '秒',
                  minutes: '分钟',
                  hours: '小时',
                  days: '天',
                  months: '月',
                  years: '年',
                }
                return labels[unit] || unit
              }
              
              return (
                <div 
                  key={stage.id} 
                  onClick={() => toggleStageSelection(stage.id)}
                  className={`p-3 rounded-lg space-y-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border border-primary shadow-sm' 
                      : 'bg-muted/40 border border-transparent hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-7 text-right shrink-0">{index + 1}.</span>
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 h-9"
                      placeholder="Stage name"
                    />
                    {!isMerged && (
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateStage(stage.id)
                        }} 
                        variant="ghost" 
                        size="icon"
                        className="shrink-0 h-9 w-9 hidden md:flex"
                        title="复制"
                      >
                        <Copy size={16} />
                      </Button>
                    )}
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteStage(stage.id)
                      }} 
                      variant="ghost" 
                      size="icon" 
                      className="shrink-0 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title={isMerged ? '移除' : '删除'}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                  
                  {isMerged && (
                    <div className="pl-7 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {isEmbedded ? '嵌入策略' : '合并阶段'}
                        </Badge>
                        <span className="text-muted-foreground">
                          {stage.duration} {getTimeUnitLabel(stage.unit)}
                        </span>
                        {stage.embeddedStrategyStages?.length ? (
                          <div className="w-full space-y-2">
                            <span className="text-muted-foreground">
                              · {stage.embeddedStrategyStages.length} 个子阶段
                            </span>
                            <div className="space-y-2 rounded-md border border-border/60 bg-background/50 p-2">
                              {stage.embeddedStrategyStages.map((childStage, childIndex) => (
                                <div key={childStage.id} className="space-y-2 rounded border bg-muted/30 p-2">
                                  <div className="flex items-center gap-2">
                                  <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                                    {childIndex + 1}.
                                  </span>
                                  <Input
                                    value={childStage.name}
                                    onChange={(event) => updateEmbeddedStage(stage.id, childStage.id, { name: event.target.value })}
                                    onClick={(event) => event.stopPropagation()}
                                    className="h-8 min-w-0 flex-1 text-sm"
                                  />
                                  <Button
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      duplicateEmbeddedStage(stage.id, childStage.id)
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="hidden h-8 w-8 shrink-0 md:flex"
                                    title="复制"
                                  >
                                    <Copy size={14} />
                                  </Button>
                                  <Button
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      deleteEmbeddedStage(stage.id, childStage.id)
                                    }}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    title="删除"
                                  >
                                    <Trash size={14} />
                                  </Button>
                                  </div>
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-2 flex-1">
                                      <NumericInput
                                        value={childStage.duration}
                                        onValueCommit={(value) => updateEmbeddedStage(stage.id, childStage.id, {
                                          duration: value === null ? 1 : Math.max(0.001, value),
                                        })}
                                        onClick={(event) => event.stopPropagation()}
                                        className="h-8 w-20 text-sm"
                                        step="0.1"
                                      />
                                      <Select
                                        value={childStage.unit}
                                        onValueChange={(value: TimeUnit) => updateEmbeddedStage(stage.id, childStage.id, { unit: value })}
                                      >
                                        <SelectTrigger className="h-8 w-24 text-sm" onClick={(event) => event.stopPropagation()}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent onClick={(event) => event.stopPropagation()}>
                                          <SelectItem value="milliseconds">毫秒</SelectItem>
                                          <SelectItem value="seconds">秒</SelectItem>
                                          <SelectItem value="minutes">分钟</SelectItem>
                                          <SelectItem value="hours">小时</SelectItem>
                                          <SelectItem value="days">天</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                                      <StageViewDialog stage={childStage}>
                                        <Button variant="outline" size="sm" className="h-8 text-xs">
                                          <Eye size={14} className="mr-1.5" />
                                          查看
                                        </Button>
                                      </StageViewDialog>
                                  <StageSettingsDialog
                                    stage={childStage}
                                    onUpdate={(updates) => updateEmbeddedStage(stage.id, childStage.id, updates)}
                                  >
                                    <Button variant="outline" size="sm" className="h-8 shrink-0 text-xs">
                                      <GearSix size={14} className="mr-1.5" />
                                      设置
                                    </Button>
                                  </StageSettingsDialog>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                      {!isEmbedded && (
                        <StageViewDialog stage={stage}>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={(event) => event.stopPropagation()}>
                            <Eye size={14} className="mr-1.5" />
                            查看
                          </Button>
                        </StageViewDialog>
                      )}
                    </div>
                  )}
                  
                  {!isMerged && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pl-7">
                      <div className="flex items-center gap-2 flex-1">
                        <NumericInput
                          value={stage.duration}
                          onValueCommit={(value) => updateStage(stage.id, {
                            duration: value === null ? 1 : Math.max(0.001, value),
                          })}
                            onClick={(e) => e.stopPropagation()}
                          className="w-20 h-8 text-sm"
                          placeholder="时长"
                          step="0.1"
                        />
                        <Select value={stage.unit} onValueChange={(value: TimeUnit) => updateStage(stage.id, { unit: value })}>
                          <SelectTrigger className="w-24 h-8 text-sm" onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent onClick={(event) => event.stopPropagation()}>
                            <SelectItem value="milliseconds">毫秒</SelectItem>
                            <SelectItem value="seconds">秒</SelectItem>
                            <SelectItem value="minutes">分钟</SelectItem>
                            <SelectItem value="hours">小时</SelectItem>
                            <SelectItem value="days">天</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <StageViewDialog stage={stage}>
                          <Button variant="outline" size="sm" className="h-8 text-xs flex-1 sm:flex-initial">
                            <Eye size={14} className="mr-1.5" />
                            查看
                          </Button>
                        </StageViewDialog>
                        <StageSettingsDialog
                          stage={stage}
                          onUpdate={(updates) => updateStage(stage.id, updates)}
                        >
                          <Button variant="outline" size="sm" className="h-8 text-xs flex-1 sm:flex-initial">
                            <GearSix size={14} className="mr-1.5" />
                            设置
                          </Button>
                        </StageSettingsDialog>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {(!stages || stages.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">暂无阶段</p>
                <p className="text-xs mt-1">点击"添加"开始创建</p>
              </div>
            )}
          </div>
        </Card>

        {!timerState.isRunning && (
          <div className="flex justify-center">
            <Button onClick={handleStart} size="lg" className="h-12 w-full text-base font-medium">
              <Play size={20} className="mr-2" weight="fill" />
              开始
            </Button>
          </div>
        )}

      </div>

    </div>
  )
}

export default App
