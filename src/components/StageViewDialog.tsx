import { Stage } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
            <span className="text-sm">{stage
          
            <div classNam
                {stage.is
            </div>

            <detai
                
              <div
                 
     
              </div>
   

          
            

            <div className="space-y-4">
                <Speak
              </div>
              <div clas
        
                    {runningSetting
                        <Check className="text-green-600" size={20} />
                      </>
                      <>
                
          
                </div>
                {!runningSettings.randomSound && (
                    <span className="text
                      <span className="text-sm text-muted-fo
                      
                  
            

              <div className="flex items-center gap-3">
                <h3 className="text-lg fo
              
                <div className="flex items-center justify-betw
                  <span 
                  </span>
                {runningSettings.wallpaperMode === 'fixed' && (
                    <span className="text-sm">自定义壁纸</span>
                      <span className="text-sm text-muted-foreground">已上传</span>
                      <s
                  <
              </div>

            
              

                <div className="flex items-center justif
                  <div className="flex items-center gap-
                      <>
                        <span className="text-sm text-mu
                    )

                      </>
                  </div>
              </div>
          </TabsContent>
          <TabsContent value="end" className="space-y-6 mt-6">
              <div c
              
              
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div className="flex items-center gap
                      <>
                        <span className="text-sm tex
                    ) : 
                        <X className="text-red-600" size={20} />
                      </>
                  </div>

                  <div c
                    {endSettings.soundFile ? (
                    ) : (
                    )}
                )}
            </div>
            <div class

              </div>
              <div className="space-y-3 pl-9">
                  <span className="text-sm">壁纸模式</span>
                    {endSettings.wallpaperMode ===
                </div>
                  <div cl
                    {endSettings.wallpaper ? (
                    ) 
                    )}
                )}
            </div>
            <div c

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






































































































































