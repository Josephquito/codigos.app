// src/app/guards/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  private tokenKey = 'token';
  private roleKey = 'role';
  private logoutInProgress = false;

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  setToken(token: string, role: string) {
    if (this.isBrowser()) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.roleKey, role);
      this.scheduleAutoLogout(); // 👈 programa cierre al expirar
    }
  }

  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.tokenKey) : null;
  }

  getRole(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.roleKey) : null;
  }

  isAuthenticated(): boolean {
    if (!this.isBrowser()) return false;
    const token = localStorage.getItem(this.tokenKey);
    if (!token) return false;
    return !this.isTokenExpired(token); // 👈 ahora valida expiración
  }

  isAdmin(): boolean {
    return this.isBrowser() && localStorage.getItem(this.roleKey) === 'ADMIN';
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.roleKey);
    }
  }

  // === NUEVO ===

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload?.exp;
      if (!exp) return true;
      const now = Math.floor(Date.now() / 1000);
      return exp <= now;
    } catch {
      return true;
    }
  }

  /** Programa el auto-logout cuando el token caduque */
  scheduleAutoLogout(): void {
    const token = this.getToken();
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = payload.exp * 1000;
      const msLeft = expMs - Date.now() - 300; // pequeño margen
      if (msLeft > 0) {
        setTimeout(() => this.forceSessionExpired(), msLeft);
      } else {
        this.forceSessionExpired();
      }
    } catch {
      this.forceSessionExpired();
    }
  }

  /** Limpia sesión, marca flag de expiración y redirige a /login */
  forceSessionExpired(): void {
    if (this.logoutInProgress) return;
    this.logoutInProgress = true;

    this.logout();
    // usamos sessionStorage para mostrar el toast en /login
    if (this.isBrowser()) sessionStorage.setItem('sessionExpired', '1');

    this.router.navigate(['/login']).finally(() => {
      this.logoutInProgress = false;
    });
  }
}
