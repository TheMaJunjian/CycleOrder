import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Strategy, Stage, Loop, Settings, StrategyLoadMode } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { FloppyDisk, FolderOpen, Trash, StackSimple, ListPlus, CaretDown, CaretUp, StackMinus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateId, formatTime, convertToMilliseconds } from '@/lib/timer-utils'
import { Badge } from '@/components/ui/badge'

interface StrategyManagementDialogProps {
interface StrategyManagementDialogProps {
  currentStages: Stage[]
  currentLoop: Loop
  currentSettings: Settings
  onLoadStrategy: (stages: Stage[], mode: StrategyLoadMode, strategyId: string, strategyName: string) => void

}xport function StrategyManagementDialog({

  currentStages,
  currentLoop,
  currentSettings,
  onLoadStrategy,
}: StrategyManagementDialogProps) {
  const [open, setOpen] = useState(false)
  const [strategies, setStrategies] = useKV<Strategy[]>('saved-strategies', [])
  const [newStrategyName, setNewStrategyName] = useState('')
  const [newStrategyDescription, setNewStrategyDescription] = useState('')

  const handleSaveCurrentStrategy = () => {

  const handleSaveCurrentStrategy = () => {
      return
    }

    if (!currentStages || currentStages.length === 0) {
      toast.error('当前没有阶段，无法保存策略')
    }

    const newStrategy: Strategy = {
      id: generateId(),
      name: newStrategyName.trim(),
    const newStrategy: Strategy = {
      id: generateId(),
      name: newStrategyName.trim(),
      description: newStrategyDescription.trim(),
      stages: currentStages,
      loop: currentLoop,
      loadMode: 'expand',
      isCollapsed: false,
    }
      loadMode: 'expand',
      isCollapsed: false,
    setNewStrategyName('')
    setNewStrategyDescription('')
    toast.success(`策略"${newStrategy.name}"已保存`)
  }

  const handleLoadStrategy = (strategy: Strategy) => {
  }adMode || 'expand'
gy.stages, mode, strategy.id, strategy.name)
    toast.success(`策略"${strategy.name}"已${mode === 'expand' ? '展开' : '嵌入'}加载`)
    const mode = strategy.loadMode || 'expand'
    onLoadStrategy(strategy.stages, mode, strategy.id, strategy.name)
    toast.success(`策略"${strategy.name}"已${mode === 'expand' ? '展开' : '嵌入'}加载`)
  const handleDeleteStrategy = (id: string) => {
    setStrategies((current) => (current || []).filter((s) => s.id !== id))
    toast.success('策略已删除')
  }

  const toggleStrategyLoadMode = (id: string) => {
  }

      (current || []).map((s) => 
        s.id === id 
          ? { ...s, isCollapsed: !s.isCollapsed }
          : s
      )
    )
  }

  const getTotalDuration = (stages: Stage[]): string => {
    let totalMs = 0
    stages.forEach((stage) => {
      totalMs += convertToMilliseconds(stage.duration, stage.unit)
    })
    return formatTime(totalMs)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <StackSimple className="text-primary" />
            策略管理
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <Card className="p-4 sm:p-6 space-y-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <FloppyDisk className="text-primary" size={20} />
              <h3 className="text-lg font-semibold">保存当前配置为策略</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>策略名称</Label>
                <Input
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  placeholder="例如：护眼20-20-20"
                />
              </div>
              <div className="space-y-2">
                <Label>策略描述（可选）</Label>
                <Textarea
                />
              </div>
              <Button 
                onClick={handleSaveCurrentStrategy} 
                className="w-full"
                disabled={!currentStages || currentStages.length === 0}
              >
                <FloppyDisk className="mr-2" />
                保存策略
              </Button>
              {(!currentStages || currentStages.length === 0) && (
                <p className="text-sm text-destructive text-center">请先添加阶段才能保存策略</p>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="text-primary" size={20} />
              <h3 className="text-lg font-semibold">已保存的策略</h3>
            </div>

            <div className="space-y-3">
              {!strategies || strategies.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground bg-muted/20">
                  <p>还没有保存的策略</p>
                  <p className="text-sm mt-2">保存当前配置以便快速复用</p>
                </Card>
              ) : (
                strategies.map((strategy) => (
                  <Card key={strategy.id} className="p-3 sm:p-4 bg-card/80 hover:bg-card transition-colors">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base sm:text-lg truncate">{strategy.name}</h4>
                          {strategy.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{strategy.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleStrategyCollapsed(strategy.id)}
                            title={strategy.isCollapsed ? '展开详情' : '折叠详情'}
                          >
                            {strategy.isCollapsed ? <CaretDown /> : <CaretUp />}
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteStrategy(strategy.id)}
                          >
                            <Trash />
                          </Button>
                        </div>
                      </div>

                      {!strategy.isCollapsed && (
                        <>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary">
                              {strategy.stages.length} 个阶段
                            </Badge>
                            <Badge variant="secondary">
                              总时长: {getTotalDuration(strategy.stages)}
                            </Badge>
                            <Badge variant="secondary">
                              {strategy.loop.loopMode === 'infinite' && '无限循环'}
                              {strategy.loop.loopMode === 'fixed-count' && `${strategy.loop.loopCount}次循环`}
                              {strategy.loop.loopMode === 'time-limited' && '限时循环'}
                            </Badge>
                            <Badge variant="secondary">
                              {new Date(strategy.createdAt).toLocaleDateString()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-muted/20 p-2 rounded">
                            <div>
                              <span className="font-medium">阶段列表:</span>
                              <div className="mt-1 space-y-1">
                                {strategy.stages.slice(0, 3).map((stage, idx) => (
                                  <div key={idx} className="text-muted-foreground">
                                    {idx + 1}. {stage.name} ({stage.duration}{stage.unit === 'minutes' ? '分' : stage.unit === 'seconds' ? '秒' : stage.unit === 'hours' ? '时' : ''})
                                  </div>
                                ))}
                                {strategy.stages.length > 3 && (
                                  <div className="text-muted-foreground">
                                    ...还有 {strategy.stages.length - 3} 个阶段
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => toggleStrategyLoadMode(strategy.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          {strategy.loadMode === 'expand' ? <ListPlus className="mr-2" /> : <StackMinus className="mr-2" />}
                          {strategy.loadMode === 'expand' ? '展开模式' : '嵌入模式'}
                        </Button>
                        <Button
                          onClick={() => handleLoadStrategy(strategy)}
                          variant="default"
                          size="sm"
                          className="flex-1"
                        >
                          加载策略
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
