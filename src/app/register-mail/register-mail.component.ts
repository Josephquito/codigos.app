import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registrar-gmail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="text-align: center; margin-top: 50px;">
      <h2>Registrar nueva cuenta de Gmail</h2>
      <input
        [(ngModel)]="email"
        placeholder="ejemplo@gmail.com"
        style="padding: 8px; width: 300px;"
      />
      <button
        (click)="registrar()"
        style="margin-left: 10px; padding: 8px 16px;"
      >
        Registrar Gmail
      </button>
    </div>
  `,
})
export class RegistrarGmailComponent {
  email = '';

  registrar() {
    if (!this.email.includes('@')) {
      alert('Correo inválido');
      return;
    }
    window.location.href = `https://codigos-api.onrender.com/gmail/login/${this.email}`;
  }
}
