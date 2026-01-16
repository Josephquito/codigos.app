// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { ImapRegisterComponent } from './imap-register/imap-register.component';
import { LoginComponent } from './login/login.component';
import { CuentasComponent } from './cuentas/cuentas.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { UsersComponent } from './users/users.component';
import { EmailPrivateComponent } from './email-private/email-private.component';
import { EmailPublicComponent } from './email-public/email-public.component';

export const routes: Routes = [
  { path: '', redirectTo: 'correo', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'correo', component: EmailPublicComponent },

  // ✅ Rutas protegidas
  {
    path: 'registrar',
    loadComponent: () =>
      import('./gmail-register/gmail-register.component').then(
        (m) => m.GmailRegisterComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'imap-registrar',
    component: ImapRegisterComponent,
    canActivate: [authGuard],
  },
  {
    path: 'correo-privado',
    component: EmailPrivateComponent,
    canActivate: [authGuard],
  },
  {
    path: 'cuentas',
    component: CuentasComponent,
    canActivate: [authGuard],
  },

  // ✅ SOLO ADMIN
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [adminGuard],
  },

  { path: '**', redirectTo: 'correo' },
];
