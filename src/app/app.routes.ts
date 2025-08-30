// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { RegistrarGmailComponent } from './register-mail/register-mail.component';
import { EmailViewerComponent } from './mail-viewer/mail-viewer.component';
import { ImapRegisterComponent } from './imap-register/imap-register.component';
import { LoginComponent } from './login/login.component';
import { CuentasComponent } from './cuentas/cuentas.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'correo', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'correo', component: EmailViewerComponent },

  // ✅ Rutas protegidas
  {
    path: 'registrar',
    component: RegistrarGmailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'imap-registrar',
    component: ImapRegisterComponent,
    canActivate: [authGuard],
  },
  { path: 'cuentas', component: CuentasComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' },
];
