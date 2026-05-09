import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{stage.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">时长:</span>
            <span className="text-muted-foreground">
              {stage.duration} {getTimeUnitLabel(stage.unit)}
            </span>
          </div>

          {stage.isMerged && (
            <div className="space-y-2">
              <Badge variant="secondary">
                {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
              </Badge>
              {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && (
                <p className="text-sm text-muted-foreground">
                  包含 {stage.embeddedStrategyStages.length} 个子阶段
                </p>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">运行时设置</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <SpeakerHigh className="text-primary" size={20} />
                    <span className="font-medium">音效设置</span>
                  </div>
                  <div className="space-y-2 pl-7 text-sm">
                    <div className="flex items-center gap-2">
                      {runningSettings.randomSound ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm">使用随机音效</span>
                        </>
                      ) : (
                        <>
                          <X className="text-muted-foreground" size={20} />
                          <span className="text-sm text-muted-foreground">不使用随机音效</span>
                        </>
                      )}
                    </div>
                    {runningSettings.soundFile && (
                      <span className="text-sm">已上传自定义音效</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Image className="text-primary" size={20} />
                    <span className="font-medium">壁纸设置</span>
                  </div>
                  <div className="space-y-2 pl-7 text-sm">
                    <div>
                      <span>壁纸模式: </span>
                      <span className="text-muted-foreground">
                        {runningSettings.wallpaperMode === 'random' ? '随机壁纸' : '固定壁纸'}
                      </span>
                    </div>
                    {runningSettings.wallpaper && (
                      <span className="text-sm">已上传自定义壁纸</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Vibrate className="text-primary" size={20} />
                    <span className="font-medium">震动设置</span>
                  </div>
                  <div className="space-y-2 pl-7 text-sm">
                    <div className="flex items-center gap-2">
                      {runningSettings.enableVibration ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm">启用震动</span>
                        </>
                      ) : (
                        <>
                          <X className="text-muted-foreground" size={20} />
                          <span className="text-sm text-muted-foreground">关闭震动</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">结束时设置</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <SpeakerHigh className="text-primary" size={20} />
                    <span className="font-medium">音效设置</span>
                  </div>
                  <div className="space-y-2 pl-7 text-sm">
                    <div className="flex items-center gap-2">
                      {endSettings.randomSound ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm">使用随机音效</span>
                        </>
                      ) : (
                        <>
                          <X className="text-muted-foreground" size={20} />
                          <span className="text-sm text-muted-foreground">不使用随机音效</span>
                        </>
                      )}
                    </div>
                    {endSettings.soundFile && (
                      <span className="text-sm">已上传自定义音效</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Image className="text-primary" size={20} />
                    <span className="font-medium">壁纸设置</span>
                  </div>
                  <div className="space-y-2 pl-7 text-sm">
                    <div>
                      <span>壁纸模式: </span>
                      <span className="text-muted-foreground">
                        {endSettings.wallpaperMode === 'random' ? '随机壁纸' : '固定壁纸'}
                      </span>
                    </div>
                    {endSettings.wallpaper && (
                      <span className="text-sm">已上传自定义壁纸</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Vibrate className="text-primary" size={20} />
                    <span className="font-medium">震动设置</span>
                  </div>
                  <div className="space-y-2 pl-7 text-sm">
                    <div className="flex items-center gap-2">
                      {endSettings.enableVibration ? (
                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm">启用震动</span>
                        </>
                      ) : (
                        <>
                          <X className="text-muted-foreground" size={20} />
                          <span className="text-sm text-muted-foreground">关闭震动</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && stage.embeddedStrategyStages.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">子阶段详情</h4>
              <Accordion type="single" collapsible className="w-full">
                {stage.embeddedStrategyStages.map((subStage, index) => (
                  <AccordionItem key={subStage.id} value={subStage.id}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{subStage.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pl-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <SpeakerHigh className="text-primary" size={16} />
                            <span className="font-medium text-sm">运行时音效</span>
                          </div>
                          <div className="space-y-2 pl-7 text-sm">
                            <span>随机音效: {subStage.runningSettings?.randomSound ? '是' : '否'}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Vibrate className="text-primary" size={16} />
                            <span className="font-medium text-sm">震动</span>
                          </div>
                          <div className="space-y-2 pl-7 text-sm">
                            <span>启用震动: {subStage.runningSettings?.enableVibration ? '是' : '否'}</span>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
