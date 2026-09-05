import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Stage, Loop, Settings, TimerState, TimeUnit, LoopMode, StrategyLoadMode, Strategy, AppState } from '@/types'
import { convertToMilliseconds, formatTime, generateId, vibrateDevice, TIME_UNITS } from '@/lib/timer-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, SkipForward, ArrowCounterClockwise, Plus, Trash, GearSix, Repeat, Copy, Unite, StackSimple, Eye, Clock, PlayCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { StageSettingsDialog } from '@/components/StageSettingsDialog'
import { StageViewDialog } from '@/components/StageViewDialog'
import { LoopSettingsDialog } from '@/components/LoopSettingsDialog'
import { StrategyManagementDialog } from '@/components/StrategyManagementDialog'
import { getAudioReferenceId, getLocalAudioBlob } from '@/lib/audio-storage'

function App() {
  const [stages, setStages] = useKV<Stage[]>('timer-stages', [])
  const [loop, setLoop] = useKV<Loop>('timer-loop', {
    id: generateId(),
    name: '主循环',
    stages: [],
    loopMode: 'infinite',
    currentIteration: 0,
    totalElapsed: 0,
  })
  const [settings, setSettings] = useKV<Settings>('timer-settings', {
    showFullscreenAlert: true,
    forceAcknowledge: false,
    wallpaperMode: 'random',
    enableVibration: true,
    muteAudio: false,
  })
  const [appState, setAppState] = useKV<AppState>('app-state', {})
  
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentStageIndex: [0],
    currentStageElapsed: 0,
    totalElapsed: 0,
    currentLoopIteration: [0],
  })

  const [showAlert, setShowAlert] = useState(false)
  const [completedStage, setCompletedStage] = useState<Stage | null>(null)
  const [selectedStageIds, setSelectedStageIds] = useState<Set<string>>(new Set())
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const customSoundRef = useRef<HTMLAudioElement | null>(null)
  const alertSoundRef = useRef<HTMLAudioElement | null>(null)
  const endSoundRef = useRef<HTMLAudioElement | null>(null)
  const beepSourceRef = useRef<OscillatorNode | null>(null)
  const audioGenerationRef = useRef(0)
  const isAlertPlayingRef = useRef(false)
  const prevStageIndexRef = useRef<number>(-1)

  useEffect(() => {
    if (!stages || !loop) return
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
  }, [stages])

  const shouldContinueLoop = (): boolean => {
    if (!loop) return false
    
    if (loop.loopMode === 'infinite') return true
    
    if (loop.loopMode === 'fixed-count') {
      return (loop.currentIteration || 0) < (loop.loopCount || 1)
    }
    
    if (loop.loopMode === 'time-limited') {
      const maxDuration = convertToMilliseconds(
        loop.loopDuration || 60, 
        loop.loopDurationUnit || 'minutes'
      )
      return (loop.totalElapsed || 0) < maxDuration
    }
    
    return true
  }

  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && stages && settings && loop) {
      const currentStage = stages[timerState.currentStageIndex[0]]
      const stageChanged = prevStageIndexRef.current !== timerState.currentStageIndex[0]
      prevStageIndexRef.current = timerState.currentStageIndex[0]
      
      if (currentStage && stageChanged) {
        stopAllEffects()
        playStageRunningEffects(currentStage)
      }

      intervalRef.current = window.setInterval(() => {
        setTimerState((prev) => {
          const newElapsed = prev.currentStageElapsed + 100
          const currentStage = stages[prev.currentStageIndex[0]]
          
          if (!currentStage) return prev

          const stageDuration = convertToMilliseconds(currentStage.duration, currentStage.unit)
          
          const alertTime = currentStage.endSettings?.alertTime ?? 0
          const alertTimeUnit = currentStage.endSettings?.alertTimeUnit ?? 'seconds'
          const alertTiming = currentStage.endSettings?.alertTiming ?? 'inside'
          const alertTimeMs = convertToMilliseconds(alertTime, alertTimeUnit)
          
          if (alertTime !== 0 && !isAlertPlayingRef.current) {
            if (alertTiming === 'inside') {
              const timeUntilEnd = stageDuration - newElapsed
              if (timeUntilEnd <= alertTimeMs && timeUntilEnd > 0) {
                playAlertSound(currentStage)
              }
            } else {
              const alertStartTime = stageDuration
              if (newElapsed >= alertStartTime && prev.currentStageElapsed < alertStartTime) {
                playAlertSound(currentStage)
              }
            }
          }

          if (newElapsed >= stageDuration) {
            handleStageComplete(currentStage)
            
            const nextStageIndex = prev.currentStageIndex[0] + 1
            
            if (nextStageIndex >= stages.length) {
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
                return {
                  ...currentLoop,
                  currentIteration: (currentLoop.currentIteration || 0) + 1,
                  totalElapsed: (currentLoop.totalElapsed || 0) + prev.totalElapsed + newElapsed,
                }
              })
              
              if (!shouldContinueLoop()) {
                stopAllEffects()
                toast.success('循环已完成')
                return {
                  ...prev,
                  isRunning: false,
                  currentStageIndex: [0],
                  currentStageElapsed: 0,
                  totalElapsed: 0,
                }
              }
              
              return {
                ...prev,
                currentStageIndex: [0],
                currentStageElapsed: 0,
                totalElapsed: 0,
              }
            }
            
            const nextStage = stages[nextStageIndex]
            if (nextStage && nextStage.endSettings?.alertTime && nextStage.endSettings?.alertTiming === 'outside') {
              stopAllEffects()
              playAlertSound(nextStage)
            }
            
            return {
              ...prev,
              currentStageIndex: [nextStageIndex],
              currentStageElapsed: 0,
              totalElapsed: prev.totalElapsed + newElapsed,
            }
          }

          return {
            ...prev,
            currentStageElapsed: newElapsed,
            totalElapsed: prev.totalElapsed + 100,
          }
        })
      }, 100)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (!timerState.isRunning) {
        stopAllEffects()
        stopAlertSound()
        prevStageIndexRef.current = -1
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

    stopAlertSound()

    if (!settings?.muteAudio && stage.runningSettings.soundFile && !stage.runningSettings.randomSound) {
      playCustomSound(stage.runningSettings.soundFile)
    } else if (!settings?.muteAudio) {
      playBackgroundNoise()
    }

    if (stage.runningSettings.enableVibration) {
      if (stage.runningSettings.vibrationPattern) {
        vibrateDevice(stage.runningSettings.vibrationPattern)
      } else {
        vibrateDevice([50, 2000])
      }
    }
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

  const playCustomSound = async (soundReference: string) => {
    const generation = audioGenerationRef.current
    try {
      if (customSoundRef.current) {
        customSoundRef.current.pause()
        revokeAudioSource(customSoundRef.current)
        customSoundRef.current = null
      }

      const actualDataUrl = await resolveAudioSource(soundReference)
      if (generation !== audioGenerationRef.current) {
        if (actualDataUrl.startsWith('blob:')) URL.revokeObjectURL(actualDataUrl)
        return
      }

      const audio = new Audio(actualDataUrl)
      audio.loop = true
      audio.volume = 0.3
      audio.play().catch((e) => console.error('Failed to play custom sound', e))
      customSoundRef.current = audio
    } catch (e) {
      console.error('Failed to load custom sound', e)
    }
  }

  const playBackgroundNoise = () => {
    if (!settings || settings.muteAudio) return
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }

      const audioContext = audioContextRef.current
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

  const stopAllEffects = () => {
    audioGenerationRef.current += 1
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop()
      noiseSourceRef.current = null
    }
    if (customSoundRef.current) {
      customSoundRef.current.pause()
      revokeAudioSource(customSoundRef.current)
      customSoundRef.current = null
    }
    if (alertSoundRef.current) {
      alertSoundRef.current.pause()
      revokeAudioSource(alertSoundRef.current)
      alertSoundRef.current = null
    }
    if (endSoundRef.current) {
      endSoundRef.current.pause()
      endSoundRef.current.currentTime = 0
      revokeAudioSource(endSoundRef.current)
      endSoundRef.current = null
    }
    if (beepSourceRef.current) {
      try {
        beepSourceRef.current.stop()
      } catch {}
      beepSourceRef.current = null
    }
    isAlertPlayingRef.current = false
  }

  const playAlertSound = async (stage: Stage) => {
    if (!stage.endSettings || !stage.endSettings.alertTime || stage.endSettings.alertTime === 0) {
      return
    }

    if (settings?.muteAudio) {
      return
    }

    if (isAlertPlayingRef.current) {
      return
    }

    stopAllEffects()
    const generation = audioGenerationRef.current

    if (stage.endSettings.soundFile && !stage.endSettings.randomSound) {
      try {
        const actualDataUrl = await resolveAudioSource(stage.endSettings.soundFile)
        if (generation !== audioGenerationRef.current) {
          if (actualDataUrl.startsWith('blob:')) URL.revokeObjectURL(actualDataUrl)
          return
        }

        const audio = new Audio(actualDataUrl)
        audio.loop = true
        audio.volume = 0.5
        audio.play().catch((e) => console.error('Failed to play alert sound', e))
        alertSoundRef.current = audio
        isAlertPlayingRef.current = true
      } catch (e) {
        console.error('Failed to load alert sound', e)
      }
    } else {
      playBeep()
      isAlertPlayingRef.current = true
    }
  }

  const stopAlertSound = () => {
    if (alertSoundRef.current) {
      alertSoundRef.current.pause()
      alertSoundRef.current.currentTime = 0
      alertSoundRef.current = null
    }
    isAlertPlayingRef.current = false
  }

  const handleStageComplete = (stage: Stage) => {
    stopAllEffects()
    stopAlertSound()

    const alertTime = stage.endSettings?.alertTime ?? 0

    if (stage.endSettings?.enableVibration && alertTime !== 0) {
      if (stage.endSettings.vibrationPattern) {
        vibrateDevice(stage.endSettings.vibrationPattern)
      } else {
        vibrateDevice([200, 100, 200, 100, 400])
      }
    }

    if (!settings?.muteAudio && stage.endSettings && alertTime !== 0) {
      if (stage.endSettings.soundFile && !stage.endSettings.randomSound) {
        playEndSound(stage.endSettings.soundFile)
      } else {
        playBeep()
      }
    }

    if (settings?.showFullscreenAlert && alertTime !== 0) {
      setCompletedStage(stage)
      setShowAlert(true)
    }
  }

  const playEndSound = async (soundReference: string) => {
    const generation = audioGenerationRef.current
    try {
      const actualDataUrl = await resolveAudioSource(soundReference)
      if (generation !== audioGenerationRef.current) {
        if (actualDataUrl.startsWith('blob:')) URL.revokeObjectURL(actualDataUrl)
        return
      }

      const audio = new Audio(actualDataUrl)
      audio.loop = true
      audio.volume = 0.5
      audio.play().catch((e) => console.error('Failed to play end sound', e))
      endSoundRef.current = audio
      audio.addEventListener('ended', () => {
        if (endSoundRef.current === audio) {
          endSoundRef.current = null
        }
      }, { once: true })
    } catch (e) {
      console.error('Failed to load end sound', e)
    }
  }

  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const audioContext = audioContextRef.current
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      beepSourceRef.current = oscillator
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
    setTimerState((prev) => ({ ...prev, isRunning: true, isPaused: false }))
  }

  const handlePause = () => {
    const willPause = !timerState.isPaused
    if (willPause) {
      stopAllEffects()
    } else {
      const stage = stages?.[timerState.currentStageIndex[0]]
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
          playAlertSound(stage)
        }
      }
    }
    setTimerState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const handleSkip = () => {
    if (!stages) return
    stopAllEffects()
    stopAlertSound()
    setTimerState((prev) => ({
      ...prev,
      currentStageIndex: [(prev.currentStageIndex[0] + 1) % stages.length],
      currentStageElapsed: 0,
    }))
  }

  const handleReset = () => {
    stopAllEffects()
    stopAlertSound()
    prevStageIndexRef.current = -1
    setTimerState({
      isRunning: false,
      isPaused: false,
      currentStageIndex: [0],
      currentStageElapsed: 0,
      totalElapsed: 0,
      currentLoopIteration: [0],
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
        name: `${strategyName}`,
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
    setStages(() => strategy.stages)
    setLoop(() => strategy.loop)
    setSettings(() => strategy.settings)
    setAppState(() => ({ currentStrategyName: strategy.name }))
    setTimerState({
      isRunning: true,
      isPaused: false,
      currentStageIndex: [0],
      currentStageElapsed: 0,
      totalElapsed: 0,
      currentLoopIteration: [0],
    })
    toast.success(`策略"${strategy.name}"已开始运行`)
  }

  const currentStage = stages ? stages[timerState.currentStageIndex[0]] : undefined
  const remainingTime = currentStage
    ? convertToMilliseconds(currentStage.duration, currentStage.unit) - timerState.currentStageElapsed
    : 0

  const getLoopModeLabel = (mode: LoopMode): string => {
    switch (mode) {
      case 'infinite': return '无限���������环'
      case 'fixed-count': return '固定次数循环'
      case 'time-limited': return '限定时长循环'
      default: return '无限循环'
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="text-center space-y-1 pb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">环序</h1>
          <p className="text-sm text-muted-foreground">循环次序 (CycleOrder)</p>
        </div>

        {timerState.isRunning && currentStage && (
          <Card className="p-6 md:p-8 text-center space-y-5 border-2">
            {appState?.currentStrategyName && (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">当前策略</p>
                <h3 className="text-lg font-semibold text-foreground">{appState?.currentStrategyName}</h3>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">当前阶段</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{currentStage.name}</h2>
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
                阶段 {timerState.currentStageIndex[0] + 1} / {stages?.length || 0}
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
                <ArrowCounterClockwise size={20} className="mr-2" />
                重置
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
              <StrategyManagementDialog
                currentStages={stages}
                currentLoop={loop}
                currentSettings={settings}
                onLoadStrategy={handleLoadStrategy}
                onRunStrategy={handleRunStrategy}
              >
                <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                  <StackSimple size={16} className="mr-1.5" />
                  策略
                </Button>
              </StrategyManagementDialog>
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
                      disabled={isMerged}
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
                    <div className="pl-7 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <Badge variant="secondary" className="text-xs">
                          {isEmbedded ? '嵌入策略' : '合并阶段'}
                        </Badge>
                        <span className="text-muted-foreground">
                          {stage.duration} {getTimeUnitLabel(stage.unit)}
                        </span>
                        {isEmbedded && stage.embeddedStrategyStages && (
                          <span className="text-muted-foreground">
                            · {stage.embeddedStrategyStages.length} 个子阶段
                          </span>
                        )}
                      </div>
                      <StageViewDialog stage={stage}>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          <Eye size={14} className="mr-1.5" />
                          查看详情
                        </Button>
                      </StageViewDialog>
                    </div>
                  )}
                  
                  {!isMerged && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pl-7" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          value={stage.duration}
                          onChange={(e) => updateStage(stage.id, { duration: parseFloat(e.target.value) || 0 })}
                          className="w-20 h-8 text-sm"
                          placeholder="时长"
                          step="0.1"
                        />
                        <Select value={stage.unit} onValueChange={(value: TimeUnit) => updateStage(stage.id, { unit: value })}>
                          <SelectTrigger className="w-24 h-8 text-sm">
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
                      <div className="flex gap-2">
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

        <Card className="p-4 md:p-5 space-y-3">
          <h3 className="text-lg font-semibold">全局设置</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
              <label className="text-sm font-medium">阶段切换提醒</label>
              <Switch
                checked={settings?.showFullscreenAlert ?? true}
                onCheckedChange={(checked) => setSettings((s) => ({ 
                  showFullscreenAlert: checked,
                  forceAcknowledge: s?.forceAcknowledge ?? false,
                  wallpaperMode: s?.wallpaperMode ?? 'random',
                  selectedWallpaper: s?.selectedWallpaper,
                  enableVibration: s?.enableVibration ?? true,
                  muteAudio: s?.muteAudio ?? false,
                }))}
              />
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
              <label className="text-sm font-medium">强制确认</label>
              <Switch
                checked={settings?.forceAcknowledge ?? false}
                onCheckedChange={(checked) => setSettings((s) => ({ 
                  showFullscreenAlert: s?.showFullscreenAlert ?? true,
                  forceAcknowledge: checked,
                  wallpaperMode: s?.wallpaperMode ?? 'random',
                  selectedWallpaper: s?.selectedWallpaper,
                  enableVibration: s?.enableVibration ?? true,
                  muteAudio: s?.muteAudio ?? false,
                }))}
              />
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
              <label className="text-sm font-medium">启用震动</label>
              <Switch
                checked={settings?.enableVibration ?? true}
                onCheckedChange={(checked) => setSettings((s) => ({
                  showFullscreenAlert: s?.showFullscreenAlert ?? true,
                  forceAcknowledge: s?.forceAcknowledge ?? false,
                  wallpaperMode: s?.wallpaperMode ?? 'random',
                  selectedWallpaper: s?.selectedWallpaper,
                  enableVibration: checked,
                  muteAudio: s?.muteAudio ?? false,
                }))}
              />
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/30">
              <label className="text-sm font-medium">静音</label>
              <Switch
                checked={settings?.muteAudio ?? false}
                onCheckedChange={(checked) => setSettings((s) => ({
                  showFullscreenAlert: s?.showFullscreenAlert ?? true,
                  forceAcknowledge: s?.forceAcknowledge ?? false,
                  wallpaperMode: s?.wallpaperMode ?? 'random',
                  selectedWallpaper: s?.selectedWallpaper,
                  enableVibration: s?.enableVibration ?? true,
                  muteAudio: checked,
                }))}
              />
            </div>
          </div>
        </Card>

        {!timerState.isRunning && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={handleStart} size="lg" className="px-12 h-12 text-base font-medium w-full sm:w-auto">
              <Play size={20} className="mr-2" weight="fill" />
              开始
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="sm:max-w-md relative overflow-hidden">
          {completedStage && completedStage.endSettings?.wallpaper && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
              style={{ 
                backgroundImage: `url(${
                  completedStage.endSettings.wallpaper.includes('|||')
                    ? completedStage.endSettings.wallpaper.split('|||')[1]
                    : completedStage.endSettings.wallpaper
                })` 
              }}
            />
          )}
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">阶段完成</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4 py-6">
              <p className="text-lg">
                <span className="font-semibold text-primary">{completedStage?.name}</span> 已完成
              </p>
              {currentStage && (
                <p className="text-muted-foreground">
                  下一阶段: <span className="font-medium">{currentStage.name}</span>
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
