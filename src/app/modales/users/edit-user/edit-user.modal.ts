import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, UserDTO } from '../../../services/users.service';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user.modal.html',
  styleUrls: ['./edit-user.modal.css'],
})
export class EditUserModal implements OnChanges {
  private api = inject(UsersService);

  @Input() open = false;
  @Input() user: UserDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  // campos del formulario (UI)
  nombre = '';
  phone = '';
  password = '';
  status: UserStatus = 'ACTIVE';

  // snapshot original para detectar cambios
  private originalNombre = '';
  private originalPhone = '';
  private originalStatus: UserStatus = 'ACTIVE';

  loading = false;
  error = '';

  ngOnChanges() {
    if (!this.user) return;

    this.nombre = this.user.nombre ?? '';
    this.phone = this.user.phone ?? '';
    this.status = (this.user.status as UserStatus) ?? 'ACTIVE';
    this.password = '';
    this.error = '';

    // ✅ guarda originales (para PATCH)
    this.originalNombre = this.nombre.trim();
    this.originalPhone = this.phone.trim();
    this.originalStatus = this.status;
  }

  onClose() {
    if (this.loading) return;
    this.close.emit();
  }

  async submit() {
    if (!this.user || this.loading) return;

    const nombre = this.nombre.trim();
    const phone = this.phone.trim();

    // Si tu negocio exige nombre/phone siempre (aunque PATCH), valida aquí.
    // Si NO es obligatorio siempre, quita este bloque.
    if (!nombre || !phone) {
      this.error = 'Nombre y teléfono son obligatorios';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      // ✅ PATCH: manda solo campos que cambiaron y que existen en UpdateUserDto
      const payload: any = {};

      if (nombre !== this.originalNombre) payload.nombre = nombre;
      if (phone !== this.originalPhone) payload.phone = phone;

      // ⚠️ clave: SOLO enviar status si cambió (si no, te bloquea al editarte)
      if (this.status !== this.originalStatus) payload.status = this.status;

      // password opcional
      if (this.password && this.password.length >= 6) {
        payload.password = this.password;
      }

      // si no hay cambios reales, no pegues al backend
      if (Object.keys(payload).length === 0) {
        this.updated.emit();
        return;
      }

      await this.api.update(this.user.id, payload);
      this.updated.emit();
    } catch (e: any) {
      const msg = e?.error?.message;
      this.error = Array.isArray(msg)
        ? msg.join(', ')
        : msg || 'Error actualizando usuario';
    } finally {
      this.loading = false;
    }
  }
}
