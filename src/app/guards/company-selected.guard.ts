import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CompanyContextService } from '../services/company-context.service';

export const CompanySelectedGuard: CanActivateFn = () => {
  const ctx = inject(CompanyContextService);
  const router = inject(Router);

  if (ctx.companyId()) return true;

  router.navigateByUrl('/companies'); // manda a seleccionar company
  return false;
};
