import { Stage } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

          <div className="flex items-center gap-2">
            <span className="font-m
          <div className="pl-7 space-y-2 text-sm">
              <span className="text-muted-foreground">随机音效</sp
                <Check className="text-green-600" size={18}
                
            </div>
              <div className="flex items-center justify-between
                <span className="text-xs">{runningSettings.soundF
            )}
        </div>
        <div classN
            <Image className="text-primary" size={20} />
          </div>
            <div c
              <span className="text-xs">{runni
            {runningSettings.wallpaperMode === 'fixed' && (
                <span className="text-muted-foreground">自定义壁纸</span>
              </div>
          </div>

          <div c
            <s

              <span className="text
                <Check className="text-green-600" s
                <X className="text-muted-foreground" siz
            </div>
        </div>

        <div className="space-y-3">
            <SpeakerHigh className="text-primary" size={20} />
          </div>
            <div c
              {endSettings.randomSound ? (
              ) : (
              )}
            {!endSettings.randomSound && (
                <spa
              
          </div>


            <span className="font-m
          <div className="pl-7 space-y-2 text-sm">
              <span className="text-muted-foreground">模式</
            </div>
              <d
                <span className="text-xs">{endSett
            )}
        </div>
        <div className="space-y-3">
            <Vibrate className="text-primary" size={20} />
          </div>
            <div className="flex items-center justify-between">
              {e
              ) : 
              )}
          </di
      </TabsContent>


  const getTimeUnitLabel = (unit: s
      nanoseconds: '纳秒',
      milliseconds: '毫秒',
      minutes: '分钟',
      days: '天',
      years: '年',
    return labels[unit] || unit

    <Dialog>
      <DialogContent className="max-w-3xl max-h-[85vh] overflo
          <DialogTi

          <div c
            <span 

            <span className="text-sm text-muted-foreground">持续时间<
              {stage.duration} {getTimeUnitLabel(stage.unit)}
          </div>
          {stage.isM
              
                
            </

        {!stage.isMerged && <Settin
        {stage.isMerged && stage.embeddedStrategySt
            <h3 className="font-semibold mb-3 text-sm te
              {stage.embeddedStrategyStages.map((subStage, 
                
                      <span className="font-medium
                      <span className="text-xs text-muted-foreg
                      </span>
                  </AccordionTrigger>
                  
                </AccordionItem>
            </Accordion>
        )}
    </Dialog>
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






































































































