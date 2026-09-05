/**
 * El access token vive únicamente en memoria (nunca en localStorage/sessionStorage),
 * tal como exige la especificación. Este módulo es el único lugar del frontend que
 * lo guarda; AuthContext se suscribe a los cambios para re-renderizar.
 */
type Listener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function onAccessTokenChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
