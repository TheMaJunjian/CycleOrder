import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Stage, Loop, Settings, TimerState, TimeUnit, LoopMode } from '@/types'
import { convertToMilliseconds, formatTime, generateId, vibrateDevice } from '@/lib/timer-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Play, Pause, SkipForward, ArrowCounterClockwise, Plus, Trash, GearSix } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { StageSettingsDialog } from '@/components/StageSettingsDialog'

function App() {
  const [stages, setStages] = useKV<Stage[]>('timer-stages', [])
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
  const intervalRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const customSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused && stages && settings) {
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
            return {
              ...prev,
              currentStageIndex: [(prev.currentStageIndex[0] + 1) % stages.length],
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
  }, [timerState.isRunning, timerState.isPaused, timerState.currentStageIndex, stages, settings])

  const playStageRunningEffects = (stage: Stage) => {
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

    if (stage.endSettings.enableVibration) {
      if (stage.endSettings.vibrationPattern) {
        vibrateDevice(stage.endSettings.vibrationPattern)
      } else {
        vibrateDevice([200, 100, 200, 100, 400])
      }
    }

    if (!settings?.muteAudio) {
      if (stage.endSettings.soundFile && !stage.endSettings.randomSound) {
        playEndSound(stage.endSettings.soundFile)
      } else {
        playBeep()
      }
    }

    if (settings?.showFullscreenAlert) {
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
      toast.error('请先添加阶段')
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

  const currentStage = stages ? stages[timerState.currentStageIndex[0]] : undefined
  const remainingTime = currentStage
    ? convertToMilliseconds(currentStage.duration, currentStage.unit) - timerState.currentStageElapsed
    : 0

  if (!stages || !settings) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">加载中...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-foreground">循环提醒工具</h1>
          <p className="text-muted-foreground">多阶段循环计时器</p>
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

        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">阶段设置</h3>
            <Button onClick={addStage} size="sm">
              <Plus className="mr-2" />
              添加阶段
            </Button>
          </div>

          <div className="space-y-3">
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground w-8">{index + 1}</span>
                <Input
                  value={stage.name}
                  onChange={(e) => updateStage(stage.id, { name: e.target.value })}
                  className="flex-1"
                  placeholder="阶段名称"
                />
                <Input
                  type="number"
                  value={stage.duration}
                  onChange={(e) => updateStage(stage.id, { duration: parseFloat(e.target.value) || 0 })}
                  className="w-24"
                  step="0.1"
                />
                <Select value={stage.unit} onValueChange={(value: TimeUnit) => updateStage(stage.id, { unit: value })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">秒</SelectItem>
                    <SelectItem value="minutes">分钟</SelectItem>
                    <SelectItem value="hours">小时</SelectItem>
                    <SelectItem value="days">天</SelectItem>
                  </SelectContent>
                </Select>
                <StageSettingsDialog
                  stage={stage}
                  onUpdate={(updates) => updateStage(stage.id, updates)}
                >
                  <Button variant="outline" size="icon">
                    <GearSix />
                  </Button>
                </StageSettingsDialog>
                <Button onClick={() => deleteStage(stage.id)} variant="destructive" size="icon">
                  <Trash />
                </Button>
              </div>
            ))}
            {stages.length === 0 && (
              <p className="text-center text-muted-foreground py-8">还没有阶段，点击上方按钮添加</p>
            )}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-xl font-semibold">提醒设置</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
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
            <div className="flex items-center justify-between">
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

        <div className="flex gap-3 justify-center">
          {!timerState.isRunning ? (
            <Button onClick={handleStart} size="lg" className="px-8">
              <Play className="mr-2" weight="fill" />
              开始
            </Button>
          ) : (
            <>
              <Button onClick={handlePause} size="lg" variant="secondary">
                <Pause className="mr-2" weight="fill" />
                {timerState.isPaused ? '继续' : '暂停'}
              </Button>
              <Button onClick={handleSkip} size="lg" variant="outline">
                <SkipForward className="mr-2" weight="fill" />
                跳过
              </Button>
              <Button onClick={handleReset} size="lg" variant="destructive">
                <ArrowCounterClockwise className="mr-2" />
                重置
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={showAlert} onOpenChange={setShowAlert}>
        <DialogContent className="sm:max-w-md relative overflow-hidden">
          {currentStage && currentStage.endSettings.wallpaper && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: `url(${currentStage.endSettings.wallpaper})` }}
            />
          )}
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">阶段完成</DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4 py-6">
              <p className="text-lg">
                <span className="font-semibold text-primary">{currentStage?.name}</span> 已完成
              </p>
              {stages[timerState.currentStageIndex[0]] && (
                <p className="text-muted-foreground">
                  下一阶段: <span className="font-medium">{stages[timerState.currentStageIndex[0]]?.name}</span>
                </p>
              )}
              <Button onClick={() => setShowAlert(false)} className="w-full">
                继续
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App
