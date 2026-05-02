import { SESSION_STORAGE_KEY } from './constants'

/** Works in browsers and Jest (no Web Crypto in some test runners). */
export function randomId() {
  try {
    if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
      return window.crypto.randomUUID()
    }
  } catch {
    /* ignore */
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export const isDigitOnly = (s) => /^\d+$/.test(String(s).trim())

export function getOrCreateSessionId() {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!id) {
      id = randomId()
      localStorage.setItem(SESSION_STORAGE_KEY, id)
    }
    return id
  } catch {
    return randomId()
  }
}

export function routePillClass(meta) {
  if (!meta) return 'tool'
  if (meta === 'Error') return 'error'
  if (meta.includes('Tool')) return 'tool'
  return 'rag'
}

export function pipeAvatarClass(agentId) {
  const safe = String(agentId || '').replace(/[^a-z0-9_-]/gi, '')
  return safe ? `pipe-card-avatar--id-${safe}` : 'pipe-card-avatar--id-unknown'
}
