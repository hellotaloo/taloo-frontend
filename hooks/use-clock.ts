'use client'

import { useState, useEffect } from 'react'

export function useClock() {
  const [time, setTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }

    const interval = setInterval(update, 10_000)
    return () => clearInterval(interval)
  }, [])

  return time
}
