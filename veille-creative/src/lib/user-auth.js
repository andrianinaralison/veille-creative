// Auth utilisateur (180-16) — token en mémoire, adossé à sessionStorage
// (pas localStorage : survit au refresh de l'onglet, pas au-delà).

const TOKEN_KEY = 'user_token'
let memoryToken = sessionStorage.getItem(TOKEN_KEY)

export function getUserToken() {
  return memoryToken
}

export function setUserToken(token) {
  memoryToken = token
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearUserToken() {
  memoryToken = null
  sessionStorage.removeItem(TOKEN_KEY)
}
