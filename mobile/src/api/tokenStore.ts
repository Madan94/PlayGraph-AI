// Plain in-memory holder for the current JWT so the API client can attach it without
// importing React context (AuthContext writes here whenever the session changes).
let currentToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentToken = token;
}

export function getAuthToken(): string | null {
  return currentToken;
}
