"use client";

const TOKEN_KEY = "modacert_token";
const USER_KEY = "modacert_user";
const REMEMBER_KEY = "modacert_remember";
const EMAIL_KEY = "modacert_email";
const RETURN_PATH_KEY = "modacert_return_path";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string | null;
  country?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
}

function readFrom(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeTo(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function removeFrom(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return readFrom(localStorage, TOKEN_KEY) ?? readFrom(sessionStorage, TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = readFrom(localStorage, USER_KEY) ?? readFrom(sessionStorage, USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isRemembered(): boolean {
  if (typeof window === "undefined") return false;
  return readFrom(localStorage, REMEMBER_KEY) === "1";
}

export function getStoredEmail(): string | null {
  if (typeof window === "undefined") return null;
  return readFrom(localStorage, EMAIL_KEY);
}

function isSafeReturnPath(path: string | null): path is string {
  return Boolean(path?.startsWith("/") && !path.startsWith("//") && !path.includes("\\") && !path.startsWith("/signin"));
}

export function rememberAuthReturnPath(path: string): void {
  if (typeof window === "undefined" || !isSafeReturnPath(path)) return;
  writeTo(sessionStorage, RETURN_PATH_KEY, path);
}

export function consumeAuthReturnPath(fallback = "/checkout"): string {
  if (typeof window === "undefined") return fallback;
  const path = readFrom(sessionStorage, RETURN_PATH_KEY);
  removeFrom(sessionStorage, RETURN_PATH_KEY);
  return isSafeReturnPath(path) ? path : fallback;
}

export function saveAuth(token: string, user: AuthUser, remember: boolean): void {
  const storage = remember ? localStorage : sessionStorage;
  writeTo(storage, TOKEN_KEY, token);
  writeTo(storage, USER_KEY, JSON.stringify(user));
  if (remember) {
    writeTo(localStorage, REMEMBER_KEY, "1");
    writeTo(localStorage, EMAIL_KEY, user.email);
  } else {
    removeFrom(localStorage, REMEMBER_KEY);
    removeFrom(localStorage, EMAIL_KEY);
    removeFrom(localStorage, TOKEN_KEY);
    removeFrom(localStorage, USER_KEY);
  }
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  removeFrom(localStorage, TOKEN_KEY);
  removeFrom(localStorage, USER_KEY);
  removeFrom(sessionStorage, TOKEN_KEY);
  removeFrom(sessionStorage, USER_KEY);
  removeFrom(localStorage, REMEMBER_KEY);
  removeFrom(localStorage, EMAIL_KEY);
}
