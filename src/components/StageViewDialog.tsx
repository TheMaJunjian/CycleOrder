import { Stage } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 
import { Badge } from '@/components/ui/badge'
interface StageViewDialogProps {
import { Badge } from '@/components/ui/badge'
  const runningSettings = s
interface StageViewDialogProps {

  const runningSettings = s.endSettings || {
    wallpaperMode: 'random' as const,

      nanoseconds: '纳秒',
   
  }
      days: '天',
      nanoseconds: '纳秒',
    return labels[unit] || unit

   

    const days = Math.floor(hours / 24)
    const parts = []
    if (hours % 24 > 0) 
    if (seconds % 60 > 0)
    const days = Math.floor(hours / 24)

    if (hours % 24 > 0) 
    if (seconds % 60 > 0)
    return parts.length >

          <div cl
     
                <div className=
        
          <div cl
     
                <div className=
   

              </div>
          </div>
          {stage.isMerged && (
              {stage.isEmbeddedStrategy ? '嵌
          )}
          {stage.isEmbeddedStrategy && 

                {sta
                    <span>{idx + 1}. {su

   


            
                <SpeakerHigh className="text-primary" s
              </div>
              <div cla
                  <span className="text-sm">随机音效</span>
                    {ru
        
                      </>
                      <>
                        <span className="text-sm text-muted-for
                    )}
                </div>
                {!runningSettings.randomSound && (
                    <span className="text-sm">自定义音效</span>
                      
                          <Check className="text-green-600" siz
                        </>
                      
                    
                  
                


              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">壁纸设置</h3>
              
            

                  </Badge>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div className="flex items-ce
                        <>
                          <span className="text-sm text-muted-foreground">已上传</span>
                      ) : (
                          <X className="text-red-600" size={
                        </>
                    </div>
                )}
            </div>
            <div cla
                <V
            
              

                    {runningSettings.enableVibration ? (
                        <Check className="text-green-600
                      </>
                      <>
                     

                </div>
            </div>

            <div className="space-y-4">
                <SpeakerHigh className="text-primary" size={24}
              </div>
              
                  <span className="text-sm">随机
                    {endSettings.randomSound ? (
                        <Check className="text-green-60
                      </>
                      <>
                        
                    )}
                </div>
                {!endSett
                    <span
                      {e
                          <Check className="text-green-600" size
                        </>
                        <
                      
                      )}
                  </di


              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">壁纸设置
              
                <div className="flex items-center ju
                  <Badge v
                  </Badge>

                  <div clas
                    <div cl
                        <>
                          <span className="text-sm text-muted-fore
                      ) : (
                          <
                        
                    </div>
                )}
            </div>
            <div cla
                <V

              <div className="space-y-3
                  <span className="text-sm">启用震动</span>
                    {endSettings.enableVibration ? (
                        <Check className="text-green-600" size=
                    
              
                        <span className="text-
                    )}
                </div>
            </div>
        </Tabs>
    </Dialog>
}

































































































































































