import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(): boolean | UrlTree {
    // ❌ si ya está logueado, no puede entrar a /login
    if (this.auth.isLoggedIn()) {
      return this.router.parseUrl('/'); // o /dashboard
    }

    // ✅ si NO está logueado, sí puede
    return true;
  }
}
