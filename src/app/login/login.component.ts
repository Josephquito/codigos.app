import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { finalize, switchMap, throwError } from 'rxjs';

import { AuthService, Me } from '../services/auth.service';
import { environment } from '../../environments/environment';

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
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // ✅ si ya está logueado, no debe quedarse en /login
    if (this.auth.isLoggedIn()) {
      sessionStorage.removeItem('sessionExpired');
      const returnUrl =
        this.route.snapshot.queryParamMap.get('returnUrl') ?? '/correo-privado';
      this.router.navigateByUrl(returnUrl);
      return;
    }

    const flag = sessionStorage.getItem('sessionExpired');
    if (flag === '1') {
      sessionStorage.removeItem('sessionExpired');
      this.expired = true;
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
    this.expired = false;

    this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        switchMap((res) => {
          const token = res?.access_token;
          if (!token) {
            return throwError(() => ({
              status: 500,
              error: { message: 'El servidor no devolvió access_token' },
            }));
          }

          this.auth.setToken(token);

          // ✅ como todavía no hay interceptor, mandamos el Bearer aquí
          const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
          });

          // ✅ tu endpoint real para "me" es /users/me
          return this.http.get<Me>(`${environment.apiUrl}/users/me`, {
            headers,
          });
        }),
        finalize(() => (this.cargando = false)),
      )
      .subscribe({
        next: (me) => {
          this.auth.setMe(me);

          // ✅ salir de /login inmediatamente (guard no corre aquí)
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';

          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          // si falló la segunda llamada, limpiamos token (estado inconsistente)
          if (err?.url?.includes('/users/me')) {
            this.auth.logout();
          }

          if (err?.status === 401) {
            this.errorMessage =
              this.normalizeBackendMessage(err?.error?.message) ||
              'Credenciales incorrectas';
            return;
          }

          if (err?.status === 400) {
            this.errorMessage =
              this.normalizeBackendMessage(err?.error?.message) ||
              'Datos inválidos';
            return;
          }

          if (err?.status === 0) {
            this.errorMessage =
              'No se pudo conectar al servidor (URL/CORS/backend apagado)';
            return;
          }

          this.errorMessage =
            this.normalizeBackendMessage(err?.error?.message) ||
            `Error ${err?.status || ''} al iniciar sesión`;
        },
      });
  }

  private normalizeBackendMessage(msg: any): string {
    if (!msg) return '';
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'object') {
      if (typeof msg.message === 'string') return msg.message;
      return JSON.stringify(msg);
    }
    return String(msg);
  }
}
