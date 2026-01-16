// src/app/guards/guest.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, no debe ver /login
  if (auth.isAuthenticated()) {
    router.navigateByUrl('/correo-privado'); // o '/cuentas' o lo que quieras como home privada
    return false;
  }

  return true;
};
