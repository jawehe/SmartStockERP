// src/hooks/useApi.ts
import { useState, useCallback } from 'react'
import api from '../services/api'

interface UseApiState<T> {
  data:    T | null
  loading: boolean
  error:   string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null, loading: false, error: null,
  })

  const execute = useCallback(async (
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    body?: unknown
  ): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await api[method]<{ data: T }>(url, body)
      const data = res.data.data ?? (res.data as unknown as T)
      setState({ data, loading: false, error: null })
      return data
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        .response?.data?.message ?? 'Une erreur est survenue'
      setState((prev) => ({ ...prev, loading: false, error: msg }))
      return null
    }
  }, [])

  const get    = useCallback((url: string) => execute('get', url), [execute])
  const post   = useCallback((url: string, body: unknown) => execute('post', url, body), [execute])
  const put    = useCallback((url: string, body: unknown) => execute('put', url, body), [execute])
  const del    = useCallback((url: string) => execute('delete', url), [execute])
  const reset  = useCallback(() => setState({ data: null, loading: false, error: null }), [])

  return { ...state, get, post, put, del, reset }
}