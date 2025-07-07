import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-email-viewer',
  templateUrl: './mail-viewer.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  styleUrls: ['./mail-viewer.component.css'], // Opcional si usas estilos
})
export class EmailViewerComponent {
  correo: string = '';
  plataforma: string = '';
  clave: string = '';
  emailHtml!: SafeHtml;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  cargarCorreo() {
    this.correo = this.correo.trim();
    this.plataforma = this.plataforma.trim().toLowerCase();

    if (!this.correo) return;

    const isGmail = this.correo.toLowerCase().endsWith('@gmail.com');
    const base = 'https://codigos-api.onrender.com';

    let url = '';

    if (this.plataforma) {
      url = `${base}/correo/email/${this.correo}/platform/${
        this.plataforma
      }?clave=${encodeURIComponent(this.clave)}`;
    } else {
      url = `${base}/correo/last/${this.correo}`;
    }

    this.http.get<any>(url).subscribe({
      next: (res) => {
        let content = '';

        if (Array.isArray(res)) {
          content = res.join('<hr>');
        } else if (typeof res === 'string') {
          content = res;
        } else if (res?.correos && Array.isArray(res.correos)) {
          content = res.correos.join('<hr>');
        } else if (res?.html) {
          content = res.html;
        } else {
          content = '<p>No se pudo cargar el contenido.</p>';
        }

        this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(content);
      },
      error: (err) => {
        const mensaje =
          err.error?.correos?.[0] ||
          err.error?.message ||
          err.message ||
          '❌ Error desconocido';

        this.emailHtml = this.sanitizer.bypassSecurityTrustHtml(
          `<p>${mensaje}</p>`
        );
      },
    });
  }
}
