import { useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type NumericInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  value: number
  onValueCommit: (value: number | null) => void
}

export function NumericInput({ value, onValueCommit, onBlur, onFocus, ...props }: NumericInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      value={draft ?? value}
      onFocus={(event) => {
        setDraft(event.currentTarget.value)
        onFocus?.(event)
      }}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => {
        const parsedValue = draft === null || draft.trim() === '' ? null : Number(draft)
        onValueCommit(parsedValue !== null && Number.isFinite(parsedValue) ? parsedValue : null)
        setDraft(null)
        onBlur?.(event)
      }}
    />
  )
}