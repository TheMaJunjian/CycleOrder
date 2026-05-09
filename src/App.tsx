import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Stage, Loop, Settings, TimerState, TimeUnit, LoopMode, StrategyLoadMode } from '@/types'
import { convertToMilliseconds, formatTime, generateId, vibrateDevice, TIME_UNITS } from '@/lib/timer-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Play, Pause, SkipForward, ArrowCounterClockwise, Plus, Trash, GearSix, Repeat, Copy, Unite, StackSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { StageSettingsDialog } from '@/components/StageSettingsDialog'
import { LoopSettingsDialog } from '@/components/LoopSettingsDialog'
import { StrategyManagementDialog } from '@/components/StrategyManagementDialog'

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
      
      if (currentStage) {
        playStageRunningEffects(currentStage)
      }

      intervalRef.current = window.setInterval(() => {
        setTimerState((prev) => {
          const newElapsed = prev.currentStageElapsed + 100
          const currentStage = stages[prev.currentStageIndex[0]]
          
          if (!currentStage) return prev

          const stageDuration = convertToMilliseconds(currentStage.duration, currentStage.unit)

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
      stopAllEffects()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      stopAllEffects()
    }
  }, [timerState.isRunning, timerState.isPaused, timerState.currentStageIndex, stages, settings, loop])

  const playStageRunningEffects = (stage: Stage) => {
    if (!stage.runningSettings) return

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

  const playCustomSound = (soundDataUrl: string) => {
    try {
      if (customSoundRef.current) {
        customSoundRef.current.pause()
        customSoundRef.current = null
      }

      const audio = new Audio(soundDataUrl)
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
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop()
      noiseSourceRef.current = null
    }
    if (customSoundRef.current) {
      customSoundRef.current.pause()
      customSoundRef.current = null
    }
  }

  const handleStageComplete = (stage: Stage) => {
    stopAllEffects()

    if (stage.endSettings?.enableVibration) {
      if (stage.endSettings.vibrationPattern) {
        vibrateDevice(stage.endSettings.vibrationPattern)
      } else {
        vibrateDevice([200, 100, 200, 100, 400])
      }
    }

    if (!settings?.muteAudio && stage.endSettings) {
      if (stage.endSettings.soundFile && !stage.endSettings.randomSound) {
        playEndSound(stage.endSettings.soundFile)
      } else {
        playBeep()
      }
    }

    if (settings?.showFullscreenAlert) {
      setCompletedStage(stage)
      setShowAlert(true)
    }
  }

  const playEndSound = (soundDataUrl: string) => {
    try {
      const audio = new Audio(soundDataUrl)
      audio.volume = 0.5
      audio.play().catch((e) => console.error('Failed to play end sound', e))
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
    setTimerState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const handleSkip = () => {
    if (!stages) return
    setTimerState((prev) => ({
      ...prev,
      currentStageIndex: [(prev.currentStageIndex[0] + 1) % stages.length],
      currentStageElapsed: 0,
    }))
  }

  const handleReset = () => {
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

  const toggleStageSelection = (id: string) => {
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
    if (!stages || selectedStageIds.size < 2) {
      toast.error('请至少选择两个阶段进行合并')
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

  if (!stages || !settings || !loop) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">加载中...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">环序</h1>
          <p className="text-muted-foreground">CycleOrder - 多阶段循环计时器</p>
        </div>

        {timerState.isRunning && currentStage && (
          <Card className="p-8 text-center space-y-4 bg-card/80 backdrop-blur">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">当前阶段</p>
              <h2 className="text-3xl font-bold text-primary">{currentStage.name}</h2>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">剩余时间</p>
              <div className="text-5xl font-bold text-accent">{formatTime(remainingTime)}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Repeat size={16} />
                <span className="text-center">{getLoopModeLabel(loop.loopMode)}</span>
              </div>
              {loop.loopMode === 'fixed-count' && loop.loopCount && (
                <Badge variant="secondary">
                  第 {(loop.currentIteration || 0) + 1} / {loop.loopCount} 次
                </Badge>
              )}
              {loop.loopMode === 'time-limited' && loop.loopDuration && loop.loopDurationUnit && (
                <Badge variant="secondary" className="text-center">
                  已用 {formatTime(loop.totalElapsed || 0)} / {loop.loopDuration} {loop.loopDurationUnit}
                </Badge>
              )}
              {loop.loopMode === 'infinite' && (
                <Badge variant="secondary">第 {(loop.currentIteration || 0) + 1} 次循环</Badge>
              )}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-100"
                style={{
                  width: `${(timerState.currentStageElapsed / convertToMilliseconds(currentStage.duration, currentStage.unit)) * 100}%`,
                }}
              />
            </div>
          </Card>
        )}

        <Card className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">阶段设置</h3>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {selectedStageIds.size > 0 && (
                <>
                  <Button 
                    onClick={mergeSelectedStages} 
                    size="sm" 
                    variant="secondary"
                    className="flex-1 sm:flex-initial"
                  >
                    <Unite className="mr-2" />
                    <span className="hidden sm:inline">合并选中 ({selectedStageIds.size})</span>
                    <span className="sm:hidden">合并 ({selectedStageIds.size})</span>
                  </Button>
                  <Button 
                    onClick={clearSelection} 
                    size="sm" 
                    variant="outline"
                    className="flex-1 sm:flex-initial"
                  >
                    取消选择
                  </Button>
                </>
              )}
              <StrategyManagementDialog
                currentStages={stages}
                currentLoop={loop}
                currentSettings={settings}
                onLoadStrategy={handleLoadStrategy}
              >
                <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                  <StackSimple className="mr-2" />
                  <span className="hidden sm:inline">策略管理</span>
                  <span className="sm:hidden">策略</span>
                </Button>
              </StrategyManagementDialog>
              <LoopSettingsDialog loop={loop} onUpdate={updateLoop}>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
                  <Repeat className="mr-2" />
                  <span className="hidden sm:inline">循环设置</span>
                  <span className="sm:hidden">循环</span>
                </Button>
              </LoopSettingsDialog>
              <Button onClick={addStage} size="sm" className="flex-1 sm:flex-initial">
                <Plus className="mr-2" />
                <span className="hidden sm:inline">添加阶段</span>
                <span className="sm:hidden">添加</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {stages.map((stage, index) => {
              const isMerged = stage.isMerged === true
              const isEmbedded = stage.isEmbeddedStrategy === true
              return (
                <div 
                  key={stage.id} 
                  className={`p-3 rounded-lg space-y-3 transition-colors ${
                    isMerged 
                      ? 'bg-accent/10 border-2 border-accent' 
                      : selectedStageIds.has(stage.id) 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'bg-muted/50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <input
                      type="checkbox"
                      checked={selectedStageIds.has(stage.id)}
                      onChange={() => toggleStageSelection(stage.id)}
                      className="w-4 h-4 shrink-0 cursor-pointer"
                      aria-label="选择阶段"
                    />
                    <span className="text-sm font-medium text-muted-foreground w-6 sm:w-8 text-center shrink-0">{index + 1}</span>
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                      disabled={isMerged}
                      className="flex-1"
                    />
                    {!isMerged && (
                      <Button 
                        onClick={() => duplicateStage(stage.id)} 
                        variant="outline" 
                        size="icon"
                        className="shrink-0"
                      >
                        <Copy />
                      </Button>
                    )}
                    <Button 
                      onClick={() => deleteStage(stage.id)} 
                      variant="destructive" 
                      size="icon" 
                      className="shrink-0"
                      title={isMerged ? '移除' : '删除阶段'}
                    >
                      <Trash />
                    </Button>
                  </div>
                  {isMerged && (
                    <div className="pl-6 sm:pl-11 space-y-2">
                      <Badge variant="secondary">
                        {isEmbedded ? '嵌入策略' : '合并阶段'}
                      </Badge>
                      {isEmbedded && stage.embeddedStrategyStages && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-accent/80">查看子阶段详情 ({stage.embeddedStrategyStages.length}个)</summary>
                          <div className="mt-2 pl-4 space-y-1">
                            {stage.embeddedStrategyStages.map((subStage, idx) => (
                              <div key={idx}>
                                {subStage.name} - {subStage.duration} {subStage.unit}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                  {!isMerged && (
                    <div className="flex items-center gap-2 pl-6 sm:pl-11">
                      <Input
                        type="number"
                        value={stage.duration}
                        onChange={(e) => updateStage(stage.id, { duration: parseFloat(e.target.value) || 0 })}
                        value={stage.duration}
                        onChange={(e) => updateStage(stage.id, { duration: parseFloat(e.target.value) || 0 })}
                      <Select value={stage.unit} onValueChange={(value: TimeUnit) => updateStage(stage.id, { unit: value })}>
                        <SelectTrigger className="flex-1 sm:flex-initial sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nanoseconds">纳秒</SelectItem>
                          <SelectItem value="microseconds">微秒</SelectItem>
                          <SelectItem value="milliseconds">毫秒</SelectItem>
                          <SelectItem value="seconds">秒</SelectItem>
                          <SelectItem value="minutes">分钟</SelectItem>
                          <SelectItem value="hours">小时</SelectItem>
                          <SelectItem value="days">天</SelectItem>
                          <SelectItem value="months">月</SelectItem>
                          <SelectItem value="years">年</SelectItem>
                        </SelectContent>
                      </Select>
                      <StageSettingsDialog
                        stage={stage}
                        onUpdate={(updates) => updateStage(stage.id, updates)}
                      >
                        <Button variant="outline" size="icon" className="shrink-0">
                          <GearSix />
                        </Button>
                      </StageSettingsDialog>
                    </div>
                  )}
                </div>
              )
            })}
            {stages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">还没有阶段，点击上方按钮添加</p>
            )}
          </div>
        </Card>

        <Card className="p-4 sm:p-6 space-y-4">
          <h3 className="text-xl font-semibold">提醒设置</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm">阶段切换全屏提醒</label>
              <Switch
                checked={settings.showFullscreenAlert}
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
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm">强制确认提醒</label>
              <Switch
                checked={settings.forceAcknowledge}
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
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm">启用震动</label>
              <Switch
                checked={settings.enableVibration}
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
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm">静音模式</label>
              <Switch
                checked={settings.muteAudio}
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

        <div className="flex flex-wrap gap-3 justify-center">
          {!timerState.isRunning ? (
            <Button onClick={handleStart} size="lg" className="px-8 w-full sm:w-auto">
              <Play className="mr-2" weight="fill" />
              开始
            </Button>
          ) : (
            <>
              <Button onClick={handlePause} size="lg" variant="secondary" className="flex-1 sm:flex-initial">
                <Pause className="mr-2" weight="fill" />
                {timerState.isPaused ? '继续' : '暂停'}
              </Button>
              <Button onClick={handleSkip} size="lg" variant="outline" className="flex-1 sm:flex-initial">
                <SkipForward className="mr-2" weight="fill" />
                跳过
              </Button>
              <Button onClick={handleReset} size="lg" variant="destructive" className="flex-1 sm:flex-initial">
                <ArrowCounterClockwise className="mr-2" />
                重置
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="sm:max-w-md relative overflow-hidden">
          {completedStage && completedStage.endSettings?.wallpaper && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${completedStage.endSettings.wallpaper})` }}
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
                  下一阶段: <span className="font-medium">{currentStage.name}</span>
            </div>
      </Dialog>
    </div>
  )
        </DialogContent>
      </Dialog>
export default App
