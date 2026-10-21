// Только случайный секрет браузера; прежнее локальное демо не импортируется.
let fallbackToken = "";
export function visitorToken() {
  if (fallbackToken) return fallbackToken;
  try {
    const old = localStorage.getItem("nebylitsy-browser-secret");
    if (old && /^[a-f0-9]{64}$/.test(old)) return (fallbackToken = old);
  } catch {
    /* При запрете storage идентификатор живёт до перезагрузки. */
  }
  fallbackToken = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  try {
    localStorage.setItem("nebylitsy-browser-secret", fallbackToken);
  } catch {
    /* fallback */
  }
  return fallbackToken;
}
export function adminToken() {
  try {
    return sessionStorage.getItem("nebylitsy-admin-session") || "";
  } catch {
    return "";
  }
}
export function saveAdminToken(token: string) {
  sessionStorage.setItem("nebylitsy-admin-session", token);
}
export function clearAdminToken() {
  try {
    sessionStorage.removeItem("nebylitsy-admin-session");
  } catch {
    /* no-op */
  }
}
