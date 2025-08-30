// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const currentUrl = route.url.map((segment) => segment.path).join('/');
  if (currentUrl === 'login') return true;

  // ✅ si no está autenticado o el token venció, forzamos expiración
  if (!auth.isAuthenticated()) {
    auth.forceSessionExpired();
    return false;
  }

  return true;
};
