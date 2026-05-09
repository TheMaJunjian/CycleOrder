import { Stage } from '@/types'
import { convertToMilliseconds } from '@/lib/timer-utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'

interface StageViewDialogProps {
  stage: Stage
  children: React.ReactNode
}

export function StageViewDialog({ stage, children }: StageViewDialogProps) {
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

  const formatDuration = (duration: number, unit: string): string => {
    const ms = convertToMilliseconds(duration, unit as any)
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const parts = []
    if (days > 0) parts.push(`${days}天`)
    if (hours % 24 > 0) parts.push(`${hours % 24}小时`)
    if (minutes % 60 > 0) parts.push(`${minutes % 60}分钟`)
    if (seconds % 60 > 0) parts.push(`${seconds % 60}秒`)
    
    return parts.length > 0 ? parts.join(' ') : '0秒'
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">阶段详情 - {stage.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">阶段时长</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {stage.duration} {getTimeUnitLabel(stage.unit)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatDuration(stage.duration, stage.unit)}
                </div>
              </div>
            </div>
          </div>

          {stage.isMerged && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              {stage.isEmbeddedStrategy ? '嵌入策略阶段（只读）' : '合并阶段（只读）'}
            </Badge>
          )}

          {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && (
            <div className="bg-muted/30 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">包含子阶段 ({stage.embeddedStrategyStages.length}个)</h4>
              <div className="space-y-1 text-sm">
                {stage.embeddedStrategyStages.map((subStage, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                    <span>{idx + 1}. {subStage.name}</span>
                    <span className="text-muted-foreground">
                      {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">随机音效</span>
                  <div className="flex items-center gap-2">
                    {runningSettings.randomSound ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已启用</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">未启用</span>
                      </>
                    )}
                  </div>
                </div>

                {!runningSettings.randomSound && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义音效</span>
                    <div className="flex items-center gap-2">
                      {runningSettings.soundFile ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm text-muted-foreground">已上传</span>
                        </>
                      ) : (
                        <>
                          <X className="text-red-600" size={20} />
                          <span className="text-sm text-muted-foreground">未上传</span>
                        </>
                      )}
                    </div>
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
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">壁纸模式</span>
                  <Badge variant={runningSettings.wallpaperMode === 'random' ? 'default' : 'secondary'}>
                    {runningSettings.wallpaperMode === 'random' ? '随机' : '固定'}
                  </Badge>
                </div>

                {runningSettings.wallpaperMode === 'fixed' && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义壁纸</span>
                    <div className="flex items-center gap-2">
                      {runningSettings.wallpaper ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm text-muted-foreground">已上传</span>
                        </>
                      ) : (
                        <>
                          <X className="text-red-600" size={20} />
                          <span className="text-sm text-muted-foreground">未上传</span>
                        </>
                      )}
                    </div>
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
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">启用震动</span>
                  <div className="flex items-center gap-2">
                    {runningSettings.enableVibration ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已启用</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">未启用</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="end" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SpeakerHigh className="text-primary" size={24} />
                <h3 className="text-lg font-semibold">音效设置</h3>
              </div>
              
              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">随机音效</span>
                  <div className="flex items-center gap-2">
                    {endSettings.randomSound ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已启用</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">未启用</span>
                      </>
                    )}
                  </div>
                </div>

                {!endSettings.randomSound && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义音效</span>
                    <div className="flex items-center gap-2">
                      {endSettings.soundFile ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm text-muted-foreground">已上传</span>
                        </>
                      ) : (
                        <>
                          <X className="text-red-600" size={20} />
                          <span className="text-sm text-muted-foreground">未上传</span>
                        </>
                      )}
                    </div>
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
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">壁纸模式</span>
                  <Badge variant={endSettings.wallpaperMode === 'random' ? 'default' : 'secondary'}>
                    {endSettings.wallpaperMode === 'random' ? '随机' : '固定'}
                  </Badge>
                </div>

                {endSettings.wallpaperMode === 'fixed' && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义壁纸</span>
                    <div className="flex items-center gap-2">
                      {endSettings.wallpaper ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm text-muted-foreground">已上传</span>
                        </>
                      ) : (
                        <>
                          <X className="text-red-600" size={20} />
                          <span className="text-sm text-muted-foreground">未上传</span>
                        </>
                      )}
                    </div>
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
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">启用震动</span>
                  <div className="flex items-center gap-2">
                    {endSettings.enableVibration ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已启用</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">未启用</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
