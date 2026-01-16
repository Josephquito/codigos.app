import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // si no está logueado o token expiró, authGuard ya lo haría,
  // pero por seguridad lo revalidamos
  if (!auth.isAuthenticated()) {
    auth.forceSessionExpired();
    return false;
  }

  if (!auth.isAdmin()) {
    router.navigate(['/correo']);
    return false;
  }

  return true;
};
