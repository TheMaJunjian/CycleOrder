import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'
import { getAudioDisplayName } from '@/lib/audio-storage'

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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">阶段详情 - {stage.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">阶段名称</p>
                <p className="font-medium mt-1">{stage.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">时长</p>
                <p className="font-medium mt-1">
                  {stage.duration} {getTimeUnitLabel(stage.unit)}
                </p>
              </div>
              {stage.isMerged && (
                <div className="col-span-2">
                  <Badge variant="secondary">
                    {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
                  </Badge>
                  {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && (
                    <span className="text-xs text-muted-foreground ml-2">
                      包含 {stage.embeddedStrategyStages.length} 个子阶段
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && (
            <div>
              <h3 className="text-sm font-semibold mb-2">嵌入的子阶段</h3>
              <div className="space-y-2">
                {stage.embeddedStrategyStages.map((subStage, index) => (
                  <div key={subStage.id} className="p-3 bg-muted/20 rounded-md text-sm">
                    <div className="font-medium">
                      {index + 1}. {subStage.name}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="running">
              <AccordionTrigger className="text-base font-semibold">
                运行时提示设置
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <SpeakerHigh className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">音效</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">随机音效:</span>
                          {runningSettings.randomSound ? (
                            <Check className="text-green-600" size={20} />
                          ) : (
                            <X className="text-muted-foreground" size={20} />
                          )}
                        </div>
                        {!runningSettings.randomSound && runningSettings.soundFile && (
                          <div className="text-xs text-muted-foreground">
                              文件: {getAudioDisplayName(runningSettings.soundFile) || '已上传音效文件'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Image className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">壁纸</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">随机壁纸:</span>
                          {runningSettings.wallpaperMode === 'random' ? (
                            <Check className="text-green-600" size={20} />
                          ) : (
                            <X className="text-muted-foreground" size={20} />
                          )}
                        </div>
                        {runningSettings.wallpaperMode === 'fixed' && runningSettings.wallpaper && (
                          <div className="text-xs text-muted-foreground">
                            文件: {runningSettings.wallpaper.includes('|||') 
                              ? runningSettings.wallpaper.split('|||')[0] 
                              : '已上传'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Vibrate className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">震动</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">启用震动:</span>
                          {runningSettings.enableVibration ? (
                            <Check className="text-green-600" size={20} />
                          ) : (
                            <X className="text-muted-foreground" size={20} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="end">
              <AccordionTrigger className="text-base font-semibold">
                结束时提示设置
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {endSettings.alertTime !== undefined && endSettings.alertTime !== 0 && (
                    <div className="p-3 bg-primary/5 rounded-md">
                      <div className="text-sm font-medium">提示时间</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {(endSettings.alertTiming ?? 'inside') === 'inside' ? (
                          <>阶段内：结束前 {endSettings.alertTime} {getTimeUnitLabel(endSettings.alertTimeUnit || 'seconds')} 开始提示</>
                        ) : (
                          <>阶段外：占用下一阶段 {endSettings.alertTime} {getTimeUnitLabel(endSettings.alertTimeUnit || 'seconds')} 播放提示</>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <SpeakerHigh className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">音效</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">随机音效:</span>
                          {endSettings.randomSound ? (
                            <Check className="text-green-600" size={20} />
                          ) : (
                            <X className="text-muted-foreground" size={20} />
                          )}
                        </div>
                        {!endSettings.randomSound && endSettings.soundFile && (
                          <div className="text-xs text-muted-foreground">
                              文件: {getAudioDisplayName(endSettings.soundFile) || '已上传音效文件'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Image className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">壁纸</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">随机壁纸:</span>
                          {endSettings.wallpaperMode === 'random' ? (
                            <Check className="text-green-600" size={20} />
                          ) : (
                            <X className="text-muted-foreground" size={20} />
                          )}
                        </div>
                        {endSettings.wallpaperMode === 'fixed' && endSettings.wallpaper && (
                          <div className="text-xs text-muted-foreground">
                            文件: {endSettings.wallpaper.includes('|||') 
                              ? endSettings.wallpaper.split('|||')[0] 
                              : '已上传'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Vibrate className="text-primary mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">震动</h4>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">启用震动:</span>
                          {endSettings.enableVibration ? (
                            <Check className="text-green-600" size={20} />
                          ) : (
                            <X className="text-muted-foreground" size={20} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  )
}
