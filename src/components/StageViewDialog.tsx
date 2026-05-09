import { Stage } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, Accordi

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
      hours: '小时',
  }

  const endSettings = stage.endSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,
    enableVibration: true,
  }

  const getTimeUnitLabel = (unit: string): string => {
            {stage.isMerged && (
      nanoseconds: '纳秒',
      microseconds: '微秒',
      milliseconds: '毫秒',
        {!stage.isM
      minutes: '分钟',
              <Tab

              <div
                 
     
                  <div classNam
   

          
            
                          <X className="text-red-600" s
                        </>
                    </
                  {runningSettings.soundFil
                      <d
                        
                      </div>
                  )}
              </div>
              <div c
                  <Image classNa
                </div>
                  <div className="py-2 border-b border-borde
                    <s
              
                
                      <

                      </div>
                  )}
              </div>
              <div className="space-y-4">
                  <Vibrate className="text-primary" size={
                </div>

                      <span className="text-sm">启用震动</span>
                        <>
                          <span className="text-sm text-m
                      ) : (
                          <X className="text-red-600" size=
                      
                    </div>
                </div>
            </TabsContent>
            <TabsContent value="end" className="space-y-6 m
                <div className="flex items-center gap-
                        <>
                <div className="space-y-3 pl-9">
                    <div className="flex items-center gap-2">
                        </>
                          <
                        </
                        <>
                          <span className="text-sm text-muted-foreground">否</span>
                      )}
                  </div>
                    </div>
                        
                        <span className="text-sm 
                    </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-medium">壁纸设置</span>
                      </div>
                    <span 
                  )}
                </div>
                    

                        <span className="
                    </div>
                </div>

                <div c
                <div className="space-y-3 pl-9">
                <div className="space-y-3 pl-9">
                    <span className="text-sm">壁纸模式</span>
                      {endSettings.enableVibration ? (
                          <Check className="text-green-600" size={20} />
                        </>
                  </div>
                          <span className="text-s
                      )}
                  </div>
              </div>
          </Tabs>

          <div className="mt
                    </div>
                <Acc
                </div>
                    

                    </div>
                <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-s
                      
                          <span className="text-
                        </div>
                    <div className="flex items-center gap-2">
                    <div className="space-y-4">
                        <Image className="text-primary" si
                        <>
                        <div className="flex items-center gap-2">
                          <span>{subStage.runningSettings?.wallpaperMode === 'rand
                      </div
                      ) : (
                      <div
                        <span className="font-medium text-sm">运行时震
                      <div className="space-y-2 pl-7 text-sm">
                          <
                        
                    </div>
                    <div
                </div>
                    
            </TabsContent>

                      </div>

                <div className="flex items-center gap-3">
                        <span className="font-medium text-sm">结束时壁纸<
                      <div className="space-y-2 pl-7 text-s
                      
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Vibrate className="text-primary" s
                      </div>
                        <>
                          <span>{subStage.endSettings?.enableVibration ?
                      </div>
                  </Accordi
              ))}
          </div>
                          <X className="text-red-600" size={20} />
  )
                        </>

                    </div>







                      </div>

                  )}

              </div>

              <div className="space-y-4">

                  <Image className="text-primary" size={24} />

                </div>
                <div className="space-y-3 pl-9">





                  </div>







                    </div>

                </div>








                  <div className="flex items-center justify-between py-2 border-b border-border/50">



                        <>

                          <span className="text-sm text-muted-foreground">是</span>

                      ) : (





                    </div>

                </div>

            </TabsContent>

        )}







                  <AccordionTrigger className="hover:no-underline py-3">













                      </div>




                        </div>












                        </div>












                        </div>
                      </div>
                    </div>










































            </Accordion>

        )}

    </Dialog>

}
