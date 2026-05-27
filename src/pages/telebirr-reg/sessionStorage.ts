import { SESSION_STORAGE_KEY, SESSION_STORAGE_TTL_MS } from './constants'
import type { TelebirrRegistrationSuccessState } from './types'

interface StoredPayload {
  savedAt: number
  state: TelebirrRegistrationSuccessState
}

export function saveRegistrationSuccess(state: TelebirrRegistrationSuccessState): void {
  try {
    const payload: StoredPayload = { savedAt: Date.now(), state }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode errors
  }
}

export function loadRegistrationSuccess(): TelebirrRegistrationSuccessState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null

    const payload = JSON.parse(raw) as StoredPayload
    if (!payload?.state?.registrationData) return null

    if (Date.now() - payload.savedAt > SESSION_STORAGE_TTL_MS) {
      clearRegistrationSuccess()
      return null
    }

    return payload.state
  } catch {
    return null
  }
}

export function clearRegistrationSuccess(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // ignore
  }
}
