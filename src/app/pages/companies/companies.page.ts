import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { CompaniesService, CompanyDTO } from '../../services/companies.service';
import { CompanyContextService } from '../../services/company-context.service';

import { CreateCompanyModal } from '../../modales/companies/create-company/create-company.modal';
import { EditCompanyModal } from '../../modales/companies/edit-company/edit-company.modal';
import { DeleteCompanyModal } from '../../modales/companies/delete-company/delete-company.modal';
import { ManageCompanyUsersModal } from '../../modales/companies/manage-company-users/manage-company-users.modal';

@Component({
  selector: 'app-companies-page',
  standalone: true,
  imports: [
    CommonModule,
    CreateCompanyModal,
    EditCompanyModal,
    DeleteCompanyModal,
    ManageCompanyUsersModal,
  ],
  templateUrl: './companies.page.html',
  styleUrls: ['./companies.page.css'],
})
export class CompaniesPage {
  api = inject(CompaniesService);
  auth = inject(AuthService);
  companyCtx = inject(CompanyContextService);
  router = inject(Router);

  loading = false;
  loadingRowId: number | null = null;

  errorMessage = '';
  companies: CompanyDTO[] = [];

  // Modales
  createOpen = false;
  editOpen = false;
  deleteOpen = false;

  selected: CompanyDTO | null = null;

  // Menú flotante
  menuOpen = false;
  menuCompany: CompanyDTO | null = null;
  menuX = 0;
  menuY = 0;

  // permisos
  get canCreate() {
    return this.auth.hasPermission('COMPANIES:CREATE');
  }
  get canRead() {
    return this.auth.hasPermission('COMPANIES:READ');
  }
  get canUpdate() {
    return this.auth.hasPermission('COMPANIES:UPDATE');
  }
  get canDelete() {
    return this.auth.hasPermission('COMPANIES:DELETE');
  }

  // company activa
  get activeCompanyId() {
    return this.companyCtx.companyId();
  }

  ngOnInit() {
    this.load();
  }

  async load() {
    this.errorMessage = '';
    if (!this.canRead) {
      this.companies = [];
      this.errorMessage =
        'No tienes permiso para ver companies (COMPANIES:READ).';
      return;
    }

    this.loading = true;
    try {
      this.companies = await this.api.findAll();
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo cargar companies.';
    } finally {
      this.loading = false;
    }
  }

  // Header
  openCreate() {
    this.selected = null;
    this.createOpen = true;
    this.editOpen = false;
    this.deleteOpen = false;
  }

  // Menu
  toggleMenu(c: CompanyDTO, ev: MouseEvent) {
    ev.stopPropagation();

    if (this.menuOpen && this.menuCompany?.id === c.id) {
      this.closeMenu();
      return;
    }

    this.menuOpen = true;
    this.menuCompany = c;

    const target = ev.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    this.menuX = rect.right;
    this.menuY = rect.bottom + 6;
  }

  closeMenu() {
    this.menuOpen = false;
    this.menuCompany = null;
  }

  @HostListener('document:click')
  onDocClick() {
    this.closeMenu();
  }

  @HostListener('window:scroll')
  onScroll() {
    this.closeMenu();
  }

  // acciones
  openEdit(c: CompanyDTO) {
    this.selected = c;
    this.editOpen = true;
    this.createOpen = false;
    this.deleteOpen = false;
  }

  confirmDelete(c: CompanyDTO) {
    this.selected = c;
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

  // eventos modales
  onCreated() {
    this.closeAll();
    this.load();
  }

  onUpdated() {
    this.closeAll();
    this.load();
  }

  onDeleted() {
    // si borras la company activa, limpia el contexto
    if (this.selected?.id && this.selected.id === this.activeCompanyId) {
      this.companyCtx.setCompanyId(null);
    }
    this.closeAll();
    this.load();
  }

  selectCompany(c: CompanyDTO) {
    this.companyCtx.setActiveCompany({ id: c.id, name: c.name });
    this.router.navigateByUrl('/suppliers'); // o tu home de empresa
  }

  isActive(c: CompanyDTO) {
    return this.companyCtx.companyId() === c.id;
  }
  get canMembersRead() {
    return this.auth.hasPermission('COMPANIES-USERS:READ');
  }
  get canMembersUpdate() {
    return this.auth.hasPermission('COMPANIES-USERS:UPDATE');
  }

  membersOpen = false;

  openMembers(c: CompanyDTO) {
    this.selected = c;
    this.membersOpen = true;
    this.createOpen = false;
    this.editOpen = false;
    this.deleteOpen = false;
  }
  closeMembers() {
    this.membersOpen = false;
  }
  onMembersUpdated() {
    this.closeMembers();
  }
}
