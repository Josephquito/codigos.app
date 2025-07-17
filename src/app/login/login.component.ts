import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../guards/auth.service'; // ← IMPORTA el servicio

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  cargando = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService // ← INYECTA el servicio
  ) {}

  login() {
    this.cargando = true;
    this.errorMessage = '';

    this.http
      .post<any>('https://codigos-api.onrender.com/auth/login', {
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.auth.setToken(res.token, res.role); // ← Usa el servicio
          this.router.navigate(['/correo']); // ← O cualquier ruta protegida
        },
        error: () => {
          this.errorMessage = 'Credenciales incorrectas';
          this.cargando = false;
        },
        complete: () => {
          this.cargando = false;
        },
      });
  }
}
