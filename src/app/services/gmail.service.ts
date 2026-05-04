import { HttpClient } from '@angular/common/http';
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

export interface GmailAccount {
  id: number;
  email: string;
  active: boolean;
  googleProjectId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BuzonEmail {
  subject: string;
  from: string;
  date: string;
  html: string;
}

@Injectable({ providedIn: 'root' })
export class GmailService {
  private readonly base = `${environment.apiUrl}/gmail`;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  getAccounts() {
    return this.http.get<GmailAccount[]>(`${this.base}/accounts`);
  }

  getLoginUrl(email: string) {
    return this.http.get<{ url: string }>(
      `${this.base}/login-url/${encodeURIComponent(email)}`,
    );
  }

  getRenewUrl(email: string) {
    return this.http.get<{ url: string }>(
      `${this.base}/renew-url/${encodeURIComponent(email)}`,
    );
  }

  deleteAccount(email: string) {
    return this.http.delete<{ deleted: boolean; email: string }>(
      `${this.base}/accounts/${encodeURIComponent(email)}`,
    );
  }

  getBuzon(email: string) {
    return this.http.get<BuzonEmail[]>(
      `${this.base}/buzon/${encodeURIComponent(email)}`,
    );
  }

  /** Privado — lectura por plataforma con JWT */
  getEmailsByPlatform(email: string, platform: string) {
    return this.http.get<{ correos: string[] }>(
      `${this.base}/alias/${encodeURIComponent(email)}/platform/${encodeURIComponent(platform)}`,
    );
  }

  redirect(url: string): void {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = url;
    }
  }
}
