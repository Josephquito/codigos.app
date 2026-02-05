import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const KEY = 'activeCompany';

export type ActiveCompany = {
  id: number;
  name: string;
};

@Injectable({ providedIn: 'root' })
export class CompanyContextService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private _active = signal<ActiveCompany | null>(this.read());

  activeCompany() {
    return this._active();
  }

  companyId() {
    return this._active()?.id ?? null;
  }

  companyName() {
    return this._active()?.name ?? null;
  }

  hasCompany() {
    return !!this._active();
  }

  setActiveCompany(company: ActiveCompany | null) {
    this._active.set(company);

    if (!this.isBrowser) return;

    if (company) localStorage.setItem(KEY, JSON.stringify(company));
    else localStorage.removeItem(KEY);
  }

  // compat: por si ya estabas usando setCompanyId
  setCompanyId(id: number | null, name?: string) {
    if (!id) return this.setActiveCompany(null);
    this.setActiveCompany({ id, name: name ?? `Company #${id}` });
  }

  private read(): ActiveCompany | null {
    if (!this.isBrowser) return null;

    const raw = localStorage.getItem(KEY);
    if (!raw) return null;

    try {
      const obj = JSON.parse(raw);
      if (
        obj &&
        Number.isInteger(obj.id) &&
        obj.id > 0 &&
        typeof obj.name === 'string'
      ) {
        return { id: obj.id, name: obj.name };
      }
      return null;
    } catch {
      return null;
    }
  }
}
