import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CompaniesService,
  CompanyDTO,
  CompanyMemberDTO,
} from '../../../services/companies.service';

@Component({
  selector: 'app-manage-company-users-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-company-users.modal.html',
})
export class ManageCompanyUsersModal {
  api = inject(CompaniesService);

  @Input() open = false;
  @Input() company: CompanyDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  loading = false;
  saving = false;
  errorMessage = '';

  members: CompanyMemberDTO[] = [];

  // input: "3, 5, 8"
  userIdsRaw = '';

  async ngOnChanges() {
    if (this.open && this.company) {
      await this.loadMembers();
    }
  }

  onClose() {
    this.errorMessage = '';
    this.userIdsRaw = '';
    this.members = [];
    this.close.emit();
  }

  private parseIds(raw: string): number[] {
    return raw
      .split(',')
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  }

  async loadMembers() {
    if (!this.company) return;

    this.loading = true;
    this.errorMessage = '';
    try {
      this.members = await this.api.listMembers(this.company.id);
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudieron cargar miembros.';
    } finally {
      this.loading = false;
    }
  }

  async assign() {
    if (!this.company || this.saving) return;

    const ids = this.parseIds(this.userIdsRaw);
    if (ids.length === 0) {
      this.errorMessage = 'Ingresa IDs válidos separados por coma. Ej: 3, 5, 8';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    try {
      await this.api.assignEmployees(this.company.id, ids);
      this.userIdsRaw = '';
      await this.loadMembers();
      this.updated.emit();
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo asignar empleados.';
    } finally {
      this.saving = false;
    }
  }

  async unassign(member: CompanyMemberDTO) {
    if (!this.company || this.saving) return;

    this.saving = true;
    this.errorMessage = '';
    try {
      await this.api.unassignEmployees(this.company.id, [member.user.id]);
      await this.loadMembers();
      this.updated.emit();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo desasignar el empleado.';
    } finally {
      this.saving = false;
    }
  }

  badgeStatusClass(s: string) {
    return {
      'badge-success': s === 'ACTIVE',
      'badge-warning': s === 'INACTIVE',
    };
  }
}
