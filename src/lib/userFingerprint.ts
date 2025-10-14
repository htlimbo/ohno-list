import { v4 as uuidv4 } from 'uuid'

export function getUserFingerprint(): string {
  if (typeof window === 'undefined') return ''
  
  let fingerprint = localStorage.getItem('user_fingerprint')
  
  if (!fingerprint) {
    fingerprint = uuidv4()
    localStorage.setItem('user_fingerprint', fingerprint)
  }
  
  return fingerprint
}