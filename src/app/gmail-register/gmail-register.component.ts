import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../guards/auth.service';
import { GmailService, GmailAccount } from '../services/gmail.service';

@Component({
  selector: 'app-gmail-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gmail-register.component.html',
})
export class GmailRegisterComponent implements OnInit {
  email = '';
  loading = false;
  connecting = false;
  rowLoading = new Set<number>();
  accounts: GmailAccount[] = [];
  errorMessage = '';
  successMessage = '';
  showDeleteModal = false;
  pendingDelete: GmailAccount | null = null;
  deleting = false;
  q = '';

  constructor(
    private gmailService: GmailService,
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const connected = this.route.snapshot.queryParamMap.get('connected');
    if (connected === '1') {
      this.successMessage = '✅ Cuenta autorizada correctamente';
      this.router.navigate([], {
        queryParams: { connected: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    this.fetchAccounts();
  }

  fetchAccounts(): void {
    this.loading = true;
    this.gmailService
      .getAccounts()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => (this.accounts = res),
        error: (err) => this.handleErr(err, 'al cargar cuentas Gmail'),
      });
  }

  connect(): void {
    if (this.connecting) return;
    const email = this.email.trim().toLowerCase();
    this.errorMessage = '';
    this.successMessage = '';

    if (!email) {
      this.errorMessage = 'Ingresa un correo Gmail.';
      return;
    }
    if (!/@gmail\.com$/i.test(email)) {
      this.errorMessage = 'Solo @gmail.com';
      return;
    }

    this.connecting = true;

    this.gmailService
      .getLoginUrl(email)
      .pipe(finalize(() => (this.connecting = false)))
      .subscribe({
        next: (res) => this.gmailService.redirect(res.url),
        error: (err) => {
          if (err?.status === 400) {
            this.renewByEmail(email);
            return;
          }
          this.handleErr(err, 'al iniciar autorización');
        },
      });
  }

  renewRow(a: GmailAccount): void {
    if (this.rowLoading.has(a.id)) return;
    this.rowLoading.add(a.id);
    this.gmailService
      .getRenewUrl(a.email)
      .pipe(finalize(() => this.rowLoading.delete(a.id)))
      .subscribe({
        next: (res) => this.gmailService.redirect(res.url),
        error: (err) => this.handleErr(err, 'al renovar autorización'),
      });
  }

  askDelete(a: GmailAccount): void {
    this.pendingDelete = a;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.showDeleteModal = false;
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    if (!this.pendingDelete || this.deleting) return;
    const a = this.pendingDelete;
    this.deleting = true;
    this.rowLoading.add(a.id);

    this.gmailService
      .deleteAccount(a.email)
      .pipe(
        finalize(() => {
          this.deleting = false;
          this.rowLoading.delete(a.id);
          this.showDeleteModal = false;
          this.pendingDelete = null;
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = `Cuenta eliminada: ${a.email}`;
          this.accounts = this.accounts.filter((x) => x.id !== a.id);
        },
        error: (err) => this.handleErr(err, 'al eliminar la cuenta'),
      });
  }

  get filteredAccounts(): GmailAccount[] {
    const q = this.q.trim().toLowerCase();
    return q
      ? this.accounts.filter((a) => a.email.toLowerCase().includes(q))
      : this.accounts;
  }

  private renewByEmail(email: string): void {
    this.successMessage = 'Cuenta ya registrada. Redirigiendo para renovar...';
    this.gmailService.getRenewUrl(email).subscribe({
      next: (res) => this.gmailService.redirect(res.url),
      error: (err) => {
        this.successMessage = '';
        this.handleErr(err, 'al renovar autorización');
      },
    });
  }

  private handleErr(err: any, ctx: string): void {
    if (err?.status === 401) {
      this.errorMessage = 'Sesión no válida.';
      this.auth.forceSessionExpired();
      return;
    }
    const msg =
      (typeof err?.error === 'string' ? err.error : err?.error?.message) ??
      err?.message ??
      null;
    this.errorMessage = msg
      ? String(msg)
      : `Error ${err?.status || ''} ${ctx}.`;
  }
}
