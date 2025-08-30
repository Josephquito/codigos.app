// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../guards/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe({
    error: (err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        // cualquier 401 → tratamos como sesión expirada/inválida
        auth.forceSessionExpired();
      }
      throw err;
    },
  } as any);
};
