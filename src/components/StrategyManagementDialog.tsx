import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Strategy, Stage, Loop, Settings } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { FloppyDisk, FolderOpen, Trash, StackSimple, ListPlus } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { generateId } from '@/lib/timer-utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface StrategyManagementDialogProps {
  children: React.ReactNode
  currentStages: Stage[]
  currentLoop: Loop
  currentSettings: Settings
  onLoadStrategy: (stages: Stage[], mode: 'expand' | 'embed') => void
}

export function StrategyManagementDialog({
  children,
  currentStages,
  currentLoop,
  currentSettings,
  onLoadStrategy,
}: StrategyManagementDialogProps) {
  const [open, setOpen] = useState(false)
  const [strategies, setStrategies] = useKV<Strategy[]>('saved-strategies', [])
  const [newStrategyName, setNewStrategyName] = useState('')
  const [newStrategyDescription, setNewStrategyDescription] = useState('')
  const [loadMode, setLoadMode] = useState<'expand' | 'embed'>('expand')

  const handleSaveCurrentStrategy = () => {
    if (!newStrategyName.trim()) {
      toast.error('请输入策略名称')
      return
    }

    const newStrategy: Strategy = {
      id: generateId(),
      name: newStrategyName.trim(),
      description: newStrategyDescription.trim(),
      stages: currentStages,
      loop: currentLoop,
      settings: currentSettings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setStrategies((current) => [...(current || []), newStrategy])
    setNewStrategyName('')
    setNewStrategyDescription('')
    toast.success(`策略"${newStrategy.name}"已保存`)
  }

  const handleLoadStrategy = (strategy: Strategy) => {
    onLoadStrategy(strategy.stages, loadMode)
    toast.success(`策略"${strategy.name}"已${loadMode === 'expand' ? '展开' : '嵌入'}加载`)
    setOpen(false)
  }

  const handleDeleteStrategy = (id: string) => {
    setStrategies((current) => (current || []).filter((s) => s.id !== id))
    toast.success('策略已删除')
  }

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
                  value={newStrategyDescription}
                  onChange={(e) => setNewStrategyDescription(e.target.value)}
                  placeholder="简要描述此策略的用途"
                  rows={2}
                />
              </div>
              <Button onClick={handleSaveCurrentStrategy} className="w-full">
                <FloppyDisk className="mr-2" />
                保存策略
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="text-primary" size={20} />
                <h3 className="text-lg font-semibold">已保存的策略</h3>
              </div>
              {strategies && strategies.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm whitespace-nowrap">加载模式:</Label>
                  <Select value={loadMode} onValueChange={(v: 'expand' | 'embed') => setLoadMode(v)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expand">展开</SelectItem>
                      <SelectItem value="embed">嵌入</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteStrategy(strategy.id)}
                          className="shrink-0"
                        >
                          <Trash />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded">
                          {strategy.stages.length} 个阶段
                        </span>
                        <span className="bg-muted px-2 py-1 rounded">
                          {strategy.loop.loopMode === 'infinite' && '无限循环'}
                          {strategy.loop.loopMode === 'fixed-count' && `${strategy.loop.loopCount}次循环`}
                          {strategy.loop.loopMode === 'time-limited' && '限时循环'}
                        </span>
                        <span className="bg-muted px-2 py-1 rounded">
                          {new Date(strategy.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleLoadStrategy(strategy)}
                        variant="secondary"
                        className="w-full"
                      >
                        <ListPlus className="mr-2" />
                        {loadMode === 'expand' ? '展开加载' : '嵌入为单阶段'}
                      </Button>
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
