import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../guards/auth.service';
import { CorreoService, BuzonEmail } from '../services/correo.service';
import { GmailService } from '../services/gmail.service';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-email-private',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './email-private.component.html',
})
export class EmailPrivateComponent {
  correo = '';
  plataforma = '';

  emailHtml: SafeHtml = '';
  buzonEmails: BuzonEmail[] = [];
  selectedEmail: BuzonEmail | null = null;

  cargando = false;
  errorMessage = '';

  get isBuzonMode(): boolean {
    return this.plataforma === 'buzon';
  }

  constructor(
    public correoService: CorreoService,
    private gmailService: GmailService,
    private auth: AuthService,
    private sanitizer: DomSanitizer,
  ) {}

  sanitize(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  consultar(): void {
    this.errorMessage = '';
    this.buzonEmails = [];
    this.selectedEmail = null;
    this.emailHtml = this.sanitize('');

    const email = this.correo.trim();
    const platform = this.plataforma.trim().toLowerCase();

    if (!email || !platform) {
      this.errorMessage = 'Completa correo y plataforma.';
      return;
    }

    if (!this.auth.getToken()) {
      this.errorMessage = 'Sesión no válida. Vuelve a iniciar sesión.';
      this.auth.forceSessionExpired();
      return;
    }

    this.cargando = true;

    if (this.isBuzonMode) {
      this.correoService.getBuzonGeneral(email).subscribe({
        next: (res) => {
          this.buzonEmails = res;
          if (res.length > 0) this.selectedEmail = res[0];
          this.cargando = false;
        },
        error: (err) => this.handleErr(err),
      });
    } else {
      const isGmail = /@gmail\.com$/i.test(email);

      if (isGmail) {
        this.gmailService.getEmailsByPlatform(email, platform).subscribe({
          next: (res) => {
            this.emailHtml = this.sanitize(
              this.correoService.normalizeToHtml(res),
            );
            this.cargando = false;
          },
          error: (err) => this.handleErr(err),
        });
      } else {
        this.correoService
          .getCorreoPrivadoPorPlataforma(email, platform)
          .subscribe({
            next: (res) => {
              this.emailHtml = this.sanitize(
                this.correoService.normalizeToHtml(res),
              );
              this.cargando = false;
            },
            error: (err) => this.handleErr(err),
          });
      }
    }
  }

  selectEmail(email: BuzonEmail): void {
    this.selectedEmail = email;
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-EC', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private handleErr(err: any): void {
    const msg =
      (typeof err?.error === 'string' ? err.error : err?.error?.message) ||
      err?.message ||
      '❌ Error desconocido';
    this.errorMessage = msg;
    this.cargando = false;
  }
}
