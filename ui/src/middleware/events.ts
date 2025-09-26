import { API_URL } from './config'
import type { Event, EventCreateInput } from '../types'

export async function fetchEvents(): Promise<Event[]> {
  const resp = await fetch(`${API_URL}/events`)
  const text = await resp.text()
  if (!resp.ok) throw parseError(text, resp.status)
  const data = JSON.parse(text)
  return Array.isArray(data.events) ? data.events : []
}

export async function createEvent(input: EventCreateInput | FormData): Promise<void> {
  const isFormData = typeof FormData !== 'undefined' && input instanceof FormData
  const resp = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: isFormData ? undefined : { 'content-type': 'application/json' },
    body: isFormData ? (input as FormData) : JSON.stringify(input as EventCreateInput)
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


