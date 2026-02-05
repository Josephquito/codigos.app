import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, UserDTO } from '../../services/users.service';
import { AuthService } from '../../services/auth.service';

import { CreateUserModal } from '../../modales/users/create-user/create-user.modal';
import { EditUserModal } from '../../modales/users/edit-user/edit-user.modal';
import { DeleteUserModal } from '../../modales/users/delete-user/delete-user.modal';
import { EditUserPermissionsModal } from '../../modales/users/edit-user-permissions/edit-user-permissions.modal';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    CreateUserModal,
    EditUserModal,
    DeleteUserModal,
    EditUserPermissionsModal,
  ],
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.css'],
})
export class UsersPage {
  api = inject(UsersService);
  auth = inject(AuthService);

  loading = false;
  loadingRowId: number | null = null;

  errorMessage = '';
  users: UserDTO[] = [];

  // Modales
  createOpen = false;
  editOpen = false;
  deleteOpen = false;

  selected: UserDTO | null = null;

  // ✅ menú contextual FIXED (no lo recorta ningún overflow)
  menuOpen = false;
  menuUser: UserDTO | null = null;
  menuX = 0;
  menuY = 0;

  get canCreate() {
    return this.auth.hasPermission('USERS:CREATE');
  }
  get canRead() {
    return this.auth.hasPermission('USERS:READ');
  }
  get canUpdate() {
    return this.auth.hasPermission('USERS:UPDATE');
  }
  get canDelete() {
    return this.auth.hasPermission('USERS:DELETE');
  }

  constructor() {
    this.refresh();
  }

  // ======================
  // Menu
  // ======================
  toggleMenu(u: UserDTO, ev: MouseEvent) {
    ev.stopPropagation();

    // si vuelves a tocar el mismo usuario, cierra
    if (this.menuOpen && this.menuUser?.id === u.id) {
      this.closeMenu();
      return;
    }

    const btn = ev.currentTarget as HTMLElement | null;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      // aparece debajo del botón, alineado a la derecha
      this.menuX = rect.right;
      this.menuY = rect.bottom + 8;
    } else {
      // fallback
      this.menuX = ev.clientX;
      this.menuY = ev.clientY;
    }

    this.menuUser = u;
    this.menuOpen = true;
  }

  closeMenu() {
    this.menuOpen = false;
    this.menuUser = null;
  }

  @HostListener('document:click')
  onDocClick() {
    this.closeMenu();
  }

  @HostListener('window:scroll')
  onScroll() {
    // al hacer scroll, mejor cerrar para no quedar flotando raro
    this.closeMenu();
  }

  @HostListener('window:resize')
  onResize() {
    this.closeMenu();
  }

  // ======================
  // Data
  // ======================
  async refresh() {
    if (!this.canRead) {
      this.errorMessage = 'No tienes permiso USERS:READ';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    try {
      this.users = await this.api.findAll();
    } catch (e: any) {
      this.errorMessage = this.normalizeMsg(e);
    } finally {
      this.loading = false;
    }
  }

  // ======================
  // Create
  // ======================
  openCreate() {
    if (!this.canCreate) return;
    this.createOpen = true;
  }

  // ======================
  // Edit
  // ======================
  openEdit(u: UserDTO) {
    if (!this.canUpdate) return;
    this.selected = u;
    this.editOpen = true;
  }

  // ======================
  // Delete
  // ======================
  confirmDelete(u: UserDTO) {
    if (!this.canDelete) return;

    const myId = this.auth.me()?.id;
    if (myId && u.id === myId) {
      this.errorMessage = 'No puedes eliminar tu propio usuario.';
      return;
    }

    this.selected = u;
    this.deleteOpen = true;
  }

  closeAll() {
    this.createOpen = false;
    this.editOpen = false;
    this.deleteOpen = false;
    this.selected = null;
    this.closeMenu();
  }

  async onCreated() {
    this.closeAll();
    await this.refresh();
  }

  async onUpdated() {
    this.closeAll();
    await this.refresh();
  }

  async onDeleted() {
    this.closeAll();
    await this.refresh();
  }

  // ======================
  // Status toggle
  // ======================
  async toggleStatus(u: UserDTO) {
    if (!this.canUpdate) return;

    const myId = this.auth.me()?.id;
    if (myId && u.id === myId) {
      this.errorMessage = 'No puedes cambiar tu propio status.';
      return;
    }

    const nextStatus: UserStatus =
      u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    this.loadingRowId = u.id;
    this.errorMessage = '';
    try {
      await this.api.update(u.id, { status: nextStatus } as any);
      await this.refresh();
    } catch (e: any) {
      this.errorMessage = this.normalizeMsg(e);
    } finally {
      this.loadingRowId = null;
    }
  }

  private normalizeMsg(err: any): string {
    const msg = err?.error?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
    return 'Error';
  }

  permissionsOpen = false;

  openPermissions(u: UserDTO) {
    if (!this.canUpdate) return; // tu back pide USERS:UPDATE para set/add/remove
    this.selected = u;
    this.permissionsOpen = true;
  }

  closePermissions() {
    this.permissionsOpen = false;
    this.selected = null;
    this.closeMenu();
  }

  async onPermissionsUpdated() {
    this.closePermissions();
    await this.refresh();
  }
}
