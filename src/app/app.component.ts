import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
} from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  Router,
  RouterLinkActive,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './guards/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private router = inject(Router);
  auth = inject(AuthService);

  // mobile panel
  mobileOpen = false;

  // hide/show navbar
  navVisible = true;
  private lastScrollTop = 0;
  private readonly showThreshold = 10;
  private readonly hideAfter = 80;

  @ViewChild('mobileMenu') mobileMenu!: ElementRef<HTMLElement>;

  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.closeMobileMenu();
  }

  toggleMobileMenu(event: Event) {
    event.stopPropagation();
    this.mobileOpen = !this.mobileOpen;
    if (this.mobileOpen) this.navVisible = true;
  }

  closeMobileMenu() {
    this.mobileOpen = false;
  }

  // click fuera => cerrar panel
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.mobileOpen) return;

    const target = event.target as HTMLElement;
    const clickedInside = this.mobileMenu?.nativeElement.contains(target);
    const clickedHamburger = target.closest('.hamburger');

    if (!clickedInside && !clickedHamburger) this.closeMobileMenu();
  }

  // cerrar con ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.mobileOpen) this.closeMobileMenu();
  }

  // cerrar al navegar
  constructor() {
    this.router.events.subscribe(() => {
      if (this.mobileOpen) this.closeMobileMenu();
    });
  }

  // scroll => cerrar mobile + hide/show navbar
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const st =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    if (this.mobileOpen) {
      this.closeMobileMenu();
      this.navVisible = true;
      this.lastScrollTop = st;
      return;
    }

    if (st <= this.hideAfter) {
      this.navVisible = true;
      this.lastScrollTop = st;
      return;
    }

    const delta = st - this.lastScrollTop;
    if (Math.abs(delta) < this.showThreshold) return;

    this.navVisible = delta < 0;
    this.lastScrollTop = st <= 0 ? 0 : st;
  }
}
