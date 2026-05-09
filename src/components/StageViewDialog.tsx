import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTri
interface StageViewDialogProps {
  children: React.ReactNode

  const runningSettings = stage.
    wallpaperM
  children: React.ReactNode
}

export function StageViewDialog({ stage, children }: StageViewDialogProps) {
  const runningSettings = stage.runningSettings || {
    randomSound: false,
    wallpaperMode: 'random' as const,
    enableVibration: true,
   

    return labels[unit] || unit

    <Dialog>
      <DialogContent class
   

          <div className="flex items-center justify-be
            <span className="text-sm text-mu
          <div className
            <span classNa
            </span>
          {stage.is
              <Badge
              </Ba
          )}
            <detai
                查
     
    return labels[unit] || unit
   

          
    <Dialog>
          <TabsList className="grid w-full grid-cols-2"
            <TabsTrigger value="end">结束时提示</TabsTrigger>

            <div className="space-y-4">
                <Speake

              <div className="space
                  <span className="text-sm">随机音效</span>
                    {runningSettings.randomSound ? (
                        <span className="text-sm text-muted-foreground">是</span
                
                      <>
                        <X className="text-red-600" size={2
                    )}
                </div>
                  <
                
                    ) : (
                    )}
                )}
            </div>
            <div class
            </div>
            
              <div className="space-y-3 pl-9">
                  <span className="text-s
                    {runningSettings.wallpaperMode === 'random' ? '
                </div>
                  <div c
                    {runningSettings.wallpaper ? (
                    ) : (
                    )}
                )}
            </div>
            <div cl
              </div>
              </div>
            
              

                        <span className="text-sm text-muted-f
                      </>
                      <>
                        <X className="text-red-600" size
                    )

            </div>
            <div className="space-y-4">
            <div className="space-y-4">
                <SpeakerHigh className="text-primary" size={24} />
              </div>
              </div>
              
                    {endSettings.randomSound ?
                        <span className="text-sm text-muted-foreground">是</span>
                      </>
                      <>
                        <X className="text-red-600" 
                    )}
                </div>
                        <Check className="text-green-600" size={20} />
                      </>
                    ) : (
                      <>
                )}
            </div>
            <div classNam
                <Image
              </div>
                </div>
                {!runningSettings.randomSound && (
                    {endSettings.wallpaperMode === 'random' ? '随机壁纸' : '固定壁纸'}
                </div>
                  <div className="flex items-cente
                    {endSettings.wallpaper ? (
                    ) : (
                    )}
                )}
            </div>
            <div c
                <Vib
              </di

                  <span className="text
              <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-
                      </>
                    
              
                    )}
                </div>
            </div>
        </Tabs>
    </Dialog>
                  </span>

                {runningSettings.wallpaperMode === 'fixed' && (

                    <span className="text-sm">自定义壁纸</span>

                      <span className="text-sm text-muted-foreground">已上传</span>





              </div>







              





                      <>


                      </>






                  </div>

              </div>

          </TabsContent>

          <TabsContent value="end" className="space-y-6 mt-6">





              

                <div className="flex items-center justify-between py-2 border-b border-border/50">



                      <>






                        <X className="text-red-600" size={20} />
                      </>

                  </div>




                    {endSettings.soundFile ? (

                    ) : (

                    )}

                )}

            </div>





              </div>

              <div className="space-y-3 pl-9">

                  <span className="text-sm">壁纸模式</span>



                </div>



                    {endSettings.wallpaper ? (



                    )}

                )}

            </div>





              </div>

              <div className="space-y-3 pl-9">

                  <span className="text-sm">启用震动</span>

                    {endSettings.enableVibration ? (
                      <>





                        <span className="text-sm text-muted-foreground">否</span>


                    )}

                </div>

            </div>

        </Tabs>

    </Dialog>

}
