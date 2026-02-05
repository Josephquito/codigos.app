import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CompanyDTO,
  CompaniesService,
  CompanyStatus,
} from '../../../services/companies.service';

@Component({
  selector: 'app-edit-company-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-company.modal.html',
})
export class EditCompanyModal {
  api = inject(CompaniesService);

  @Input() open = false;
  @Input() company: CompanyDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  name = '';
  phone = '';
  status: CompanyStatus = 'ACTIVE';

  ngOnChanges() {
    if (this.open && this.company) {
      this.name = this.company.name ?? '';
      this.phone = this.company.phone ?? '';
      this.status = (this.company.status ?? 'ACTIVE') as CompanyStatus;
      this.loading = false;
      this.errorMessage = '';
    }
  }

  onClose() {
    this.close.emit();
  }

  async submit() {
    if (!this.company || this.loading) return;

    this.errorMessage = '';

    if (this.name.trim().length < 2) {
      this.errorMessage = 'El nombre debe tener al menos 2 caracteres.';
      return;
    }
    if (this.phone.trim().length < 5) {
      this.errorMessage = 'El teléfono debe tener al menos 5 caracteres.';
      return;
    }

    this.loading = true;
    try {
      await this.api.update(this.company.id, {
        name: this.name.trim(),
        phone: this.phone.trim(),
        status: this.status,
      });
      this.updated.emit();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo actualizar la company.';
    } finally {
      this.loading = false;
    }
  }
}
