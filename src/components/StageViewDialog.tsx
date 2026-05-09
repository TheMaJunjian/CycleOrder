import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Badge } from '@/components/ui/badge'
  children: React.ReactNode
}

    randomSound: false,
  children: React.ReactNode
  stage: Stage
}

export function StageViewDialog({ children, stage }: StageViewDialogProps) {
  const runningSettings = stage.runningSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,

  }

  const endSettings = stage.endSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,
    enableVibration: true,
  }

  const getTimeUnitLabel = (unit: string): string => {

      nanoseconds: '纳秒',
      microseconds: '微秒',
      milliseconds: '毫秒',
          <DialogTi
      minutes: '分钟',
              <Bad
              </
          )}

     
              <TabsTrigger valu
   

          
            

                  <div className="flex items-center justify-between py-2
                    <d
                        <>
                       

                          <X classN
                        </>
                    </div>

                

                          <span className="text-sm text-muted-foreground">已上传</span>
                          <span className="text-sm text-muted-foregroun
                      </div>
                  )}
              </div
              <d

                </div>
                <div className="space-y-3 pl-9">
                    <span className="text-sm">壁纸模式</span>
                      {runningSettings.wa
                  </div>
                  {run
                  
            
              

                    </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-medium">震动设置</span


                    <div className="flex items-center gap-2">
                        <>
                          <span className="text-sm text-m
                      ) : (
                          <X className="text-red-600" size=
                      

                </div>
            </TabsContent>
            <TabsContent value="end" className="space-y-6
                <div className="flex items-center gap-3">
                  <span className="font-medium">音效设置</

                  <div className="flex items-center justify-between py-2
                    <div className="flex items-center gap-2">
                        <>
                          <
                      ) : 
                          <X className="text-red-600" size={20} />
                        </>
                    </div>

                    <div c
                      <d

                          <span className="text-sm t
                      </div>
                  )}
              </div>
              <div className="space-y-4">
                  <Image className="text-primary" size={24} />
                </div>
                <div className="space-y-3 pl-9">
                    <span 
                      {endSe
                  </div>
                  {e
                      
                    

                        )}
                    </div>
                </div>

                <div c


                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex items-center gap
                        <>
                          <span className="text-sm text-muted-foreground">是</span>
                      ) : (
                        

                    </div>
                </div>
            </TabsContent>
        )}
        {stage.isMerged && stage.embeddedStrategyStage
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground">子阶段详情</
              {stage.embedded
                  <AccordionTrigger className="hover:no-underline py-3">
                      <spa
                        <spa
                          
                    
                  </Ac
                    

                          <span className
                        <div className="space-y-2 pl-7 te
                            <span className="text-muted-foregrou
                          </div>
                      

                          )}
                      </div>
                      <div className="space-y-4">
                          <Image className="text-primary" siz
                        </div>
                          
                            <span>{subStage.runningSettings?.wallpaperMo
                        </div>

                        <di
                          
                        <div className="space-y-2 pl-7 text-sm">
                            <span className="text-muted-foreground">启用震动</span>
                          <
                      </
                      <div
                        
                      
                    
                          

                              <span className="text-muted-foregr
                            </div>
                        </div>

                        <div className="flex items-center g
                      

                            <span className="tex
                          </div>
                      </div>
                      <div className="space-y-4">
                          <Vibrate className="text
                        </
                          <div className="flex items-center justify-betw
                            <span>{subStage.endSettings?.enableVibration ? '是' : '
                        </d
                    </div>
                </Accordio
            </Accordion>
        )}
    </Dialog>
}



































































































































































































