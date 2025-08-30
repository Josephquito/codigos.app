import { Component, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../guards/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  errorMessage = '';
  cargando = false;
  expired = false;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ proteger uso de sessionStorage para que solo corra en browser
    if (isPlatformBrowser(this.platformId)) {
      const flag = sessionStorage.getItem('sessionExpired');
      if (flag === '1') {
        sessionStorage.removeItem('sessionExpired');
        this.expired = true;
      }
    }
  }

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
          this.auth.setToken(res.token, res.role);
          this.router.navigate(['/correo']);
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
