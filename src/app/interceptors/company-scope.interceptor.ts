import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { CompanyContextService } from '../services/company-context.service';

export const companyScopeInterceptor: HttpInterceptorFn = (req, next) => {
  const ctx = inject(CompanyContextService);

  // No meter header en auth/login (ajusta si tu backend usa otras rutas)
  const isAuth = req.url.includes('/auth') || req.url.includes('/login');

  if (isAuth) return next(req);

  const companyId = ctx.companyId();
  if (!companyId) return next(req);

  const cloned = req.clone({
    setHeaders: { 'x-company-id': String(companyId) },
  });

  return next(cloned);
};
