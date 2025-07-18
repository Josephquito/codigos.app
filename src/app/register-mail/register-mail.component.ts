import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-registrar-gmail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './register-mail.component.html',
})
export class RegistrarGmailComponent {
  email = '';
  mensaje = '';
  cargando = false;

  constructor(private http: HttpClient) {}

  registrarGmail() {
    if (!this.email.includes('@')) {
      this.mensaje = '❌ Correo inválido';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    const url = `https://codigos-api.onrender.com/gmail/login/${this.email}`;

    // Intentamos llamar al endpoint sin redirigir
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: () => {
        // Si no hay error, redirige como siempre
        window.location.href = url;
      },
      error: (error) => {
        const mensaje = error.error || '❌ Error inesperado';
        this.mensaje = mensaje;
        this.cargando = false;
      },
    });
  }
  renovarToken() {
    if (!this.email.includes('@')) {
      this.mensaje = '❌ Correo inválido';
      return;
    }

    const renewUrl = `https://codigos-api.onrender.com/gmail/renew/${this.email}`;
    window.location.href = renewUrl;
  }
}
