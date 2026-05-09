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

export function formatTime(milliseconds: number, showMilliseconds: boolean = false): string {
  const totalSeconds = milliseconds / 1000
  const seconds = Math.floor(totalSeconds)
  const ms = Math.floor((totalSeconds - seconds) * 10)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${showMilliseconds ? `.${ms}` : ''}`
  }
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${showMilliseconds ? `.${ms}` : ''}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}${showMilliseconds ? `.${ms}` : ''}`
}

export function getTimeUnitLabel(unit: string, locale: 'zh' | 'en' = 'zh'): string {
  const labels: Record<string, { zh: string; en: string }> = {
    nanoseconds: { zh: '纳秒', en: 'ns' },
    microseconds: { zh: '微秒', en: 'μs' },
    milliseconds: { zh: '毫秒', en: 'ms' },
    seconds: { zh: '秒', en: 's' },
    minutes: { zh: '分钟', en: 'min' },
    hours: { zh: '小时', en: 'h' },
    days: { zh: '天', en: 'd' },
    months: { zh: '月', en: 'mo' },
    years: { zh: '年', en: 'y' },
  }
  return labels[unit]?.[locale] || unit
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function vibrateDevice(pattern?: number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern || [200])
  }
}
