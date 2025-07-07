import { Routes } from '@angular/router';
import { RegistrarGmailComponent } from './register-mail/register-mail.component';
import { EmailViewerComponent } from './mail-viewer/mail-viewer.component';
import { ImapRegisterComponent } from './imap-register/imap-register.component';

export const routes: Routes = [
  { path: '', redirectTo: 'registrar', pathMatch: 'full' },
  { path: 'registrar', component: RegistrarGmailComponent },
  { path: 'correo', component: EmailViewerComponent },
  { path: 'imap-registrar', component: ImapRegisterComponent },
];
