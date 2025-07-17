import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';

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
  cargando = false; // ← Nueva propiedad

  constructor(private http: HttpClient, private router: Router) {}

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
          localStorage.setItem('token', res.token);
          localStorage.setItem('role', res.role);
          this.router.navigate(['/']);
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
