import { Stage } from '@/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'

import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'

interface StageViewDialogProps {
  stage: Stage
function StageSettingsDispl
}

export function StageViewDialog({ stage, children }: StageViewDialogProps) {
  const runningSettings = stage.runningSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,
    enableVibration: true,


  const endSettings = stage.endSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,
    enableVibration: true,
   

  const getTimeUnitLabel = (unit: string): string => {
    const labels: Record<string, string> = {
      nanoseconds: '纳秒',
      microseconds: '微秒',
                  </>
      seconds: '秒',
                    
      hours: '小时',
                
                </
              {ru
     
          </div>
   

          
            
                  <>
                  
                ) : (
                    <X className="text-muted-foreground" size={20} />
                  </>
              </div>
          </div>

      <div>
        
          <div className="space-y-2">
              <SpeakerHigh className="text-primary" 
            </div>
              <div 
                

                ) : (
                    <X className="text-
                  </>
              </div>
                <span 
            </div>

            <div className="flex items-center gap-3">
              <span 
            <div
                <s
            

                <span className="text
            </div

            <d
              <span className="font-mediu
            <div className="space-y-2 pl-7 
                {endSettings.enableVibration ? (
                    <Check className="text-green-600" size={20} />
                  </>
                  <>
                    <span className="text-sm text-muted-fo
                )}
            </div>
        </div>
                          <Check className="text-green-600" size={20} />
}
export function StageViewDi
  const hasSubStages = stag
  return (
      <DialogTrigger asChild>
      </DialogTrigger>
        <DialogHeader>
        </DialogHeader>
        <div className="sp
            <span className="font-medium">Duration:
              {stage.duration} {getTimeUnitLabel(stage.unit)}
          </div>
          {isMergedStage
              <Badge v

                <p className="text-sm text-
                </p>
            </div>

            <div classNa
              <Accordion type="single" collapsible classNa
                  <Accord
                      <div className="fle
                        <span className="text-sm">{subStage.na
                          {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                      </div>
                    <Accor
                        <StageSettingsDisplay stage
                    </AccordionContent>
                ))}
            </div>


    </Dialog>
}








                          <span className="text-sm">启用震动</span>

                      ) : (

                          <X className="text-muted-foreground" size={20} />
                          <span className="text-sm text-muted-foreground">关闭震动</span>

                      )}

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

                  <div className="space-y-2 pl-7 text-sm">
                    <div className="flex items-center gap-2">

                        <>
                          <Check className="text-green-600" size={20} />
                          <span className="text-sm">使用随机音效</span>

                      ) : (
                        <>
                          <X className="text-muted-foreground" size={20} />
                          <span className="text-sm text-muted-foreground">不使用随机音效</span>
                        </>

                    </div>

                      <span className="text-sm">已上传自定义音效</span>

                  </div>


                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Image className="text-primary" size={20} />
                    <span className="font-medium">壁纸设置</span>

                  <div className="space-y-2 pl-7 text-sm">
                    <div>
                      <span>壁纸模式: </span>
                      <span className="text-muted-foreground">
                        {endSettings.wallpaperMode === 'random' ? '随机壁纸' : '固定壁纸'}


                    {endSettings.wallpaper && (
                      <span className="text-sm">已上传自定义壁纸</span>
                    )}



                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Vibrate className="text-primary" size={20} />
                    <span className="font-medium">震动设置</span>
                  </div>
                  <div className="space-y-2 pl-7 text-sm">
                    <div className="flex items-center gap-2">
                      {endSettings.enableVibration ? (

                          <Check className="text-green-600" size={20} />
                          <span className="text-sm">启用震动</span>
                        </>
                      ) : (
                        <>
                          <X className="text-muted-foreground" size={20} />
                          <span className="text-sm text-muted-foreground">关闭震动</span>
                        </>

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

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="text-sm">{subStage.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {subStage.duration} {getTimeUnitLabel(subStage.unit)}

                      </div>

                    <AccordionContent>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <SpeakerHigh className="text-primary" size={16} />
                            <span className="font-medium text-sm">运行时音效</span>
                          </div>
                          <div className="space-y-2 pl-7 text-sm">
                            <span>随机音效: {subStage.runningSettings?.randomSound ? '是' : '否'}</span>
                          </div>


                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Vibrate className="text-primary" size={16} />
                            <span className="font-medium text-sm">震动</span>

                          <div className="space-y-2 pl-7 text-sm">
                            <span>启用震动: {subStage.runningSettings?.enableVibration ? '是' : '否'}</span>

                        </div>

                    </AccordionContent>

                ))}
              </Accordion>
            </div>

        </div>


  )

