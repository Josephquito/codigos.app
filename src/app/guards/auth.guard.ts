// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const currentUrl = route.url.map((segment) => segment.path).join('/');
  if (currentUrl === 'login') {
    return true;
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/login');
};
