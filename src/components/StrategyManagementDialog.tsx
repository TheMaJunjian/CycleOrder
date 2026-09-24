import { useEffect, useRef, useState, ReactNode } from 'react'
import { Strategy, Stage, Loop, Settings, StrategyLoadMode, TimeUnit } from '@/types'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { FloppyDisk, FolderOpen, Trash, StackSimple, ListPlus, CaretDown, CaretUp, StackMinus, Play, Copy, ClipboardText, UploadSimple, DownloadSimple } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateId, formatTime, convertToMilliseconds } from '@/lib/timer-utils'
import { Badge } from '@/components/ui/badge'
import { createMissingAudioReference, createAudioReference, getAudioDisplayName, listLocalAudio } from '@/lib/audio-storage'

const getWallpaperName = (wallpaper: string): string => wallpaper.startsWith('missing-wallpaper://')
  ? decodeURIComponent(wallpaper.slice('missing-wallpaper://'.length))
  : wallpaper.split('|||')[0]

const migrateStageSoundIntensity = (stages: Stage[]): Stage[] => stages.map((stage) => ({
  ...stage,
  runningSettings: {
    ...stage.runningSettings,
    soundIntensity: stage.runningSettings?.soundIntensity ?? 'weak',
  },
  endSettings: {
    ...stage.endSettings,
    soundIntensity: stage.endSettings?.soundIntensity ?? 'strong',
  },
  embeddedStrategyStages: stage.embeddedStrategyStages
    ? migrateStageSoundIntensity(stage.embeddedStrategyStages)
    : stage.embeddedStrategyStages,
}))

const migrateStrategySoundIntensity = (strategy: Strategy): Strategy => ({
  ...strategy,
  settings: {
    showFullscreenAlert: typeof strategy.settings?.showFullscreenAlert === 'boolean'
      ? strategy.settings.showFullscreenAlert
      : true,
    forceAcknowledge: typeof strategy.settings?.forceAcknowledge === 'boolean'
      ? strategy.settings.forceAcknowledge
      : false,
    wallpaperMode: strategy.settings?.wallpaperMode === 'fixed' ? 'fixed' : 'random',
    selectedWallpaper: typeof strategy.settings?.selectedWallpaper === 'string'
      ? strategy.settings.selectedWallpaper
      : undefined,
    enableVibration: typeof strategy.settings?.enableVibration === 'boolean'
      ? strategy.settings.enableVibration
      : true,
    muteAudio: typeof strategy.settings?.muteAudio === 'boolean'
      ? strategy.settings.muteAudio
      : false,
  },
  stages: migrateStageSoundIntensity(strategy.stages),
  loop: {
    ...strategy.loop,
    loopDurationUnit: strategy.loop.loopDurationUnit && validTimeUnits.has(strategy.loop.loopDurationUnit)
      ? strategy.loop.loopDurationUnit
      : undefined,
    stages: migrateStageSoundIntensity(strategy.loop.stages || strategy.stages),
  },
})

const mapStrategyStages = (
  stages: Stage[],
  mapSound: (soundFile: string | undefined) => string | undefined,
  mapWallpaper: (wallpaper: string | undefined) => string | undefined
): Stage[] => stages.map((stage) => ({
  ...stage,
  runningSettings: {
    ...stage.runningSettings,
    soundFile: mapSound(stage.runningSettings?.soundFile),
    wallpaper: mapWallpaper(stage.runningSettings?.wallpaper),
  },
  endSettings: {
    ...stage.endSettings,
    soundFile: mapSound(stage.endSettings?.soundFile),
    wallpaper: mapWallpaper(stage.endSettings?.wallpaper),
  },
  embeddedStrategyStages: stage.embeddedStrategyStages
    ? mapStrategyStages(stage.embeddedStrategyStages, mapSound, mapWallpaper)
    : stage.embeddedStrategyStages,
}))

  const validTimeUnits = new Set<TimeUnit>([
    'nanoseconds', 'microseconds', 'milliseconds', 'seconds', 'minutes',
    'hours', 'days', 'months', 'years',
  ])

  const isValidStage = (value: unknown): value is Stage => {
    if (!value || typeof value !== 'object') return false
    const stage = value as Partial<Stage>
    const duration = stage.duration
    return typeof stage.id === 'string'
      && typeof stage.name === 'string'
      && typeof duration === 'number'
      && Number.isFinite(duration)
      && duration > 0
      && typeof stage.unit === 'string'
      && validTimeUnits.has(stage.unit)
      && (!stage.embeddedStrategyStages || (
        Array.isArray(stage.embeddedStrategyStages)
        && stage.embeddedStrategyStages.every(isValidStage)
      ))
  }

  const isValidStrategy = (value: unknown): value is Strategy => {
    if (!value || typeof value !== 'object') return false
    const strategy = value as Partial<Strategy>
    const loop = strategy.loop
    return typeof strategy.name === 'string'
      && strategy.name.trim().length > 0
      && Array.isArray(strategy.stages)
      && strategy.stages.length > 0
      && strategy.stages.every(isValidStage)
      && !!loop
      && typeof loop === 'object'
      && (loop.loopMode === 'infinite' || loop.loopMode === 'fixed-count' || loop.loopMode === 'time-limited')
      && (loop.loopMode !== 'time-limited' || !loop.loopDurationUnit || validTimeUnits.has(loop.loopDurationUnit))
      && (!loop.loopCount || (Number.isFinite(loop.loopCount) && loop.loopCount > 0))
      && (!loop.loopDuration || (Number.isFinite(loop.loopDuration) && loop.loopDuration > 0))
  }

interface StrategyManagementDialogProps {
  currentStages: Stage[] | undefined
  currentLoop: Loop | undefined
  currentSettings: Settings | undefined
  onLoadStrategy: (stages: Stage[], mode: StrategyLoadMode, strategyId: string, strategyName: string) => void
  onRunStrategy: (strategy: Strategy) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

export function StrategyManagementDialog({
  currentStages,
  currentLoop,
  currentSettings,
  onLoadStrategy,
  onRunStrategy,
  open: controlledOpen,
  onOpenChange: onControlledOpenChange,
  children,
}: StrategyManagementDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onControlledOpenChange ?? setInternalOpen
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    try {
      const storedStrategies = localStorage.getItem('cycle-order-saved-strategies')
      return storedStrategies
        ? (JSON.parse(storedStrategies) as Strategy[]).map(migrateStrategySoundIntensity)
        : []
    } catch {
      return []
    }
  })
  const [newStrategyName, setNewStrategyName] = useState('')
  const [newStrategyDescription, setNewStrategyDescription] = useState('')
  const [selectedStrategyIds, setSelectedStrategyIds] = useState<Set<string>>(new Set())
  const transferInputRef = useRef<HTMLInputElement>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferMode, setTransferMode] = useState<'import' | 'export'>('import')
  const [transferText, setTransferText] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('cycle-order-saved-strategies', JSON.stringify(strategies))
    } catch {
      toast.error('策略保存失败，请检查浏览器存储空间')
    }
  }, [strategies])

  const handleSaveCurrentStrategy = () => {
    if (!newStrategyName.trim()) {
      toast.error('请输入策略名称')
      return
    }

    if (!currentStages || currentStages.length === 0) {
      toast.error('当前没有阶段，无法保存策略')
      return
    }

    const newStrategy: Strategy = {
      id: generateId(),
      name: newStrategyName.trim(),
      description: newStrategyDescription.trim(),
      stages: currentStages || [],
      loop: currentLoop || {
        id: generateId(),
        name: '主循环',
        stages: [],
        loopMode: 'infinite',
        currentIteration: 0,
        totalElapsed: 0,
      },
      settings: currentSettings || {
        showFullscreenAlert: true,
        forceAcknowledge: false,
        wallpaperMode: 'random',
        enableVibration: true,
        muteAudio: false,
      },
      loadMode: 'expand',
      isCollapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setStrategies((current) => [...current, migrateStrategySoundIntensity(newStrategy)])
    setNewStrategyName('')
    setNewStrategyDescription('')
    toast.success(`策略"${newStrategy.name}"已保存`)
  }

  const handleRunStrategy = (strategy: Strategy) => {
    onRunStrategy(strategy)
    setOpen(false)
  }

  const handleLoadStrategy = (strategy: Strategy) => {
    const mode = strategy.loadMode || 'expand'
    onLoadStrategy(strategy.stages, mode, strategy.id, strategy.name)
    toast.success(`策略"${strategy.name}"已${mode === 'expand' ? '展开' : '嵌入'}加载`)
  }

  const handleDeleteStrategy = (id: string) => {
    setStrategies((current) => current.filter((s) => s.id !== id))
    setSelectedStrategyIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
    toast.success('策略已删除')
  }

  const toggleStrategySelection = (id: string) => {
    setSelectedStrategyIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getSelectedStrategiesExport = (): string | undefined => {
    const selectedStrategies = strategies.filter((strategy) => selectedStrategyIds.has(strategy.id))
    if (selectedStrategies.length === 0) {
      toast.error('请先选择要导出的策略')
      return undefined
    }

    const exportedStrategies = selectedStrategies.map((strategy) => {
      const mapSound = (soundFile: string | undefined) => soundFile ? getAudioDisplayName(soundFile) : undefined
      const mapWallpaper = (wallpaper: string | undefined) => wallpaper ? getWallpaperName(wallpaper) : undefined
      return {
        ...strategy,
        stages: mapStrategyStages(strategy.stages, mapSound, mapWallpaper),
        loop: {
          ...strategy.loop,
          stages: mapStrategyStages(strategy.loop.stages || strategy.stages, mapSound, mapWallpaper),
        },
      }
    })
    return JSON.stringify({ version: 1, strategies: exportedStrategies }, null, 2)
  }

  const openExportDialog = () => {
    const exportedData = getSelectedStrategiesExport()
    if (!exportedData) return
    setTransferMode('export')
    setTransferText(exportedData)
    setTransferOpen(true)
  }

  const downloadTransferData = () => {
    if (!transferText.trim()) {
      toast.error('没有可下载的数据')
      return
    }
    const blob = new Blob([transferText], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cycle-order-strategies-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('已下载策略数据')
  }

  const importStrategiesFromText = async (text: string) => {
    try {
      const parsed: unknown = JSON.parse(text)
      const importedStrategies = Array.isArray(parsed)
        ? parsed
        : (parsed && typeof parsed === 'object' && 'strategies' in parsed && Array.isArray(parsed.strategies)
          ? parsed.strategies
          : [])
      if (importedStrategies.length === 0) throw new Error('文件中没有策略')
      const invalidStrategyCount = importedStrategies.filter((value) => !isValidStrategy(value)).length
      if (invalidStrategyCount > 0) {
        throw new Error(`文件中有 ${invalidStrategyCount} 个策略结构无效`)
      }

      const audioLibrary = await listLocalAudio()
      const missingAudioNames = new Set<string>()
      const restoreSound = (soundFile: string | undefined) => {
        if (!soundFile) return undefined
        const name = getAudioDisplayName(soundFile)
        const localAudio = audioLibrary.find((audio) => audio.name === name)
        if (localAudio) return createAudioReference(localAudio)
        missingAudioNames.add(name)
        return createMissingAudioReference(name)
      }
      const restoreWallpaper = (wallpaper: string | undefined) => wallpaper
        ? `missing-wallpaper://${encodeURIComponent(wallpaper.split('|||')[0].replace('missing-wallpaper://', ''))}`
        : undefined
      const restoredStrategies = importedStrategies.map((value) => {
        const strategy = value
        return migrateStrategySoundIntensity({
          ...strategy,
          id: generateId(),
          stages: mapStrategyStages(strategy.stages || [], restoreSound, restoreWallpaper),
          loop: {
            ...strategy.loop,
            stages: mapStrategyStages(strategy.loop?.stages || strategy.stages || [], restoreSound, restoreWallpaper),
          },
        })
      })

      setStrategies((current) => [...current, ...restoredStrategies])
      if (missingAudioNames.size > 0) {
        toast.warning(`已导入策略，但 ${missingAudioNames.size} 个音频文件未找到，将按无音效处理`)
      } else {
        toast.success(`已导入 ${restoredStrategies.length} 个策略`)
      }
    } catch (error) {
      console.error('[strategy-import] Failed to import strategies', error)
      toast.error('策略导入失败，请选择有效的策略 JSON 文件')
    }
  }

  const handleImportStrategies = async (file: File | undefined) => {
    if (!file) return
    setTransferMode('import')
    await importStrategiesFromText(await file.text())
    setTransferOpen(false)
  }

  const openImportDialog = () => {
    setTransferMode('import')
    setTransferText('')
    setTransferOpen(true)
  }

  const copyTransferData = async () => {
    try {
      await navigator.clipboard.writeText(transferText)
      toast.success('数据已复制到剪贴板')
    } catch {
      toast.error('复制失败，请手动选择文本复制')
    }
  }

  const pasteTransferData = async () => {
    try {
      setTransferText(await navigator.clipboard.readText())
      toast.success('已从剪贴板粘贴数据')
    } catch {
      toast.error('粘贴失败，请手动粘贴到文本框')
    }
  }

  const importTransferData = async () => {
    if (!transferText.trim()) {
      transferInputRef.current?.click()
      return
    }
    await importStrategiesFromText(transferText)
    setTransferOpen(false)
  }

  const toggleStrategyLoadMode = (id: string) => {
    setStrategies((current) =>
      current.map((s) => 
        s.id === id 
          ? { ...s, loadMode: s.loadMode === 'expand' ? 'embed' : 'expand' }
          : s
      )
    )
  }

  const toggleStrategyCollapsed = (id: string) => {
    setStrategies((current) =>
      current.map((s) => 
        s.id === id 
          ? { ...s, isCollapsed: !s.isCollapsed }
          : s
      )
    )
  }

  const getTotalDuration = (stages: Stage[]): string => {
    let totalMs = 0
    stages.forEach((stage) => {
      totalMs += convertToMilliseconds(stage.duration, stage.unit)
    })
    return formatTime(totalMs)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <StackSimple className="text-primary" />
            策略管理
          </DialogTitle>
          <DialogDescription className="sr-only">保存、导入、导出或运行阶段策略。</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card className="p-4 sm:p-6 space-y-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <FloppyDisk className="text-primary" size={20} />
              <h3 className="text-lg font-semibold">保存当前配置为策略</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>策略名称</Label>
                <Input
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="例如：护眼20-20-20"
                />
              </div>
              <div className="space-y-2">
                <Label>策略描述（可选）</Label>
                <Textarea
                  value={newStrategyDescription}
                  onChange={(e) => setNewStrategyDescription(e.target.value)}
                  placeholder="描述这个策略的用途..."
                />
              </div>
              <Button 
                onClick={handleSaveCurrentStrategy} 
                className="w-full"
                disabled={!currentStages || currentStages.length === 0}
              >
                <FloppyDisk className="mr-2" />
                保存策略
              </Button>
              {(!currentStages || currentStages.length === 0) && (
                <p className="text-sm text-destructive text-center">请先添加阶段才能保存策略</p>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
              <FolderOpen className="text-primary" size={20} />
              <h3 className="text-lg font-semibold">已保存的策略</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={openImportDialog}>
                  导入策略
                </Button>
                <Button variant="outline" size="sm" onClick={openExportDialog} disabled={selectedStrategyIds.size === 0}>
                  导出已选 ({selectedStrategyIds.size})
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {!strategies || strategies.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground bg-muted/20">
                  <p>还没有保存的策略</p>
                  <p className="text-sm mt-2">保存当前配置以便快速复用</p>
                </Card>
              ) : (
                strategies.map((strategy) => (
                  <Card key={strategy.id} className="p-3 sm:p-4 bg-card/80 hover:bg-card transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              aria-label={`选择策略 ${strategy.name}`}
                              checked={selectedStrategyIds.has(strategy.id)}
                              onChange={() => toggleStrategySelection(strategy.id)}
                            />
                            <h4 className="font-semibold text-base sm:text-lg truncate">{strategy.name}</h4>
                          </div>
                          {strategy.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{strategy.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleStrategyCollapsed(strategy.id)}
                            title={strategy.isCollapsed ? '展开详情' : '折叠详情'}
                          >
                            {strategy.isCollapsed ? <CaretDown /> : <CaretUp />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteStrategy(strategy.id)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </div>

                      {!strategy.isCollapsed && (
                        <>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {strategy.stages.length} 个阶段
                            </Badge>
                            <Badge variant="secondary">
                              总时长: {getTotalDuration(strategy.stages)}
                            </Badge>
                            <Badge variant="secondary">
                              {strategy.loop.loopMode === 'infinite' && '无限循环'}
                              {strategy.loop.loopMode === 'fixed-count' && `${strategy.loop.loopCount}次循环`}
                              {strategy.loop.loopMode === 'time-limited' && '限时循环'}
                            </Badge>
                            <Badge variant="secondary">
                              {new Date(strategy.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground">加载后预览：</div>
                            <div className="bg-muted/20 p-3 rounded border-2 border-dashed border-border space-y-2">
                              {strategy.loadMode === 'expand' ? (
                                <div className="space-y-1">
                                  <div className="mb-2 text-xs font-medium text-amber-800">展开模式 - 将显示所有子阶段</div>
                                  {strategy.stages.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-background/50 p-2 rounded text-xs">
                                      <span className="font-medium text-muted-foreground w-6">{idx + 1}</span>
                                      <span className="flex-1 truncate">{stage.name}</span>
                                      <span className="text-muted-foreground shrink-0">
                                        {stage.duration}{stage.unit === 'minutes' ? '分' : stage.unit === 'seconds' ? '秒' : stage.unit === 'hours' ? '时' : stage.unit === 'days' ? '天' : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-xs text-primary font-medium mb-2">嵌入模式 - 将显示为单个合并阶段</div>
                                  <div className="flex items-center gap-2 bg-accent/10 border-2 border-accent p-3 rounded">
                                    <span className="font-medium text-muted-foreground w-6">1</span>
                                    <span className="flex-1 font-medium">{strategy.name}</span>
                                    <Badge variant="secondary" className="shrink-0 text-xs">
                                      {getTotalDuration(strategy.stages)}
                                    </Badge>
                                  </div>
                                  <details className="text-xs mt-2">
                                    <summary className="cursor-pointer pl-2 text-amber-800 hover:text-amber-900">包含 {strategy.stages.length} 个子阶段</summary>
                                    <div className="mt-2 space-y-1 pl-4 border-l-2 border-accent/30">
                                      {strategy.stages.map((stage, idx) => (
                                        <div key={idx} className="text-muted-foreground">
                                          {idx + 1}. {stage.name} ({stage.duration}{stage.unit === 'minutes' ? '分' : stage.unit === 'seconds' ? '秒' : stage.unit === 'hours' ? '时' : ''})
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => toggleStrategyLoadMode(strategy.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {strategy.loadMode === 'expand' ? <ListPlus className="mr-2" /> : <StackMinus className="mr-2" />}
                          {strategy.loadMode === 'expand' ? '展开模式' : '嵌入模式'}
                        </Button>
                        <Button
                          onClick={() => handleLoadStrategy(strategy)}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                        >
                          加载
                        </Button>
                        <Button
                          onClick={() => handleRunStrategy(strategy)}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          <Play className="mr-2" weight="fill" />
                          运行
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{transferMode === 'export' ? '导出策略数据' : '导入策略数据'}</DialogTitle>
              <DialogDescription className="sr-only">导入或导出策略 JSON 数据。</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 min-h-0 flex flex-1 flex-col">
              <Textarea
                value={transferText}
                onChange={(event) => setTransferText(event.target.value)}
                placeholder="在这里粘贴策略 JSON 数据"
                className="h-[50vh] min-h-[180px] max-h-[55vh] resize-none overflow-y-auto font-mono text-xs"
                aria-label="策略 JSON 数据"
              />
              <div className="flex w-full items-center justify-end gap-2 border-t pt-3">
                {transferMode === 'import' && (
                  <>
                    <input
                      ref={transferInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleImportStrategies(file)
                        event.target.value = ''
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => void pasteTransferData()}>
                      <ClipboardText className="mr-2" />
                      粘贴
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void importTransferData()}>
                      <UploadSimple className="mr-2" />
                      {transferText.trim() ? '导入数据' : '选择文件并导入'}
                    </Button>
                  </>
                )}
                {transferMode === 'export' && (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => void copyTransferData()}>
                      <Copy className="mr-2" />
                      复制
                    </Button>
                    <Button type="button" variant="outline" onClick={downloadTransferData}>
                      <DownloadSimple className="mr-2" />
                      下载文件
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  className="hover:-translate-y-0.5 hover:bg-muted active:translate-y-0 active:scale-95 focus-visible:ring-2"
                  onClick={() => setTransferOpen(false)}
                >
                  关闭
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
