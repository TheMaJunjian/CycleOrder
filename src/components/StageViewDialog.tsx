import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Badge } from '@/components/ui/badge'
interface StageViewDialogProps {

  const runningSettings = stage.
    wallpaperM
  }
 

  }
  const getTimeUnitLabel = (unit: string): string =>
      nanoseconds: '纳秒'
      milliseconds: '毫秒',
      minutes: '分钟',
  }

    return labels[unit] || unit

    const labels = getTimeUnitLabel(u
  }
  r

        <DialogHeader>
        </DialogHeader>
      nanoseconds: '纳秒',
            <div classNam
              <p classNam
          </div>
          {stage.isM
              <Bad
              </
          )}
          {stage.
     
    return labels[unit] || unit
   

            </div>
        </div>
        <Tabs defaultValue="runnin
   

          
            
                <h3 className="text-lg font-semibold">音
              
                <div c
                  <div className="flex items-center gap-2">
                      <

                    ) : (
                        <X className="text-red-600" size={20} />
                      </>
                  </div>

                  
          </div>

          {stage.isMerged && (
                      ) : (
                          <X className="t
                        </>
                    </
                )}
          )}

                <Image className="text-primary" size={24} />
              </div>
              <div className="space-y-3 pl-9">
                  <span className="text-sm">壁纸模式</span
                    {runningSettings.wallpaperMode === 'random' ? '随机'
                </div>
                {runningSettings.wallpaperMode === 'fixed' && (
                    <spa
                   
              </div>
                  
            
              

                  </div>
              </div>

              <div className="flex items-center gap-3">
                <h3 c

                <div className="flex items-center justify-between 
                  <div className="flex 
                      <>
                        <span className="text-sm text-muted-foregr
                    ) : (
                    
              
                  </div>
              </div>
                  <span className="text-sm">随机音效</span>
          <TabsContent value="end" className="space-y-6 mt-
              <div className="flex items-center gap-
                <h3 clas
              
                <div className="flex items-center justify-between py-2 border-b bo
                      </>
                      <>
                      <>
                    ) : (
                        <X className="text-red-600" size={20} />
                      </>
                    )}

                </div>

                {!runningSettings.randomSound && (
                          <span className="text-sm text-muted-foreground">已上传</span>
                    <span className="text-sm">自定义音效</span>
                          <X className="text-red-600" size={2
                        </>
                    </div>
                )}
            </div>
                        </>
                <Image clas
              </div>
              <div className="space-y-3 pl-9">
                  <span className="text-sm">壁纸模式</span>
                    {endSet
                </div>
                {endSettin
                    <spa
                  
                    
                  

                          <span classNa
              <div className="flex items-center gap-3">
                  </div>
                <h3 className="text-lg font-semibold">壁纸设置</h3>

              
                <h3 className="text-lg font-se
              
                <div className="flex items-center justi
                  <div className="flex items-
                      <>
                  </Badge>
                    ) 

                      </>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
              </div>
          </TabsContent>
      </DialogContent>
                        <>

                          <span className="text-sm text-muted-foreground">已上传</span>

                      ) : (



                        </>

                    </div>

                )}

            </div>






              




                    {runningSettings.enableVibration ? (



                      </>

                      <>





                </div>

            </div>



            <div className="space-y-4">



              </div>
              




                    {endSettings.randomSound ? (



                      </>

                      <>



                    )}

                </div>









                        </>





                      )}







              <div className="flex items-center gap-3">



              





                  </Badge>







                        <>



                      ) : (





                    </div>

                )}

            </div>









                  <span className="text-sm">启用震动</span>

                    {endSettings.enableVibration ? (









                    )}

                </div>

            </div>

        </Tabs>

    </Dialog>

}
