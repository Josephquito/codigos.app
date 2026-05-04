import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../guards/auth.service';
import { ImapService, ImapAccount } from '../services/imap.service';

type EditForm = {
  id: number | null;
  email: string;
  password: string;
  imapHost: string;
  imapPort: number | null;
  useTls: boolean;
  isCatchAll: boolean;
  active: boolean;
};

@Component({
  selector: 'app-imap-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imap-register.component.html',
})
export class ImapRegisterComponent implements OnInit {
  email = '';
  password = '';
  imapHost = '';
  imapPort: number | null = 993;
  useTls = true;
  isCatchAll = false;
  creating = false;

  accounts: ImapAccount[] = [];
  loading = false;
  rowLoading = new Set<number>();
  errorMessage = '';
  successMessage = '';
  q = '';

  showDeleteModal = false;
  pendingDelete: ImapAccount | null = null;
  deleting = false;

  showEditModal = false;
  editing = false;
  editForm: EditForm = this.emptyEditForm();

  constructor(
    private imapService: ImapService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.fetchAccounts();
  }

  fetchAccounts(): void {
    this.loading = true;
    this.imapService
      .getAccounts()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => (this.accounts = res),
        error: (err) => this.handleErr(err, 'al cargar cuentas IMAP'),
      });
  }

  createAccount(): void {
    if (this.creating) return;
    const email = this.email.trim().toLowerCase();
    const password = this.password.trim();
    const imapHost = this.imapHost.trim();

    if (!email || !password || !imapHost) {
      this.errorMessage = 'Completa email, contraseña e IMAP host.';
      return;
    }

    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    const dto: any = {
      email,
      password,
      imapHost,
      useTls: this.useTls,
      isCatchAll: this.isCatchAll,
    };
    if (this.imapPort) dto.imapPort = Number(this.imapPort);

    this.imapService
      .createAccount(dto)
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: () => {
          this.successMessage = `Cuenta agregada: ${email}`;
          this.password = '';
          this.fetchAccounts();
        },
        error: (err) => this.handleErr(err, 'al registrar cuenta IMAP'),
      });
  }

  toggleActive(a: ImapAccount): void {
    if (this.rowLoading.has(a.id)) return;
    const prev = a.active;
    a.active = !a.active;
    this.rowLoading.add(a.id);

    this.imapService
      .setActive(a.id, a.active)
      .pipe(finalize(() => this.rowLoading.delete(a.id)))
      .subscribe({
        next: () => {
          this.successMessage = a.active
            ? `Activada: ${a.email}`
            : `Desactivada: ${a.email}`;
          this.fetchAccounts();
        },
        error: (err) => {
          a.active = prev;
          this.handleErr(err, 'al actualizar estado');
        },
      });
  }

  toggleCatchAll(a: ImapAccount): void {
    if (this.rowLoading.has(a.id)) return;
    const prev = a.isCatchAll;
    a.isCatchAll = !a.isCatchAll;
    this.rowLoading.add(a.id);

    this.imapService
      .setCatchAll(a.id, a.isCatchAll)
      .pipe(finalize(() => this.rowLoading.delete(a.id)))
      .subscribe({
        next: () => {
          this.successMessage = a.isCatchAll
            ? `Catch-all activado: ${a.email}`
            : `Catch-all desactivado: ${a.email}`;
          this.fetchAccounts();
        },
        error: (err) => {
          a.isCatchAll = prev;
          this.handleErr(err, 'al actualizar catch-all');
        },
      });
  }

  openEdit(a: ImapAccount): void {
    this.editForm = {
      id: a.id,
      email: a.email,
      password: '',
      imapHost: a.imapHost,
      imapPort: a.imapPort ?? 993,
      useTls: !!a.useTls,
      isCatchAll: !!a.isCatchAll,
      active: !!a.active,
    };
    this.showEditModal = true;
  }

  closeEdit(): void {
    if (this.editing) return;
    this.showEditModal = false;
    this.editForm = this.emptyEditForm();
  }

  saveEdit(): void {
    if (this.editing || !this.editForm.id) return;
    const id = this.editForm.id;
    const email = this.editForm.email.trim().toLowerCase();
    const host = this.editForm.imapHost.trim();
    const port = Number(this.editForm.imapPort ?? 993);

    if (!email) {
      this.errorMessage = 'Email inválido.';
      return;
    }
    if (!host) {
      this.errorMessage = 'Host IMAP inválido.';
      return;
    }
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      this.errorMessage = 'Puerto inválido.';
      return;
    }

    const payload: any = {
      email,
      imapHost: host,
      imapPort: port,
      useTls: !!this.editForm.useTls,
      isCatchAll: !!this.editForm.isCatchAll,
      active: !!this.editForm.active,
    };
    const pass = this.editForm.password.trim();
    if (pass) payload.password = pass;

    this.editing = true;
    this.rowLoading.add(id);

    this.imapService
      .updateAccount(id, payload)
      .pipe(
        finalize(() => {
          this.editing = false;
          this.rowLoading.delete(id);
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Cuenta actualizada.';
          this.showEditModal = false;
          this.editForm = this.emptyEditForm();
          this.fetchAccounts();
        },
        error: (err) => this.handleErr(err, 'al actualizar cuenta'),
      });
  }

  askDelete(a: ImapAccount): void {
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

    this.imapService
      .deleteAccount(a.id)
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
        error: (err) => this.handleErr(err, 'al eliminar cuenta'),
      });
  }

  get filteredAccounts(): ImapAccount[] {
    const q = this.q.trim().toLowerCase();
    if (!q) return this.accounts;
    return this.accounts.filter(
      (a) =>
        a.email.toLowerCase().includes(q) ||
        a.imapHost.toLowerCase().includes(q) ||
        String(a.id).includes(q),
    );
  }

  private emptyEditForm(): EditForm {
    return {
      id: null,
      email: '',
      password: '',
      imapHost: '',
      imapPort: 993,
      useTls: true,
      isCatchAll: false,
      active: true,
    };
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
