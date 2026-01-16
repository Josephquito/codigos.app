import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../guards/auth.service';
import { environment } from '../../environments/environment';
import { finalize } from 'rxjs/operators';

type LoginResponse = {
  access_token: string;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';

  errorMessage = '';
  cargando = false;
  expired = false;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const flag = sessionStorage.getItem('sessionExpired');
      if (flag === '1') {
        sessionStorage.removeItem('sessionExpired');
        this.expired = true;
      }
    }
  }

  login(): void {
    if (this.cargando) return;

    const email = this.email.trim();
    const password = this.password;

    if (!email || !password) {
      this.errorMessage = 'Ingresa correo y contraseña';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        finalize(() => {
          // 🔥 SE EJECUTA SIEMPRE (éxito o error)
          this.cargando = false;
        })
      )
      .subscribe({
        next: (res) => {
          const token = res?.access_token;
          if (!token) {
            this.errorMessage = 'El servidor no devolvió access_token';
            return;
          }

          this.auth.setToken(token);
          this.router.navigate(['/correo-privado']);
        },
        error: (err) => {
          // Todos vienen como 401, así que leemos el message del backend
          if (err?.status === 401) {
            const msg = err?.error?.message;

            if (typeof msg === 'string') {
              this.errorMessage = msg;
            } else if (Array.isArray(msg)) {
              this.errorMessage = msg.join(', ');
            } else {
              this.errorMessage = 'Credenciales incorrectas';
            }

            return;
          }

          if (err?.status === 0) {
            this.errorMessage =
              'No se pudo conectar al servidor (URL/CORS/backend apagado)';
            return;
          }

          this.errorMessage =
            err?.error?.message ||
            `Error ${err?.status || ''} al iniciar sesión`;
        },
      });
  }
}
