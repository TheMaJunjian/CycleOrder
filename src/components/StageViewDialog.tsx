import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

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
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">阶段详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">阶段名称</span>
            <span className="font-medium">{stage.name}</span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">持续时间</span>
            <span className="font-medium">
              {stage.duration} {getTimeUnitLabel(stage.unit)}
            </span>
          </div>

          {stage.isMerged && (
            <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">类型</span>
              <Badge variant="secondary">
                {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
              </Badge>
            </div>
          )}
        </div>

        {!stage.isMerged && (
          <Tabs defaultValue="running" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="running">运行时设置</TabsTrigger>
              <TabsTrigger value="end">结束时设置</TabsTrigger>
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
        )}

        {stage.isMerged && stage.embeddedStrategyStages && stage.embeddedStrategyStages.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">子阶段详情</h3>
            <Accordion type="single" collapsible className="w-full">
              {stage.embeddedStrategyStages.map((subStage, index) => (
                <AccordionItem key={subStage.id} value={subStage.id}>
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium">{subStage.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-6 pl-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <SpeakerHigh className="text-primary" size={20} />
                          <span className="font-medium text-sm">运行时音效</span>
                        </div>
                        <div className="space-y-2 pl-7 text-sm">
                          <div className="flex items-center justify-between py-1.5">
                            <span className="text-muted-foreground">随机音效</span>
                            <span>{subStage.runningSettings?.randomSound ? '是' : '否'}</span>
                          </div>
                          {!subStage.runningSettings?.randomSound && (
                            <div className="flex items-center justify-between py-1.5">
                              <span className="text-muted-foreground">自定义音效</span>
                              <span>{subStage.runningSettings?.soundFile ? '已上传' : '未上传'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Image className="text-primary" size={20} />
                          <span className="font-medium text-sm">运行时壁纸</span>
                        </div>
                        <div className="space-y-2 pl-7 text-sm">
                          <div className="flex items-center justify-between py-1.5">
                            <span className="text-muted-foreground">壁纸模式</span>
                            <span>{subStage.runningSettings?.wallpaperMode === 'random' ? '随机' : '固定'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Vibrate className="text-primary" size={20} />
                          <span className="font-medium text-sm">运行时震动</span>
                        </div>
                        <div className="space-y-2 pl-7 text-sm">
                          <div className="flex items-center justify-between py-1.5">
                            <span className="text-muted-foreground">启用震动</span>
                            <span>{subStage.runningSettings?.enableVibration ? '是' : '否'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border/50 pt-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <SpeakerHigh className="text-primary" size={20} />
                          <span className="font-medium text-sm">结束时音效</span>
                        </div>
                        <div className="space-y-2 pl-7 text-sm">
                          <div className="flex items-center justify-between py-1.5">
                            <span className="text-muted-foreground">随机音效</span>
                            <span>{subStage.endSettings?.randomSound ? '是' : '否'}</span>
                          </div>
                          {!subStage.endSettings?.randomSound && (
                            <div className="flex items-center justify-between py-1.5">
                              <span className="text-muted-foreground">自定义音效</span>
                              <span>{subStage.endSettings?.soundFile ? '已上传' : '未上传'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Image className="text-primary" size={20} />
                          <span className="font-medium text-sm">结束时壁纸</span>
                        </div>
                        <div className="space-y-2 pl-7 text-sm">
                          <div className="flex items-center justify-between py-1.5">
                            <span className="text-muted-foreground">壁纸模式</span>
                            <span>{subStage.endSettings?.wallpaperMode === 'random' ? '随机' : '固定'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Vibrate className="text-primary" size={20} />
                          <span className="font-medium text-sm">结束时震动</span>
                        </div>
                        <div className="space-y-2 pl-7 text-sm">
                          <div className="flex items-center justify-between py-1.5">
                            <span className="text-muted-foreground">启用震动</span>
                            <span>{subStage.endSettings?.enableVibration ? '是' : '否'}</span>
                          </div>
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
