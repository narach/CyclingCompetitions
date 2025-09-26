import { API_URL } from './config'

export type LoginResponse = { accessToken: string, expiresIn: number }

export async function loginAdmin(username: string, password: string): Promise<LoginResponse> {
  const resp = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  const text = await resp.text()
  if (!resp.ok) {
    let msg = 'Request failed'
    try { const j = JSON.parse(text); msg = j?.error || j?.message || msg } catch {}
    const err = new Error(`${msg} (HTTP ${resp.status})`)
    ;(err as any).status = resp.status
    throw err
  }
  return JSON.parse(text)
}

export function storeAdminToken(token: string) {
  try { localStorage.setItem('adminToken', token) } catch {}
}

export function getAdminToken(): string | null {
  try { return localStorage.getItem('adminToken') } catch { return null }
}


