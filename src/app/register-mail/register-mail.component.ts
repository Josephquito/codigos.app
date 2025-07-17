import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registrar-gmail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-mail.component.html',
})
export class RegistrarGmailComponent {
  email = '';
  mensaje = '';

  registrarGmail() {
    if (!this.email.includes('@')) {
      this.mensaje = '❌ Correo inválido';
      return;
    }

    // Limpia mensaje y redirige
    this.mensaje = '';
    window.location.href = `https://codigos-api.onrender.com/gmail/login/${this.email}`;
  }
}
