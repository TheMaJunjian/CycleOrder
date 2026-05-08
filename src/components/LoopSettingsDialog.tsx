import { useState } from 'react'
import { Loop, TimeUnit, LoopMode } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Repeat } from '@phosphor-icons/react'

interface LoopSettingsDialogProps {
  loop: Loop
  onUpdate: (updates: Partial<Loop>) => void
  children: React.ReactNode
}

export function LoopSettingsDialog({ loop, onUpdate, children }: LoopSettingsDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Repeat className="text-primary" />
            循环设置
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>循环模式</Label>
            <Select 
              value={loop.loopMode} 
              onValueChange={(value: LoopMode) => onUpdate({ loopMode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infinite">无限循环</SelectItem>
                <SelectItem value="fixed-count">固定次数循环</SelectItem>
                <SelectItem value="time-limited">限定总时长循环</SelectItem>
                <SelectItem value="nested">嵌套循环</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loop.loopMode === 'fixed-count' && (
            <div className="space-y-2">
              <Label>循环次数</Label>
              <Input
                type="number"
                value={loop.loopCount || 1}
                onChange={(e) => onUpdate({ loopCount: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          )}

          {loop.loopMode === 'time-limited' && (
            <div className="space-y-2">
              <Label>限定总时长</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={loop.loopDuration || 60}
                  onChange={(e) => onUpdate({ loopDuration: parseFloat(e.target.value) || 0 })}
                  step="0.1"
                  className="flex-1"
                />
                <Select 
                  value={loop.loopDurationUnit || 'minutes'} 
                  onValueChange={(value: TimeUnit) => onUpdate({ loopDurationUnit: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nanoseconds">纳秒</SelectItem>
                    <SelectItem value="microseconds">微秒</SelectItem>
                    <SelectItem value="milliseconds">毫秒</SelectItem>
                    <SelectItem value="seconds">秒</SelectItem>
                    <SelectItem value="minutes">分钟</SelectItem>
                    <SelectItem value="hours">小时</SelectItem>
                    <SelectItem value="days">天</SelectItem>
                    <SelectItem value="months">月</SelectItem>
                    <SelectItem value="years">年</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {loop.loopMode === 'nested' && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                嵌套循环模式下，当前组将作为一个整体在更大的循环中重复执行
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
