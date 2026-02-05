import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// 👇 tu AuthService real está en guards
import { AuthService } from './app/services/auth.service';

bootstrapApplication(AppComponent, appConfig).then((ref) => {
  const auth = ref.injector.get(AuthService);
  auth.scheduleAutoLogout(); // ✅ si hay token, programa expiración
});
