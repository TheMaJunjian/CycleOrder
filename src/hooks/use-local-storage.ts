import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const storedValue = window.localStorage.getItem(key)
      return storedValue === null ? initialValue : JSON.parse(storedValue) as T
    } catch (error) {
      console.error(`[local-storage] Failed to read ${key}`, error)
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`[local-storage] Failed to write ${key}`, error)
    }
  }, [key, value])

  return [value, setValue]
}