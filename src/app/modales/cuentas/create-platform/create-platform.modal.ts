import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { StreamingPlatformsService } from '../../../services/streaming-platforms.service';

@Component({
  selector: 'app-create-platform-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-platform.modal.html',
})
export class CreatePlatformModal {
  api = inject(StreamingPlatformsService);

  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  name = '';
  active = true;

  reset() {
    this.errorMessage = '';
    this.name = '';
    this.active = true;
  }

  onClose() {
    this.reset();
    this.close.emit();
  }

  async submit() {
    this.errorMessage = '';
    if (!this.name.trim()) {
      this.errorMessage = 'Nombre requerido.';
      return;
    }

    this.loading = true;
    try {
      await this.api.create({ name: this.name.trim(), active: this.active });
      this.created.emit();
      this.onClose();
    } catch (e: any) {
      this.errorMessage =
        e?.error?.message ?? 'No se pudo crear la plataforma.';
    } finally {
      this.loading = false;
    }
  }
}
