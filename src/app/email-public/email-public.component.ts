import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { CorreoService } from '../services/correo.service';

@Component({
  selector: 'app-email-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-public.component.html',
})
export class EmailPublicComponent {
  correo = '';
  plataforma = '';
  clave = '';

  emailHtml: SafeHtml = '';
  cargando = false;
  errorMessage = '';

  constructor(
    private correoService: CorreoService,
    private sanitizer: DomSanitizer,
  ) {}

  private sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

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
    this.emailHtml = this.sanitize('');

    this.correoService
      .getCorreoPorPlataforma(email, platform, clave)
      .subscribe({
        next: (res) => {
          this.emailHtml = this.sanitize(
            this.correoService.normalizeToHtml(res),
          );
          this.cargando = false;
        },
        error: (err) => {
          const msg =
            (typeof err?.error === 'string'
              ? err.error
              : err?.error?.message) ||
            err?.message ||
            '❌ Error desconocido';
          this.emailHtml = this.sanitize(`<p>${msg}</p>`);
          this.cargando = false;
        },
      });
  }
}
