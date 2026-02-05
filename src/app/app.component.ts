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
import { AuthService } from './services/auth.service';
import { CompanyContextService } from './services/company-context.service';

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
  companyCtx = inject(CompanyContextService);

  // mobile panel
  mobileOpen = false;

  // submenu desktop
  userMenuOpen = false;

  // hide/show navbar
  navVisible = true;
  private lastScrollTop = 0;
  private readonly showThreshold = 10;
  private readonly hideAfter = 80;

  @ViewChild('mobileMenu') mobileMenu?: ElementRef<HTMLElement>;

  // ✅ sesión válida = token no expirado
  get isLoggedIn(): boolean {
    return this.auth.isAuthenticated();
  }

  // ✅ nombre si hay, si no email, si no marca
  get displayName(): string {
    if (!this.isLoggedIn) return 'JOTAVIX';
    const me = this.auth.me();
    return me?.nombre || me?.email || 'JOTAVIX';
  }

  // ✅ company activa
  get hasCompany(): boolean {
    return this.companyCtx.hasCompany();
  }

  get activeCompanyName(): string {
    return this.companyCtx.companyName() || '';
  }

  // --- acciones ---
  changeCompany() {
    this.companyCtx.setActiveCompany(null);
    this.router.navigate(['/companies']);
    this.closeMobileMenu();
  }

  logout() {
    this.companyCtx.setActiveCompany(null);
    this.auth.logout();
    this.router.navigate(['/login']);
    this.closeMobileMenu();
  }

  // --- mobile ---
  toggleMobileMenu(event: Event) {
    event.stopPropagation();
    this.mobileOpen = !this.mobileOpen;
    if (this.mobileOpen) this.navVisible = true;

    // si abres mobile, cierra el submenu desktop
    if (this.mobileOpen) this.closeUserMenu();
  }

  closeMobileMenu() {
    this.mobileOpen = false;
  }

  // --- submenu desktop ---
  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;

    // si abres submenu, cierra mobile
    if (this.userMenuOpen) this.closeMobileMenu();
  }

  closeUserMenu() {
    this.userMenuOpen = false;
  }

  changeCompanyFromMenu() {
    this.closeUserMenu();
    this.changeCompany();
  }

  logoutFromMenu() {
    this.closeUserMenu();
    this.logout();
  }

  // click fuera => cerrar submenu + panel
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    // cerrar dropdown desktop
    if (this.userMenuOpen) this.closeUserMenu();

    // cerrar panel mobile
    if (!this.mobileOpen) return;

    const target = event.target as HTMLElement;
    const clickedInside =
      this.mobileMenu?.nativeElement.contains(target) ?? false;
    const clickedHamburger = target.closest('.hamburger');

    if (!clickedInside && !clickedHamburger) this.closeMobileMenu();
  }

  // cerrar con ESC
  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.userMenuOpen) this.closeUserMenu();
    if (this.mobileOpen) this.closeMobileMenu();
  }

  // cerrar al navegar
  constructor() {
    this.router.events.subscribe(() => {
      if (this.mobileOpen) this.closeMobileMenu();
      if (this.userMenuOpen) this.closeUserMenu();
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
