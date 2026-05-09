import { Stage } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { SpeakerHigh, Image, Vibrate, Check, X } from '@phosphor-icons/react'
import { getTimeUnitLabel } from '@/lib/timer-utils'

interface StageViewDialogProps {
  stage: Stage
  children: React.ReactNode
}

function StageSettingsDisplay({ stage }: { stage: Stage }) {
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Running Settings</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <SpeakerHigh className="text-primary" size={20} />
              <span className="font-medium">Sound</span>
            </div>
            <div className="space-y-2 pl-7 text-sm">
              <div className="flex items-center gap-2">
                {runningSettings.randomSound ? (
                  <>
                    <Check className="text-green-600" size={20} />
                    <span className="text-sm">Random sound</span>
                  </>
                ) : (
                  <>
                    <X className="text-muted-foreground" size={20} />
                    <span className="text-sm text-muted-foreground">No random sound</span>
                  </>
                )}
              </div>
              {runningSettings.soundFile && (
                <span className="text-sm">Custom sound uploaded</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Image className="text-primary" size={20} />
              <span className="font-medium">Wallpaper</span>
            </div>
            <div className="space-y-2 pl-7 text-sm">
              <div>
                <span>Mode: </span>
                <span className="text-muted-foreground">
                  {runningSettings.wallpaperMode === 'random' ? 'Random wallpaper' : 'Fixed wallpaper'}
                </span>
              </div>
              {runningSettings.wallpaper && (
                <span className="text-sm">Custom wallpaper uploaded</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Vibrate className="text-primary" size={20} />
              <span className="font-medium">Vibration</span>
            </div>
            <div className="space-y-2 pl-7 text-sm">
              <div className="flex items-center gap-2">
                {runningSettings.enableVibration ? (
                  <>
                    <Check className="text-green-600" size={20} />
                    <span className="text-sm">Vibration enabled</span>
                  </>
                ) : (
                  <>
                    <X className="text-muted-foreground" size={20} />
                    <span className="text-sm text-muted-foreground">Vibration disabled</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">End Settings</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <SpeakerHigh className="text-primary" size={20} />
              <span className="font-medium">Sound</span>
            </div>
            <div className="space-y-2 pl-7 text-sm">
              <div className="flex items-center gap-2">
                {endSettings.randomSound ? (
                  <>
                    <Check className="text-green-600" size={20} />
                    <span className="text-sm">Random sound</span>
                  </>
                ) : (
                  <>
                    <X className="text-muted-foreground" size={20} />
                    <span className="text-sm text-muted-foreground">No random sound</span>
                  </>
                )}
              </div>
              {endSettings.soundFile && (
                <span className="text-sm">Custom sound uploaded</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Image className="text-primary" size={20} />
              <span className="font-medium">Wallpaper</span>
            </div>
            <div className="space-y-2 pl-7 text-sm">
              <div>
                <span>Mode: </span>
                <span className="text-muted-foreground">
                  {endSettings.wallpaperMode === 'random' ? 'Random wallpaper' : 'Fixed wallpaper'}
                </span>
              </div>
              {endSettings.wallpaper && (
                <span className="text-sm">Custom wallpaper uploaded</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Vibrate className="text-primary" size={20} />
              <span className="font-medium">Vibration</span>
            </div>
            <div className="space-y-2 pl-7 text-sm">
              <div className="flex items-center gap-2">
                {endSettings.enableVibration ? (
                  <>
                    <Check className="text-green-600" size={20} />
                    <span className="text-sm">Vibration enabled</span>
                  </>
                ) : (
                  <>
                    <X className="text-muted-foreground" size={20} />
                    <span className="text-sm text-muted-foreground">Vibration disabled</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StageViewDialog({ stage, children }: StageViewDialogProps) {
  const isMergedStage = stage.isMerged || stage.isEmbeddedStrategy
  const hasSubStages = stage.embeddedStrategyStages && stage.embeddedStrategyStages.length > 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{stage.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Duration:</span>
            <span className="text-muted-foreground">
              {stage.duration} {getTimeUnitLabel(stage.unit)}
            </span>
          </div>

          {isMergedStage && (
            <div className="space-y-2">
              <Badge variant="secondary">
                {stage.isEmbeddedStrategy ? 'Embedded Strategy' : 'Merged Stage'}
              </Badge>
              {hasSubStages && (
                <p className="text-sm text-muted-foreground">
                  Contains {stage.embeddedStrategyStages?.length} sub-stages
                </p>
              )}
            </div>
          )}

          {hasSubStages && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Sub-stage Details</h4>
              <Accordion type="single" collapsible className="w-full">
                {stage.embeddedStrategyStages!.map((subStage, index) => (
                  <AccordionItem key={subStage.id} value={subStage.id}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{index + 1}</span>
                        <span className="text-sm">{subStage.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {subStage.duration} {getTimeUnitLabel(subStage.unit)}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-4 pt-2">
                        <StageSettingsDisplay stage={subStage} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {!hasSubStages && <StageSettingsDisplay stage={stage} />}
        </div>
      </DialogContent>
    </Dialog>
  )
}
