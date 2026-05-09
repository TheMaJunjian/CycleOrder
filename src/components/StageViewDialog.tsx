import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, Accordi

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'

interface StageViewDialogProps {
    enableVibration: true,

 


    const labels: Record<string, string> = {
      microseconds: '微秒
      seconds: '秒',
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
        </DialogHe
      days: '天',
      months: '月',
      years: '年',
    }
    return labels[unit] || unit


          
    <Dialog>
              {stage.isEmbedd
        {children}
                </p>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{stage.name}</DialogTitle>
        </DialogHeader>

                <TabsTrigger value="end"
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">时长:</span>
            <span className="text-muted-foreground">
              {stage.duration} {getTimeUnitLabel(stage.unit)}
            </span>
                

          {stage.isMerged && (
            <div className="space-y-2">
              <Badge variant="secondary">
                {stage.isEmbeddedStrategy ? '嵌入策略' : '合并阶段'}
              </Badge>
              {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && (
                  <div className="flex items-center gap-3">
                    <span className="font-medium">震动设置</span>
                  <d
                
                  
            

                          <X c
                        </>
                    </div>
                </div>

                <div clas

                  </div>
                    <div className="flex it
                      {endSettings.randomSound ? (
                          <Check className="text-green-600" size={20} 
                        </>
                  </div>
                          <span className="text-sm
                      )}
                    {endSettings.soundFile && (
                        <span className="text-sm">已上传自
                    )}
                </div>
                <div className="space-y-4">
                    <Image 
                  </div>
                    <div c
                      <span className="text-sm text-muted-foregrou
                      </span>
                    {endSet
                        
                    </div>
                </div>
                <div className="space-y-4">
                    <Vibrate className="text-primary" size={24} /
                  </div>
                    <d
                      {e
                </div>

                        <>
                          <span className="text-sm text-mut
                      )}
                  </div>
              </TabsCont
          ) : null}
          {stage.isEmbeddedStrategy && stage.embeddedStrategyStages && stage.embeddedStrategyStages.le
              <h4 className="font-semibold text-sm">子阶段详情</
                {stage.embeddedStrategyStages.map((subStage, index) =>
                    <AccordionTrigger className="hover:no-underline py-3">
                        <span
                        <B
                        </Badge>
                    </AccordionTrigger>
                      <div className="space-y-4 pl-4 pt-2">
                          <S
                      
                        
                      

                        <div className="fle
                          <span className="font-medium text
                        <div className="space-y-2 pl-7 text-sm">
                            <span>壁纸模式:</span>
                        

                          <Vibrate className="text-primary" s
                        </div>
                          <div className="flex items-cente
                        <>
                        </div>
                          <span className="text-sm text-muted-foreground">是</span>
                          <
                      ) : (
                          
                          </div>

                          <
                        
                    </div>
                        
                </div>
                        <div

                        <div className="space-y-2 pl-7 text-sm">
                            <span>启用震动:</sp
                          </div>
                      </div>
                  </AccordionItem>
              </Accordio
          )}
      </DialogContent>
  )















                      </div>






































































                        </div>





                        </div>




                        </div>


















































                      </div>








    </Dialog>

}
