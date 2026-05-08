import { TimeUnit } from '@/types'

export const TIME_UNITS: Record<TimeUnit, number> = {
  nanoseconds: 0.000001,
  microseconds: 0.001,
  milliseconds: 1,
  seconds: 1000,
  minutes: 60000,
  hours: 3600000,
  days: 86400000,
  months: 2592000000,
  years: 31536000000,
}

export function convertToMilliseconds(value: number, unit: TimeUnit): number {
  return value * TIME_UNITS[unit]
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}天 ${hours % 24}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  }
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function vibrateDevice(pattern?: number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern || [200])
  }
}
