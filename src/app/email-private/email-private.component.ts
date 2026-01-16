import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
} from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../environments/environment';
import { AuthService } from '../guards/auth.service';

@Component({
  selector: 'app-email-private',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './email-private.component.html',
})
export class EmailPrivateComponent {
  correo = '';
  plataforma = '';

  emailHtml: SafeHtml = '';
  cargando = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private auth: AuthService
  ) {}

  consultar(): void {
    this.errorMessage = '';

    const email = this.correo.trim();
    const platform = this.plataforma.trim().toLowerCase();

    if (!email || !platform) {
      this.errorMessage = 'Completa correo y plataforma.';
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      this.errorMessage = 'Sesión no válida. Vuelve a iniciar sesión.';
      this.auth.forceSessionExpired();
      return;
    }

    this.cargando = true;
    this.emailHtml = this.sanitizer.bypassSecurityTrustHtml('');

    // 1) gmail -> /gmail/alias/:email/platform/:platform
    if (/@gmail\.com$/i.test(email)) {
      const url = `${environment.apiUrl}/gmail/alias/${encodeURIComponent(
        email
      )}/platform/${encodeURIComponent(platform)}`;

      this.http.get<any>(url, { headers: this.authHeaders() }).subscribe({
        next: (res) => {
          const content = this.normalizeToHtml(res);
          this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(content);
          this.cargando = false;
        },
        error: (err) => this.handleErr(err),
      });

      return;
    }

    // 2) no gmail -> intentar IMAP catchall primero
    const urlCatchall = `${
      environment.apiUrl
    }/imap/catchall/${encodeURIComponent(email)}/${encodeURIComponent(
      platform
    )}`;

    this.http.get<any>(urlCatchall, { headers: this.authHeaders() }).subscribe({
      next: (res) => {
        const content = this.normalizeToHtml(res);
        this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(content);
        this.cargando = false;
      },
      error: (errCatchall) => {
        // Fallback: intentar IMAP account
        const urlAccount = `${
          environment.apiUrl
        }/imap/account/${encodeURIComponent(email)}/${encodeURIComponent(
          platform
        )}`;

        this.http
          .get<any>(urlAccount, { headers: this.authHeaders() })
          .subscribe({
            next: (res2) => {
              const content = this.normalizeToHtml(res2);
              this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(content);
              this.cargando = false;
            },
            error: (errAccount) => {
              // mostrar el error más útil
              this.handleErr(errAccount?.status ? errAccount : errCatchall);
            },
          });
      },
    });
  }

  private authHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });
  }

  private handleErr(err: any): void {
    if (err?.status === 401) {
      this.errorMessage = 'Sesión no válida. Vuelve a iniciar sesión.';
      this.auth.forceSessionExpired();
      this.cargando = false;
      return;
    }

    const msg =
      (typeof err?.error === 'string' ? err.error : err?.error?.message) ||
      err?.message ||
      '❌ Error desconocido';

    this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(`<p>${msg}</p>`);
    this.cargando = false;
  }

  private normalizeToHtml(res: any): string {
    // Gmail controller devuelve { correos: [...] }
    if (res?.correos && Array.isArray(res.correos)) {
      return res.correos.join('<hr>');
    }

    // IMAP probablemente devuelve string[] o similar
    if (Array.isArray(res)) return res.join('<hr>');
    if (typeof res === 'string') return res;
    if (res?.html) return res.html;

    return '<p>No se pudo cargar el contenido.</p>';
  }
}
