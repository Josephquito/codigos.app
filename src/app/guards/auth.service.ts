import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';
  private roleKey = 'role';

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  setToken(token: string, role: string) {
    if (this.isBrowser()) {
      localStorage.setItem(this.tokenKey, token);
      localStorage.setItem(this.roleKey, role);
    }
  }

  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.tokenKey) : null;
  }

  getRole(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.roleKey) : null;
  }

  isAuthenticated(): boolean {
    return this.isBrowser() && !!localStorage.getItem(this.tokenKey);
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
}
