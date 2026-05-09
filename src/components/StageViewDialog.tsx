import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'

interface StageViewDialogProps {
  children: React.ReactNode
  stage: Stage
}

export function StageViewDialog({ children, stage }: StageViewDialogProps) {
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
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {stage.name}
          </DialogTitle>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">
              {stage.duration} {getTimeUnitLabel(stage.unit)}
            </Badge>
            {stage.isMerged && (
              <Badge variant="outline">
                {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {!stage.isMerged && (
          <Tabs defaultValue="running" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="running">运行时设置</TabsTrigger>
              <TabsTrigger value="end">结束时设置</TabsTrigger>
            </TabsList>

            <TabsContent value="running" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <SpeakerHigh className="text-primary" size={24} />
                  <span className="font-medium">音效设置</span>
                </div>
                <div className="space-y-3 pl-9">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">随机音效</span>
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
                  {runningSettings.soundFile && (
                    <div className="py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">自定义音效</span>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已上传</span>
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
                  <div className="py-2 border-b border-border/50">
                    <span className="text-sm">壁纸模式</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {runningSettings.wallpaperMode === 'random' ? '随机' : '固定'}
                    </span>
                  </div>
                  {runningSettings.wallpaper && (
                    <div className="py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">自定义壁纸</span>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已上传</span>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm">启用震动</span>
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

            <TabsContent value="end" className="space-y-6 mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <SpeakerHigh className="text-primary" size={24} />
                  <span className="font-medium">音效设置</span>
                </div>
                <div className="space-y-3 pl-9">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">随机音效</span>
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
                  {endSettings.soundFile && (
                    <div className="py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">自定义音效</span>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已上传</span>
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
                  <div className="py-2 border-b border-border/50">
                    <span className="text-sm">壁纸模式</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {endSettings.wallpaperMode === 'random' ? '随机' : '固定'}
                    </span>
                  </div>
                  {endSettings.wallpaper && (
                    <div className="py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">自定义壁纸</span>
                        <Check className="text-green-600" size={20} />
                        <span className="text-sm text-muted-foreground">已上传</span>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm">启用震动</span>
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
        )}

        {stage.isMerged && stage.embeddedStrategyStages && (
          <div className="mt-4">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">子阶段详情</h3>
            <Accordion type="single" collapsible className="w-full">
              {stage.embeddedStrategyStages.map((subStage, index) => (
                <AccordionItem key={subStage.id} value={subStage.id}>
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-left">
                      <span className="font-medium">#{index + 1}</span>
                      <span>{subStage.name}</span>
                      <Badge variant="secondary" className="ml-2">
                        {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <SpeakerHigh className="text-primary" size={20} />
                        <span className="font-medium text-sm">运行时音效</span>
                      </div>
                      <div className="space-y-2 pl-7 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">随机音效:</span>
                          <span>{subStage.runningSettings?.randomSound ? '是' : '否'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Image className="text-primary" size={20} />
                        <span className="font-medium text-sm">运行时壁纸</span>
                      </div>
                      <div className="space-y-2 pl-7 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">壁纸模式:</span>
                          <span>{subStage.runningSettings?.wallpaperMode === 'random' ? '随机' : '固定'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Vibrate className="text-primary" size={20} />
                        <span className="font-medium text-sm">运行时震动</span>
                      </div>
                      <div className="space-y-2 pl-7 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">启用震动:</span>
                          <span>{subStage.runningSettings?.enableVibration ? '是' : '否'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <SpeakerHigh className="text-primary" size={20} />
                        <span className="font-medium text-sm">结束时音效</span>
                      </div>
                      <div className="space-y-2 pl-7 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">随机音效:</span>
                          <span>{subStage.endSettings?.randomSound ? '是' : '否'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Image className="text-primary" size={20} />
                        <span className="font-medium text-sm">结束时壁纸</span>
                      </div>
                      <div className="space-y-2 pl-7 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">壁纸模式:</span>
                          <span>{subStage.endSettings?.wallpaperMode === 'random' ? '随机' : '固定'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Vibrate className="text-primary" size={20} />
                        <span className="font-medium text-sm">结束时震动</span>
                      </div>
                      <div className="space-y-2 pl-7 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">启用震动:</span>
                          <span>{subStage.endSettings?.enableVibration ? '是' : '否'}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
