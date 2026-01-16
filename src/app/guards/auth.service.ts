// src/app/guards/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

type JwtPayload = {
  exp?: number;
  role?: string;
  [key: string]: any;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  private tokenKey = 'token';
  private roleKey = 'role';

  private logoutInProgress = false;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // ===== Token storage =====

  setToken(token: string, role?: string): void {
    if (!this.isBrowser()) return;

    localStorage.setItem(this.tokenKey, token);

    // Si no te pasan role, intentamos extraerlo del JWT
    const resolvedRole = role ?? this.getRoleFromToken(token) ?? 'USER';
    localStorage.setItem(this.roleKey, resolvedRole);

    this.scheduleAutoLogout(token);
  }

  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.tokenKey) : null;
  }

  getRole(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.roleKey) : null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  // ===== Auth checks =====

  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  logout(): void {
    if (!this.isBrowser()) return;

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  // ===== Expiration / JWT decoding =====

  isTokenExpired(token: string): boolean {
    const payload = this.decodeJwt(token);
    const exp = payload?.exp;
    if (!exp) return true;
    const nowSec = Math.floor(Date.now() / 1000);
    return exp <= nowSec;
  }

  private getRoleFromToken(token: string): string | null {
    const payload = this.decodeJwt(token);
    return (payload?.role as string) ?? null;
  }

  private decodeJwt(token: string): JwtPayload | null {
    try {
      const part = token.split('.')[1];
      if (!part) return null;

      // base64url -> base64
      const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
      // padding correcto
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '='
      );

      const json = atob(padded);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  /** Programa auto-logout para la expiración (con margen configurable) */
  scheduleAutoLogout(token?: string): void {
    if (!this.isBrowser()) return;

    const t = token ?? this.getToken();
    if (!t) return;

    const payload = this.decodeJwt(t);
    const exp = payload?.exp;
    if (!exp) {
      this.forceSessionExpired();
      return;
    }

    // Cancelar timer previo
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }

    const expMs = exp * 1000;

    // Margen de seguridad: 30 segundos antes de expirar
    const safetyMarginMs = 30_000;

    const msLeft = expMs - Date.now() - safetyMarginMs;

    if (msLeft <= 0) {
      this.forceSessionExpired();
      return;
    }

    this.logoutTimer = setTimeout(() => this.forceSessionExpired(), msLeft);
  }

  /** Limpia sesión, marca flag y redirige a /login */
  forceSessionExpired(): void {
    if (!this.isBrowser()) return;
    if (this.logoutInProgress) return;

    this.logoutInProgress = true;

    this.logout();
    sessionStorage.setItem('sessionExpired', '1');

    this.router.navigate(['/login']).finally(() => {
      this.logoutInProgress = false;
    });
  }
}
