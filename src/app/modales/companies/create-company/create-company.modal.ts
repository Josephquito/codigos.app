import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompaniesService } from '../../../services/companies.service';

@Component({
  selector: 'app-create-company-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-company.modal.html',
})
export class CreateCompanyModal {
  api = inject(CompaniesService);

  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  name = '';
  phone = '';

  onClose() {
    this.reset();
    this.close.emit();
  }

  reset() {
    this.loading = false;
    this.errorMessage = '';
    this.name = '';
    this.phone = '';
  }

  async submit() {
    this.errorMessage = '';
    if (this.loading) return;

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
      await this.api.create({
        name: this.name.trim(),
        phone: this.phone.trim(),
      });
      this.reset();
      this.created.emit();
    } catch (e: any) {
      this.errorMessage = e?.error?.message ?? 'No se pudo crear la company.';
    } finally {
      this.loading = false;
    }
  }
}
