import { API_URL } from './config'
import type { Event, EventCreateInput } from '../types'

export async function fetchEvents(): Promise<Event[]> {
  const resp = await fetch(`${API_URL}/events`)
  const text = await resp.text()
  if (!resp.ok) throw parseError(text, resp.status)
  const data = JSON.parse(text)
  return Array.isArray(data.events) ? data.events : []
}

function getAuthToken(): string | null {
  try { return localStorage.getItem('adminToken') } catch { return null }
}

export async function createEvent(input: EventCreateInput | FormData): Promise<void> {
  const isFormData = typeof FormData !== 'undefined' && input instanceof FormData
  const token = getAuthToken()
  const headers: Record<string, string> | undefined = isFormData ? {} : { 'content-type': 'application/json' }
  if (token && headers) headers['authorization'] = `Bearer ${token}`
  const resp = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers,
    body: isFormData ? (input as FormData) : JSON.stringify(input as EventCreateInput)
  })
  const text = await resp.text()
  if (!resp.ok) throw parseError(text, resp.status)
}

export async function updateEvent(id: number | string, input: EventCreateInput | FormData): Promise<void> {
  const isFormData = typeof FormData !== 'undefined' && input instanceof FormData
  const token = getAuthToken()
  const headers: Record<string, string> | undefined = isFormData ? {} : { 'content-type': 'application/json' }
  if (token && headers) headers['authorization'] = `Bearer ${token}`
  const resp = await fetch(`${API_URL}/events/${encodeURIComponent(String(id))}`, {
    method: 'PUT',
    headers,
    body: isFormData ? (input as FormData) : JSON.stringify(input as EventCreateInput)
  })
  const text = await resp.text()
  if (!resp.ok) throw parseError(text, resp.status)
}

export async function deleteEvent(id: number | string): Promise<void> {
  const token = getAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers['authorization'] = `Bearer ${token}`
  const resp = await fetch(`${API_URL}/events/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers
  })
  const text = await resp.text()
  if (!resp.ok) throw parseError(text, resp.status)
}

function parseError(text: string, status: number): Error {
  try {
    const j = JSON.parse(text)
    const msg = j?.message || j?.error || text
    return new Error(`${msg} (HTTP ${status})`)
  } catch {
    return new Error(`${text || 'Request failed'} (HTTP ${status})`)
  }
}


