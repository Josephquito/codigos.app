import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-email-public',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './email-public.component.html',
})
export class EmailPublicComponent {
  correo = '';
  plataforma = '';
  clave = '';

  emailHtml: SafeHtml = '';
  cargando = false;
  errorMessage = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  consultar(): void {
    this.errorMessage = '';

    const email = this.correo.trim();
    const platform = this.plataforma.trim().toLowerCase();
    const clave = this.clave.trim();

    if (!email || !platform || !clave) {
      this.errorMessage = 'Completa correo, clave pública y plataforma.';
      return;
    }

    this.cargando = true;
    this.emailHtml = this.sanitizer.bypassSecurityTrustHtml('');

    const url = `${environment.apiUrl}/correo/email/${encodeURIComponent(
      email
    )}/platform/${encodeURIComponent(platform)}?clave=${encodeURIComponent(
      clave
    )}`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        const content = this.normalizeToHtml(res);
        this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(content);
        this.cargando = false;
      },
      error: (err) => {
        const msg =
          (typeof err?.error === 'string' ? err.error : err?.error?.message) ||
          err?.message ||
          '❌ Error desconocido';

        this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(
          `<p>${msg}</p>`
        );
        this.cargando = false;
      },
    });
  }

  private normalizeToHtml(res: any): string {
    // Tu servicio antiguo ya contemplaba estos formatos
    if (Array.isArray(res)) return res.join('<hr>');
    if (typeof res === 'string') return res;
    if (res?.correos && Array.isArray(res.correos))
      return res.correos.join('<hr>');
    if (res?.html) return res.html;

    return '<p>No se pudo cargar el contenido.</p>';
  }
}
