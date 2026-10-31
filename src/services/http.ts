import axios, { AxiosError } from 'axios'
import type { Paginated } from '@/types'
import { mockAdapter } from '@/mock/adapter'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
export const TOKEN_KEY = 'tnh_token'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
  ...(USE_MOCK ? { adapter: mockAdapter } : {}),
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('tnh:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export interface ApiErrorInfo { message: string; status?: number; fields: Record<string, string> }
export function parseApiError(e: unknown): ApiErrorInfo {
  const err = e as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
  const fields: Record<string, string> = {}
  for (const [k, v] of Object.entries(err.response?.data?.errors ?? {})) fields[k] = v[0]
  return { message: err.response?.data?.message ?? (e instanceof Error ? e.message : 'Something went wrong. Please try again.'), status: err.response?.status, fields }
}

type Params = Record<string, unknown>
export async function getData<T>(url: string, params?: Params): Promise<T> { return (await http.get<{ data: T }>(url, { params })).data.data }
export async function getPage<T>(url: string, params?: Params): Promise<Paginated<T>> { return (await http.get<Paginated<T>>(url, { params })).data }
export async function postData<T>(url: string, body?: unknown): Promise<T> { return (await http.post<{ data: T }>(url, body)).data.data }
export async function putData<T>(url: string, body?: unknown): Promise<T> { return (await http.put<{ data: T }>(url, body)).data.data }
export async function patchData<T>(url: string, body?: unknown): Promise<T> { return (await http.patch<{ data: T }>(url, body)).data.data }
export async function delData<T = { message: string }>(url: string): Promise<T> { return (await http.delete<{ data: T }>(url)).data.data }
