import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './guards/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
})
export class AppComponent {
  auth = inject(AuthService);

  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  logout() {
    this.auth.logout();
    location.href = '/login';
  }
}
