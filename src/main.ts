// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// 👇 importa tu AuthService
import { AuthService } from './app/guards/auth.service';

bootstrapApplication(AppComponent, appConfig).then((ref) => {
  // programa el cierre automático de sesión cuando el JWT caduque
  const auth = ref.injector.get(AuthService);
  auth.scheduleAutoLogout();
});
