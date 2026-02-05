import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  SimpleChanges,
} from '@angular/core';
import {
  PermissionsApi,
  PermissionDTO,
} from '../../../services/permissions.service';
import { AuthService } from '../../../services/auth.service';
import { UserDTO } from '../../../services/users.service';
import { FormsModule } from '@angular/forms';

type Grouped = { title: string; items: PermissionDTO[] };

@Component({
  selector: 'app-edit-user-permissions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-user-permissions.modal.html',
})
export class EditUserPermissionsModal {
  api = inject(PermissionsApi);
  auth = inject(AuthService);

  @Input() open = false;
  @Input() user: UserDTO | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  loading = false;
  saving = false;
  errorMessage = '';

  catalog: PermissionDTO[] = [];
  selectedIds = new Set<number>();

  search = '';

  get canUpdate() {
    return this.auth.hasPermission('USERS:UPDATE');
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] || changes['user']) {
      if (this.open && this.user) {
        await this.load();
      }
    }
  }

  private async load() {
    this.loading = true;
    this.errorMessage = '';
    this.selectedIds = new Set<number>();

    try {
      // En paralelo
      const [catalog, current] = await Promise.all([
        this.api.findAll(),
        this.api.listUserPermissions(this.user!.id),
      ]);

      this.catalog = catalog;
      current.forEach((p) => this.selectedIds.add(p.id));
    } catch (e: any) {
      this.errorMessage = this.normalizeMsg(e);
    } finally {
      this.loading = false;
    }
  }

  toggle(id: number, checked: boolean) {
    if (!this.canUpdate) return;
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);
  }

  isChecked(id: number) {
    return this.selectedIds.has(id);
  }

  get filteredCatalog() {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.catalog;

    return this.catalog.filter((p) => {
      const label = (p.label ?? '').toLowerCase();
      const key = (p.key ?? '').toLowerCase();
      const res = (p.resource ?? '').toLowerCase();
      const act = (p.action ?? '').toLowerCase();
      const grp = (p.group ?? '').toLowerCase();
      return (
        label.includes(q) ||
        key.includes(q) ||
        res.includes(q) ||
        act.includes(q) ||
        grp.includes(q)
      );
    });
  }

  get grouped(): Grouped[] {
    // Agrupa por `group` si existe; sino por resource
    const map = new Map<string, PermissionDTO[]>();
    for (const p of this.filteredCatalog) {
      const g = p.group && p.group.trim() ? p.group : p.resource;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }

    const groups: Grouped[] = Array.from(map.entries()).map(
      ([title, items]) => ({
        title,
        items: items
          .slice()
          .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
      }),
    );

    return groups.sort((a, b) => a.title.localeCompare(b.title));
  }

  async save() {
    if (!this.user) return;
    if (!this.canUpdate) return;

    this.saving = true;
    this.errorMessage = '';

    try {
      const ids = Array.from(this.selectedIds.values());
      await this.api.setUserPermissions(this.user.id, ids);
      this.updated.emit();
    } catch (e: any) {
      this.errorMessage = this.normalizeMsg(e);
    } finally {
      this.saving = false;
    }
  }

  onClose() {
    this.search = '';
    this.close.emit();
  }

  private normalizeMsg(err: any): string {
    const msg = err?.error?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
    return 'Error';
  }

  onToggle(id: number, ev: Event) {
    if (!this.canUpdate) return;

    const input = ev.target as HTMLInputElement | null;
    const checked = !!input?.checked;

    this.toggle(id, checked);
  }
}
