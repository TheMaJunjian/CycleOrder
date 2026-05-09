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

const SettingsView = ({ stage }: { stage: Stage }) => {
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

  return (
    <Tabs defaultValue="running" className="mt-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="running">运行时</TabsTrigger>
        <TabsTrigger value="end">结束时</TabsTrigger>
      </TabsList>

      <TabsContent value="running" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SpeakerHigh className="text-primary" size={20} />
            <span className="font-medium text-sm">音效</span>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">随机音效</span>
              {runningSettings.randomSound ? (
                <Check className="text-green-600" size={18} />
              ) : (
                <X className="text-muted-foreground" size={18} />
              )}
            </div>
            {!runningSettings.randomSound && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">自定义音效</span>
                <span className="text-xs">{runningSettings.soundFile ? '已上传' : '未设置'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image className="text-primary" size={20} />
            <span className="font-medium text-sm">壁纸</span>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">模式</span>
              <span className="text-xs">{runningSettings.wallpaperMode === 'random' ? '随机' : '固定'}</span>
            </div>
            {runningSettings.wallpaperMode === 'fixed' && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">自定义壁纸</span>
                <span className="text-xs">{runningSettings.wallpaper ? '已上传' : '未设置'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Vibrate className="text-primary" size={20} />
            <span className="font-medium text-sm">震动</span>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">启用震动</span>
              {runningSettings.enableVibration ? (
                <Check className="text-green-600" size={18} />
              ) : (
                <X className="text-muted-foreground" size={18} />
              )}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="end" className="space-y-4 mt-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SpeakerHigh className="text-primary" size={20} />
            <span className="font-medium text-sm">音效</span>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">随机音效</span>
              {endSettings.randomSound ? (
                <Check className="text-green-600" size={18} />
              ) : (
                <X className="text-muted-foreground" size={18} />
              )}
            </div>
            {!endSettings.randomSound && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">自定义音效</span>
                <span className="text-xs">{endSettings.soundFile ? '已上传' : '未设置'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image className="text-primary" size={20} />
            <span className="font-medium text-sm">壁纸</span>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">模式</span>
              <span className="text-xs">{endSettings.wallpaperMode === 'random' ? '随机' : '固定'}</span>
            </div>
            {endSettings.wallpaperMode === 'fixed' && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">自定义壁纸</span>
                <span className="text-xs">{endSettings.wallpaper ? '已上传' : '未设置'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Vibrate className="text-primary" size={20} />
            <span className="font-medium text-sm">震动</span>
          </div>
          <div className="pl-7 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">启用震动</span>
              {endSettings.enableVibration ? (
                <Check className="text-green-600" size={18} />
              ) : (
                <X className="text-muted-foreground" size={18} />
              )}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export function StageViewDialog({ stage, children }: StageViewDialogProps) {
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

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">阶段名称</span>
            <span className="font-medium">{stage.name}</span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">持续时间</span>
            <span className="font-medium">
              {stage.duration} {getTimeUnitLabel(stage.unit)}
            </span>
          </div>

          {stage.isMerged && (
            <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">类型</span>
              <Badge variant="secondary">
                {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
              </Badge>
            </div>
          )}
        </div>

        {!stage.isMerged && <SettingsView stage={stage} />}

        {stage.isMerged && stage.embeddedStrategyStages && stage.embeddedStrategyStages.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">包含的阶段 ({stage.embeddedStrategyStages.length}个)</h3>
            <Accordion type="single" collapsible className="space-y-2">
              {stage.embeddedStrategyStages.map((subStage, idx) => (
                <AccordionItem key={idx} value={`stage-${idx}`} className="border rounded-lg px-3">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium text-muted-foreground">#{idx + 1}</span>
                      <span className="font-medium">{subStage.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto mr-2">
                        {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <SettingsView stage={subStage} />
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
