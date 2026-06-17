import { useState, useRef, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((msg, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ msg, type })
    timerRef.current = setTimeout(() => {
      setToast(null)
      timerRef.current = null
    }, 3600)
  }, [])

  return { toast, showToast }
}
