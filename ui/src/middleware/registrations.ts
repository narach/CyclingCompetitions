import { API_URL } from './config'
import type { RegistrationDTO, RegistrationInput } from '../types'

export async function registerForEvent(input: RegistrationInput): Promise<{ registration: RegistrationDTO }> {
  const resp = await fetch(`${API_URL}/registrations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  })
  const text = await resp.text()
  if (!resp.ok) throw parseError(text, resp.status)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Invalid response from server')
  }
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


