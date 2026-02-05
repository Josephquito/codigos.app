import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, AppRole } from '../../../services/users.service';

@Component({
  selector: 'app-create-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.modal.html',
  styleUrls: ['./create-user.modal.css'],
})
export class CreateUserModal {
  private api = inject(UsersService);

  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  email = '';
  password = '';
  nombre = '';
  phone = '';
  baseRole: AppRole = 'EMPLOYEE';

  loading = false;
  error = '';

  onClose() {
    if (this.loading) return;
    this.reset();
    this.close.emit();
  }

  async submit() {
    if (this.loading) return;

    const email = this.email.trim();
    const nombre = this.nombre.trim();
    const phone = this.phone.trim();

    if (!email || !this.password || !nombre || !phone) {
      this.error = 'Email, password, nombre y phone son obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';
    try {
      await this.api.create({
        email,
        password: this.password,
        nombre,
        phone,
        baseRole: this.baseRole, // ✅ lo que el back espera
      });

      this.reset();
      this.created.emit();
    } catch (e: any) {
      const msg = e?.error?.message;
      this.error = Array.isArray(msg)
        ? msg.join(', ')
        : msg || 'Error creando usuario';
    } finally {
      this.loading = false;
    }
  }

  private reset() {
    this.email = '';
    this.password = '';
    this.nombre = '';
    this.phone = '';
    this.baseRole = 'EMPLOYEE';
    this.error = '';
  }
}
