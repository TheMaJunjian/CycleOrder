import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'

interface StageViewDialogProps {
  children: React.ReactNode
  stage: Stage
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

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>阶段详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">阶段名称</span>
            <span className="font-medium">{stage.name}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">持续时间</span>
            <span className="font-medium">
              {stage.duration} {getTimeUnitLabel(stage.unit)}
            </span>
          </div>

          {stage.isMerged && (
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">类型</span>
              <Badge variant="secondary">
                {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
              </Badge>
            </div>
          )}

          {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && (
            <details className="py-2 border-b border-border/50">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                查看子阶段详情 ({stage.embeddedStrategyStages.length}个)
              </summary>
              <div className="mt-2 pl-4 space-y-1 text-sm">
                {stage.embeddedStrategyStages.map((subStage, idx) => (
                  <div key={idx}>
                    {subStage.name} - {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        <Tabs defaultValue="running" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="running">运行时提示</TabsTrigger>
            <TabsTrigger value="end">结束时提示</TabsTrigger>
          </TabsList>

          <TabsContent value="running" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <SpeakerHigh className="text-primary" size={24} />
                <span className="font-medium">音效设置</span>
              </div>

              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">随机音效</span>
                  <div className="flex items-center gap-2">
                    {runningSettings.randomSound ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">是</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">否</span>
                      </>
                    )}
                  </div>
                </div>

                {!runningSettings.randomSound && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义音效</span>
                    <div className="flex items-center gap-2">
                      {runningSettings.soundFile ? (
                        <span className="text-sm text-muted-foreground">已上传</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">未上传</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image className="text-primary" size={24} />
                <span className="font-medium">壁纸设置</span>
              </div>

              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">壁纸模式</span>
                  <span className="text-sm text-muted-foreground">
                    {runningSettings.wallpaperMode === 'random' ? '随机壁纸' : '固定壁纸'}
                  </span>
                </div>

                {runningSettings.wallpaperMode === 'fixed' && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义壁纸</span>
                    <div className="flex items-center gap-2">
                      {runningSettings.wallpaper ? (
                        <span className="text-sm text-muted-foreground">已上传</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">未上传</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Vibrate className="text-primary" size={24} />
                <span className="font-medium">震动设置</span>
              </div>

              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">启用震动</span>
                  <div className="flex items-center gap-2">
                    {runningSettings.enableVibration ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">是</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">否</span>
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
                <span className="font-medium">音效设置</span>
              </div>

              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">随机音效</span>
                  <div className="flex items-center gap-2">
                    {endSettings.randomSound ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">是</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">否</span>
                      </>
                    )}
                  </div>
                </div>

                {!endSettings.randomSound && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义音效</span>
                    <div className="flex items-center gap-2">
                      {endSettings.soundFile ? (
                        <span className="text-sm text-muted-foreground">已上传</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">未上传</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image className="text-primary" size={24} />
                <span className="font-medium">壁纸设置</span>
              </div>

              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">壁纸模式</span>
                  <span className="text-sm text-muted-foreground">
                    {endSettings.wallpaperMode === 'random' ? '随机壁纸' : '固定壁纸'}
                  </span>
                </div>

                {endSettings.wallpaperMode === 'fixed' && (
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm">自定义壁纸</span>
                    <div className="flex items-center gap-2">
                      {endSettings.wallpaper ? (
                        <span className="text-sm text-muted-foreground">已上传</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">未上传</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Vibrate className="text-primary" size={24} />
                <span className="font-medium">震动设置</span>
              </div>

              <div className="space-y-3 pl-9">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-sm">启用震动</span>
                  <div className="flex items-center gap-2">
                    {endSettings.enableVibration ? (
                      <>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">是</span>
                      </>
                    ) : (
                      <>
                        <X className="text-red-600" size={20} />
                        <span className="text-sm text-muted-foreground">否</span>
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
