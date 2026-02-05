import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';
import {
  SuppliersService,
  SupplierDTO,
} from '../../services/suppliers.service';

import { CreateSupplierModal } from '../../modales/suppliers/create-supplier/create-supplier.modal';
import { EditSupplierModal } from '../../modales/suppliers/edit-supplier/edit-supplier.modal';
import { DeleteSupplierModal } from '../../modales/suppliers/delete-supplier/delete-supplier.modal';

@Component({
  selector: 'app-suppliers-page',
  standalone: true,
  imports: [
    CommonModule,
    CreateSupplierModal,
    EditSupplierModal,
    DeleteSupplierModal,
  ],
  templateUrl: './suppliers.page.html',
  styleUrls: ['./suppliers.page.css'],
})
export class SuppliersPage {
  api = inject(SuppliersService);
  auth = inject(AuthService);

  loading = false;
  loadingRowId: number | null = null;

  errorMessage = '';
  suppliers: SupplierDTO[] = [];

  // Modales
  createOpen = false;
  editOpen = false;
  deleteOpen = false;

  selected: SupplierDTO | null = null;

  // Menú flotante
  menuOpen = false;
  menuSupplier: SupplierDTO | null = null;
  menuX = 0;
  menuY = 0;

  // Permisos
  get canCreate() {
    return (
      this.auth.hasPermission?.('SUPPLIERS:CREATE') ??
      this.has('SUPPLIERS:CREATE')
    );
  }
  get canRead() {
    return (
      this.auth.hasPermission?.('SUPPLIERS:READ') ?? this.has('SUPPLIERS:READ')
    );
  }
  get canUpdate() {
    return (
      this.auth.hasPermission?.('SUPPLIERS:UPDATE') ??
      this.has('SUPPLIERS:UPDATE')
    );
  }
  get canDelete() {
    return (
      this.auth.hasPermission?.('SUPPLIERS:DELETE') ??
      this.has('SUPPLIERS:DELETE')
    );
  }

  private has(p: string) {
    const perms =
      (this.auth as any)?.currentUser?.permissions ??
      (this.auth as any)?.user?.permissions ??
      [];
    return Array.isArray(perms) && perms.includes(p);
  }

  ngOnInit() {
    this.load();
  }

  async load() {
    this.errorMessage = '';
    if (!this.canRead) {
      this.suppliers = [];
      this.errorMessage =
        'No tienes permiso para ver proveedores (SUPPLIERS:READ).';
      return;
    }

    this.loading = true;
    try {
      this.suppliers = await this.api.findAll();
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo cargar proveedores.';
    } finally {
      this.loading = false;
    }
  }

  // Header actions
  openCreate() {
    this.selected = null;
    this.createOpen = true;
    this.editOpen = false;
    this.deleteOpen = false;
  }

  // Menu
  toggleMenu(s: SupplierDTO, ev: MouseEvent) {
    ev.stopPropagation();

    if (this.menuOpen && this.menuSupplier?.id === s.id) {
      this.closeMenu();
      return;
    }

    this.menuOpen = true;
    this.menuSupplier = s;

    // posición del botón
    const target = ev.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    // menú a la derecha del botón (y lo "jalamos" con translateX(-100%))
    this.menuX = rect.right;
    this.menuY = rect.bottom + 6;
  }

  closeMenu() {
    this.menuOpen = false;
    this.menuSupplier = null;
  }

  @HostListener('document:click')
  onDocClick() {
    this.closeMenu();
  }

  @HostListener('window:scroll')
  onScroll() {
    // si scrollean, mejor cerrar para evitar menú “perdido”
    this.closeMenu();
  }

  // Row actions
  openEdit(s: SupplierDTO) {
    this.selected = s;
    this.editOpen = true;
    this.createOpen = false;
    this.deleteOpen = false;
  }

  confirmDelete(s: SupplierDTO) {
    this.selected = s;
    this.deleteOpen = true;
    this.createOpen = false;
    this.editOpen = false;
  }

  closeAll() {
    this.createOpen = false;
    this.editOpen = false;
    this.deleteOpen = false;
    this.selected = null;
  }

  // Events from modals
  onCreated() {
    this.closeAll();
    this.load();
  }

  onUpdated() {
    this.closeAll();
    this.load();
  }

  onDeleted() {
    this.closeAll();
    this.load();
  }
}
