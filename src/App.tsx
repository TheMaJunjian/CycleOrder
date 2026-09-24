import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { Stage, Loop, Settings, TimerState, TimeUnit, LoopMode, StrategyLoadMode, Strategy, AppState } from '@/types'
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
import { getAudioReferenceId, getLocalAudioBlob, isMissingAudioReference } from '@/lib/audio-storage'
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
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const stageSoundRef = useRef<HTMLAudioElement | null>(null)
  const stageSoundReferenceRef = useRef<string | null>(null)
  const beepSourceRef = useRef<OscillatorNode | null>(null)
  const stageSoundGenerationRef = useRef(0)
  const webAudioGenerationRef = useRef(0)
  const isStageEndSoundPlayingRef = useRef(false)
  const prevStageIndexRef = useRef<string>('')
  const hasRecoveredTimerRef = useRef(false)
  const recoverAudioOnFocusRef = useRef<() => void>(() => {})

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
    stopAllEffects: (_preserveStageSound?: boolean) => {},
    stopStageEndSound: () => {},
    playStageRunningEffects: (_stage: Stage) => {},
    playStageEndSound: (_stage: Stage) => {},
    handleStageComplete: (_stage: Stage) => {},
  })

  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && stages && settings && loop) {
      const runtimeStagePath = timerEffectCallbacksRef.current.getFirstLeafPath(stages, timerState.currentStageIndex)
      const currentStage = timerEffectCallbacksRef.current.getStageAtPath(stages, runtimeStagePath)
      const stagePathKey = runtimeStagePath.join('.')
      const stageChanged = prevStageIndexRef.current !== stagePathKey
      prevStageIndexRef.current = stagePathKey
      
      if (currentStage && stageChanged) {
        const nextSoundReference = !settings.muteAudio &&
          !currentStage.runningSettings.randomSound &&
          currentStage.runningSettings.soundFile &&
          !isMissingAudioReference(currentStage.runningSettings.soundFile)
          ? currentStage.runningSettings.soundFile
          : null
        const preserveStageSound = Boolean(
          nextSoundReference && stageSoundReferenceRef.current === nextSoundReference
        )
        timerEffectCallbacksRef.current.stopAllEffects(preserveStageSound)
        if (preserveStageSound) {
          isStageEndSoundPlayingRef.current = false
        } else {
          timerEffectCallbacksRef.current.playStageRunningEffects(currentStage)
        }
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
          
          if (alertTime !== 0 && !isStageEndSoundPlayingRef.current) {
            if (alertTiming === 'inside') {
              const timeUntilEnd = stageDuration - newElapsed
              if (timeUntilEnd <= alertTimeMs && timeUntilEnd > 0) {
                timerEffectCallbacksRef.current.playStageEndSound(currentStage)
              }
            } else {
              const alertStartTime = stageDuration
              if (newElapsed >= alertStartTime && prev.currentStageElapsed < alertStartTime) {
                timerEffectCallbacksRef.current.playStageEndSound(currentStage)
              }
            }
          }

          if (newElapsed >= stageDuration) {
            timerEffectCallbacksRef.current.handleStageComplete(currentStage)
            
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
              
              return {
                ...prev,
                currentStageIndex: timerEffectCallbacksRef.current.getInitialStagePath(stages),
                currentStageElapsed: 0,
                totalElapsed: 0,
                lastUpdatedAt: now,
              }
            }
            
            if (currentStage.endSettings?.alertTime && currentStage.endSettings.alertTiming === 'outside') {
              if ((currentStage.endSettings.soundFile && !isMissingAudioReference(currentStage.endSettings.soundFile)) || currentStage.endSettings.randomSound) {
                timerEffectCallbacksRef.current.playStageEndSound(currentStage)
              }
            }
            
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
        timerEffectCallbacksRef.current.stopStageEndSound()
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
    if (!stage.runningSettings) return

    if (!settings?.muteAudio && stage.runningSettings.soundFile && !isMissingAudioReference(stage.runningSettings.soundFile) && !stage.runningSettings.randomSound) {
      playStageSound(stage.runningSettings.soundFile, 0.3, false)
    } else if (!settings?.muteAudio && stage.runningSettings.randomSound) {
      playBackgroundNoise()
    }

  }

  const resumeAudioContext = async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }

  const retryActiveAudio = () => {
    if (settings?.muteAudio) return

    if (stageSoundRef.current?.paused) {
      void stageSoundRef.current.play().catch(() => {})
    }
  }

  recoverAudioOnFocusRef.current = () => {
    if (noiseSourceRef.current || beepSourceRef.current) {
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

  const playStageSound = async (soundReference: string, volume: number, isStageEndSound: boolean) => {
    if (stageSoundReferenceRef.current === soundReference) {
      if (stageSoundRef.current) {
        stageSoundRef.current.volume = volume
      }
      if (stageSoundRef.current?.paused) {
        void stageSoundRef.current.play().catch((e) => console.error('Failed to resume stage sound', e))
      }
      isStageEndSoundPlayingRef.current = isStageEndSound
      return
    }

    const generation = ++stageSoundGenerationRef.current
    try {
      if (stageSoundRef.current) {
        stageSoundRef.current.pause()
        revokeAudioSource(stageSoundRef.current)
        stageSoundRef.current = null
      }
      stageSoundReferenceRef.current = soundReference
      isStageEndSoundPlayingRef.current = isStageEndSound

      const actualDataUrl = await resolveAudioSource(soundReference)
      if (generation !== stageSoundGenerationRef.current) {
        if (actualDataUrl.startsWith('blob:')) URL.revokeObjectURL(actualDataUrl)
        return
      }

      const audio = new Audio(actualDataUrl)
      audio.loop = true
      audio.volume = volume
      stageSoundRef.current = audio
      audio.play().catch((e) => console.error('Failed to play stage sound', e))
    } catch (e) {
      if (generation === stageSoundGenerationRef.current) {
        stageSoundReferenceRef.current = null
        isStageEndSoundPlayingRef.current = false
      }
      console.error('Failed to load stage sound', e)
    }
  }

  const playBackgroundNoise = async () => {
    if (!settings || settings.muteAudio) return

    const generation = webAudioGenerationRef.current
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current
      await resumeAudioContext()
      if (generation !== webAudioGenerationRef.current) return

      const bufferSize = audioContext.sampleRate * 2
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.05
      }

      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(audioContext.destination)
      source.start()
      noiseSourceRef.current = source
    } catch (e) {
      console.error('Failed to play background noise', e)
    }
  }

  const stopStageSound = () => {
    stageSoundGenerationRef.current += 1
    if (stageSoundRef.current) {
      stageSoundRef.current.pause()
      stageSoundRef.current.currentTime = 0
      revokeAudioSource(stageSoundRef.current)
      stageSoundRef.current = null
    }
    stageSoundReferenceRef.current = null
    isStageEndSoundPlayingRef.current = false
  }

  const stopAllEffects = (preserveStageSound = false) => {
    webAudioGenerationRef.current += 1
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop()
      noiseSourceRef.current = null
    }
    if (!preserveStageSound) {
      stopStageSound()
    }
    if (beepSourceRef.current) {
      try {
        beepSourceRef.current.stop()
      } catch (error) {
        console.error('[audio] Failed to stop beep', error)
      }
      beepSourceRef.current = null
    }
  }

  const playStageEndSound = async (stage: Stage) => {
    if (!stage.endSettings || !stage.endSettings.alertTime || stage.endSettings.alertTime === 0) {
      return
    }

    if (settings?.muteAudio) {
      return
    }

    if (stage.endSettings.soundFile && !isMissingAudioReference(stage.endSettings.soundFile) && !stage.endSettings.randomSound) {
      await playStageSound(stage.endSettings.soundFile, 0.5, true)
    } else if (stage.endSettings.randomSound) {
      if (isStageEndSoundPlayingRef.current) return
      stopStageSound()
      isStageEndSoundPlayingRef.current = true
      void playBeep()
    }
  }

  const stopStageEndSound = () => {
    if (!isStageEndSoundPlayingRef.current) return
    stopStageSound()
    webAudioGenerationRef.current += 1
    if (beepSourceRef.current) {
      try {
        beepSourceRef.current.stop()
      } catch (error) {
        console.error('[audio] Failed to stop beep', error)
      }
      beepSourceRef.current = null
    }
  }

  const handleStageComplete = (stage: Stage) => {
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop()
      noiseSourceRef.current = null
    }
    const alertTime = stage.endSettings?.alertTime ?? 0

    if (
      !settings?.muteAudio &&
      stage.endSettings &&
      alertTime !== 0 &&
      stage.endSettings.alertTiming !== 'outside'
    ) {
      void playStageEndSound(stage)
    }

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
    stopStageEndSound,
    playStageRunningEffects,
    playStageEndSound,
    handleStageComplete,
  }

  const playBeep = async () => {
    const generation = webAudioGenerationRef.current
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      await resumeAudioContext()
      if (generation !== webAudioGenerationRef.current) return

      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      beepSourceRef.current = oscillator
      oscillator.start()
      oscillator.addEventListener('ended', () => {
        if (beepSourceRef.current === oscillator) {
          beepSourceRef.current = null
        }
      }, { once: true })
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (e) {
      console.error('Failed to play beep', e)
    }
  }

  const handleStart = () => {
    if (!stages || stages.length === 0) {
      toast.error('请先添加阶段才能开始运行')
      return
    }
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
      stopAllEffects()
    } else {
      const stage = stages ? getStageAtPath(stages, currentStagePath) : undefined
      if (stage) {
        playStageRunningEffects(stage)

        const alertTime = stage.endSettings?.alertTime ?? 0
        const alertTimeMs = convertToMilliseconds(
          alertTime,
          stage.endSettings?.alertTimeUnit ?? 'seconds'
        )
        const timeUntilEnd = convertToMilliseconds(stage.duration, stage.unit) - timerState.currentStageElapsed

        if (
          alertTime !== 0 &&
          stage.endSettings?.alertTiming === 'inside' &&
          timeUntilEnd <= alertTimeMs &&
          timeUntilEnd > 0
        ) {
          playStageEndSound(stage)
        }
      }
    }
    setTimerState((prev) => ({ ...prev, isPaused: !prev.isPaused, lastUpdatedAt: Date.now() }))
  }

  const handleSkip = () => {
    if (!stages) return
    stopAllEffects()
    stopStageEndSound()
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
    stopStageEndSound()
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
    stopStageEndSound()
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
            <div className="flex flex-wrap gap-2 justify-center items-center text-xs">
              <Badge variant="outline">
                阶段 {currentStagePath.map((index) => index + 1).join('.')}
              </Badge>
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
                                        <SelectContent>
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
                          <SelectContent>
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
