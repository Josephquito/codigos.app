import { Component, HostListener, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './guards/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private router = inject(Router);
  auth = inject(AuthService);

  // estado del menú móvil
  isMenuOpen = false;

  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // toggle del menú (evita que el click burbujee y cierre)
  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen = !this.isMenuOpen;
  }

  // cierra si se hace click fuera
  @HostListener('document:click')
  closeOnOutsideClick() {
    if (this.isMenuOpen) this.isMenuOpen = false;
  }

  // cierra con Escape (accesibilidad)
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isMenuOpen) this.isMenuOpen = false;
  }

  constructor() {
    // cierra al navegar a otra ruta (evita que quede abierto)
    this.router.events.subscribe(() => {
      if (this.isMenuOpen) this.isMenuOpen = false;
    });
  }
}
