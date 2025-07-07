import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-imap-register',
  standalone: true,
  templateUrl: './imap-register.component.html',
  styleUrls: ['./imap-register.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule],
})
export class ImapRegisterComponent {
  email: string = '';
  password: string = '';
  mensaje: string = '';

  constructor(private http: HttpClient) {}

  registrarCuenta() {
    const payload = {
      email: this.email.trim(),
      password: this.password.trim(),
    };

    this.http
      .post('https://codigos-api.onrender.com/imap-accounts', payload, {
        responseType: 'text',
      })
      .subscribe({
        next: (res) => {
          this.mensaje = res;
        },
        error: (err) => {
          this.mensaje =
            err.error?.message || err.error || '❌ Error al registrar cuenta';
        },
      });
  }
}
