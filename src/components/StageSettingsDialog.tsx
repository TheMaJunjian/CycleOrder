import { useEffect, useState, useRef } from 'react'
import { Stage, TimeUnit, AlertTiming } from '@/types'
import { createAudioReference, getAudioDisplayName, listLocalAudio, saveLocalAudio, LocalAudioFile } from '@/lib/audio-storage'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SpeakerHigh, Image, Vibrate, Upload, Clock, CaretDown, CaretUp } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface StageSettingsDialogProps {
  stage: Stage
  onUpdate: (updates: Partial<Stage>) => void
  children: React.ReactNode
}

const NO_AUDIO_VALUE = '__no-audio__'

export function StageSettingsDialog({ stage, onUpdate, children }: StageSettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [audioLibrary, setAudioLibrary] = useState<LocalAudioFile[]>([])
  const [runningAudioSelectOpen, setRunningAudioSelectOpen] = useState(false)
  const [endAudioSelectOpen, setEndAudioSelectOpen] = useState(false)
  const soundRunningRef = useRef<HTMLInputElement>(null)
  const soundEndRef = useRef<HTMLInputElement>(null)
  const wallpaperRunningRef = useRef<HTMLInputElement>(null)
  const wallpaperEndRef = useRef<HTMLInputElement>(null)

  const runningSettings = stage.runningSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,
    enableVibration: true,
  }

  const endSettings = stage.endSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,
    enableVibration: true,
  }

  useEffect(() => {
    if (!open) return

    listLocalAudio()
      .then(setAudioLibrary)
      .catch(() => toast.error('无法读取上传音频库'))
  }, [open])

  const updateSoundSelection = (type: 'sound-running' | 'sound-end', audioId: string) => {
    if (audioId === NO_AUDIO_VALUE) {
      if (type === 'sound-running') {
        onUpdate({ runningSettings: { ...runningSettings, soundFile: undefined } })
      } else {
        onUpdate({ endSettings: { ...endSettings, soundFile: undefined } })
      }
      toast.success('已清除当前音效')
      if (type === 'sound-running') {
        setRunningAudioSelectOpen(false)
      } else {
        setEndAudioSelectOpen(false)
      }
      return
    }

    const audio = audioLibrary.find((item) => item.id === audioId)
    if (!audio) return

    if (type === 'sound-running') {
      onUpdate({
        runningSettings: {
          ...runningSettings,
          soundFile: createAudioReference(audio),
        },
      })
    } else {
      onUpdate({
        endSettings: {
          ...endSettings,
          soundFile: createAudioReference(audio),
        },
      })
    }
    if (type === 'sound-running') {
      setRunningAudioSelectOpen(false)
    } else {
      setEndAudioSelectOpen(false)
    }
    toast.success(`已选择上传音频：${audio.name}`)
  }

  const handleFileUpload = (
    file: File | undefined,
    type: 'sound-running' | 'sound-end' | 'wallpaper-running' | 'wallpaper-end'
  ) => {
    if (!file) return

    if (type === 'sound-running' || type === 'sound-end') {
      saveLocalAudio(file)
        .then((audio) => {
          setAudioLibrary((current) => [audio, ...current.filter((item) => item.id !== audio.id)])
          const soundFile = createAudioReference(audio)

          if (type === 'sound-running') {
            onUpdate({
              runningSettings: {
                ...runningSettings,
                soundFile,
              },
            })
          } else {
            onUpdate({
              endSettings: {
                ...endSettings,
                soundFile,
              },
            })
          }
          toast.success('音频已保存到本机，并已应用到当前阶段')
        })
        .catch(() => toast.error('音频保存失败，请检查浏览器存储空间'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const fileNameData = `${file.name}|||${dataUrl}`

      const runningSettings = stage.runningSettings || {
        randomSound: false,
        wallpaperMode: 'random' as const,
        enableVibration: true,
      }
      const endSettings = stage.endSettings || {
        randomSound: false,
        wallpaperMode: 'random' as const,
        enableVibration: true,
      }

      if (type === 'wallpaper-running') {
        onUpdate({
          runningSettings: {
            ...runningSettings,
            wallpaper: fileNameData,
          },
        })
        toast.success('运行壁纸已上传')
      } else if (type === 'wallpaper-end') {
        onUpdate({
          endSettings: {
            ...endSettings,
            wallpaper: fileNameData,
          },
        })
        toast.success('结束壁纸已上传')
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">阶段设置 - {stage.name}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            音频仅保存在本机浏览器，不会上传服务器；清除站点数据后需要重新上传，也不会跨设备同步。
          </p>
        </DialogHeader>
        <Tabs defaultValue="running" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="running">运行时提示</TabsTrigger>
            <TabsTrigger value="end">结束时提示</TabsTrigger>
          </TabsList>
          <TabsContent value="running" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SpeakerHigh className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">音效设置</h3>
              </div>
              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between">
                  <Label>随机音效</Label>
                  <Switch
                    checked={runningSettings.randomSound}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        runningSettings: {
                          ...runningSettings,
                          randomSound: checked,
                        },
                      })
                    }
                  />
                </div>

                {!runningSettings.randomSound && (
                  <div className="space-y-2">
                    <Label>上传音效文件</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="audio/*"
                        ref={soundRunningRef}
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'sound-running')}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => soundRunningRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="mr-2" />
                        选择音效
                      </Button>
                      {runningSettings.soundFile && (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            onUpdate({
                              runningSettings: {
                                ...runningSettings,
                                soundFile: undefined,
                              },
                            })
                          }
                        >
                          清除
                        </Button>
                      )}
                    </div>
                    {audioLibrary.length > 0 && (
                      <div className="space-y-1">
                        <Button type="button" variant="outline" className="w-full justify-between font-normal" onClick={() => setRunningAudioSelectOpen((isOpen) => !isOpen)}>
                          <span className="truncate">{getAudioDisplayName(runningSettings.soundFile) || '从上传音频库选择'}</span>
                          {runningAudioSelectOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
                        </Button>
                        {runningAudioSelectOpen && (
                          <div className="rounded-md border bg-popover p-1 shadow-sm">
                            <button type="button" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => updateSoundSelection('sound-running', NO_AUDIO_VALUE)}>不使用自定义音效</button>
                            {audioLibrary.map((audio) => (
                              <button key={audio.id} type="button" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => updateSoundSelection('sound-running', audio.id)}>{audio.name}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {runningSettings.soundFile && (
                      <p className="text-sm text-muted-foreground truncate">
                        当前音频：{getAudioDisplayName(runningSettings.soundFile) || '已上传音效文件'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">壁纸设置</h3>
              </div>
              
              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between">
                  <Label>随机壁纸</Label>
                  <Switch
                    checked={runningSettings.wallpaperMode === 'random'}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        runningSettings: {
                          ...runningSettings,
                          wallpaperMode: checked ? 'random' : 'fixed',
                        },
                      })
                    }
                  />
                </div>

                {runningSettings.wallpaperMode === 'fixed' && (
                  <div className="space-y-2">
                    <Label>上传壁纸文件</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        ref={wallpaperRunningRef}
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'wallpaper-running')}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => wallpaperRunningRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="mr-2" />
                        选择壁纸
                      </Button>
                      {runningSettings.wallpaper && (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            onUpdate({
                              runningSettings: {
                                ...runningSettings,
                                wallpaper: undefined,
                              },
                            })
                          }
                        >
                          清除
                        </Button>
                      )}
                    </div>
                    {runningSettings.wallpaper && (
                      <p className="text-sm text-muted-foreground truncate">
                        {runningSettings.wallpaper.includes('|||')
                          ? runningSettings.wallpaper.split('|||')[0]
                          : '已上传壁纸文件'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Vibrate className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">震动设置</h3>
              </div>
              
              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between">
                  <Label>启用震动</Label>
                  <Switch
                    checked={runningSettings.enableVibration}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        runningSettings: {
                          ...runningSettings,
                          enableVibration: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="end" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">提示时间</h3>
              </div>
              
              <div className="space-y-3 pl-9">
                <p className="text-sm text-muted-foreground">设置提示播放的时间和位置</p>
                
                <div className="space-y-2">
                  <Label>提示位置</Label>
                  <Select 
                    value={endSettings.alertTiming ?? 'inside'} 
                    onValueChange={(value: AlertTiming) =>
                      onUpdate({
                        endSettings: {
                          ...endSettings,
                          alertTiming: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inside">阶段内</SelectItem>
                      <SelectItem value="outside">阶段外</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={Math.abs(endSettings.alertTime ?? 0)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      onUpdate({
                        endSettings: {
                          ...endSettings,
                          alertTime: value,
                        },
                      })
                    }}
                    className="w-32"
                    placeholder="0"
                    step="0.1"
                    min="0"
                  />
                  <Select 
                    value={endSettings.alertTimeUnit ?? 'seconds'} 
                    onValueChange={(value: TimeUnit) =>
                      onUpdate({
                        endSettings: {
                          ...endSettings,
                          alertTimeUnit: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="w-32">
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
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 为 0 时不播放提示</p>
                  <p>• <strong>阶段内</strong>：在当前阶段结束前指定时间开始播放</p>
                  <p>• <strong>阶段外</strong>：占用下一阶段的时长播放提示音效</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SpeakerHigh className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">音效设置</h3>
              </div>
              
              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between">
                  <Label>随机音效</Label>
                  <Switch
                    checked={endSettings.randomSound}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        endSettings: {
                          ...endSettings,
                          randomSound: checked,
                        },
                      })
                    }
                  />
                </div>

                {!endSettings.randomSound && (
                  <div className="space-y-2">
                    <Label>上传音效文件</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="audio/*"
                        ref={soundEndRef}
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'sound-end')}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => soundEndRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="mr-2" />
                        选择音效
                      </Button>
                      {endSettings.soundFile && (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            onUpdate({
                              endSettings: {
                                ...endSettings,
                                soundFile: undefined,
                              },
                            })
                          }
                        >
                          清除
                        </Button>
                      )}
                    </div>
                    {audioLibrary.length > 0 && (
                      <div className="space-y-1">
                        <Button type="button" variant="outline" className="w-full justify-between font-normal" onClick={() => setEndAudioSelectOpen((isOpen) => !isOpen)}>
                          <span className="truncate">{getAudioDisplayName(endSettings.soundFile) || '从上传音频库选择'}</span>
                          {endAudioSelectOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
                        </Button>
                        {endAudioSelectOpen && (
                          <div className="rounded-md border bg-popover p-1 shadow-sm">
                            <button type="button" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => updateSoundSelection('sound-end', NO_AUDIO_VALUE)}>不使用自定义音效</button>
                            {audioLibrary.map((audio) => (
                              <button key={audio.id} type="button" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => updateSoundSelection('sound-end', audio.id)}>{audio.name}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {endSettings.soundFile && (
                      <p className="text-sm text-muted-foreground truncate">
                        当前音频：{getAudioDisplayName(endSettings.soundFile) || '已上传音效文件'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">壁纸设置</h3>
              </div>
              
              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between">
                  <Label>随机壁纸</Label>
                  <Switch
                    checked={endSettings.wallpaperMode === 'random'}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        endSettings: {
                          ...endSettings,
                          wallpaperMode: checked ? 'random' : 'fixed',
                        },
                      })
                    }
                  />
                </div>

                {endSettings.wallpaperMode === 'fixed' && (
                  <div className="space-y-2">
                    <Label>上传壁纸文件</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        ref={wallpaperEndRef}
                        onChange={(e) => handleFileUpload(e.target.files?.[0], 'wallpaper-end')}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => wallpaperEndRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="mr-2" />
                        选择壁纸
                      </Button>
                      {endSettings.wallpaper && (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            onUpdate({
                              endSettings: {
                                ...endSettings,
                                wallpaper: undefined,
                              },
                            })
                          }
                        >
                          清除
                        </Button>
                      )}
                    </div>
                    {endSettings.wallpaper && (
                      <p className="text-sm text-muted-foreground truncate">
                        {endSettings.wallpaper.includes('|||')
                          ? endSettings.wallpaper.split('|||')[0]
                          : '已上传壁纸文件'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Vibrate className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">震动设置</h3>
              </div>
              
              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between">
                  <Label>启用震动</Label>
                  <Switch
                    checked={endSettings.enableVibration}
                    onCheckedChange={(checked) =>
                      onUpdate({
                        endSettings: {
                          ...endSettings,
                          enableVibration: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
