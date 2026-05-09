import { Stage } from '@/types'
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
    const labels = getTimeUnitLabel(unit)
    return `${duration} ${labels}`
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">阶段详情 - {stage.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">时长</p>
              <p className="text-lg font-semibold">{formatDuration(stage.duration, stage.unit)}</p>
            </div>
          </div>

          {stage.isMerged && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">
                {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
              </Badge>
            </div>
          )}

          {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">子阶段详情 ({stage.embeddedStrategyStages.length}个)</h4>
              <div className="space-y-1 pl-4 text-sm">
                {stage.embeddedStrategyStages.map((subStage, idx) => (
                  <div key={idx} className="py-1 border-b border-border/50 last:border-0">
                    <span>{idx + 1}. {subStage.name} - {formatDuration(subStage.duration, subStage.unit)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Tabs defaultValue="running" className="w-full mt-6">
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
                  <Badge variant="secondary">
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
                  <Badge variant="secondary">
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
