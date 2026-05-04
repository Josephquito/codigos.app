import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ImapAccount {
  id: number;
  email: string;
  imapHost: string;
  imapPort?: number | null;
  useTls?: boolean | null;
  active: boolean;
  isCatchAll: boolean;
  createdAt?: string;
}

export interface CreateImapDto {
  email: string;
  password: string;
  imapHost: string;
  imapPort?: number;
  useTls?: boolean;
  isCatchAll?: boolean;
}

export interface UpdateImapDto {
  email?: string;
  password?: string;
  imapHost?: string;
  imapPort?: number;
  useTls?: boolean;
  active?: boolean;
  isCatchAll?: boolean;
}

export interface BuzonEmail {
  subject: string;
  from: string;
  date: string;
  html: string;
}

@Injectable({ providedIn: 'root' })
export class ImapService {
  private readonly base = `${environment.apiUrl}/imap`;

  constructor(private http: HttpClient) {}

  getAccounts() {
    return this.http.get<ImapAccount[]>(`${this.base}/accounts`);
  }

  createAccount(dto: CreateImapDto) {
    return this.http.post<{ message: string; account: ImapAccount }>(
      `${this.base}/accounts`,
      dto,
    );
  }

  updateAccount(id: number, dto: UpdateImapDto) {
    return this.http.patch<{ message: string; account: ImapAccount }>(
      `${this.base}/accounts/${id}`,
      dto,
    );
  }

  deleteAccount(id: number) {
    return this.http.delete<{ deleted: boolean; id: number; email: string }>(
      `${this.base}/accounts/${id}`,
    );
  }

  setActive(id: number, active: boolean) {
    return this.http.patch(`${this.base}/accounts/${id}/active`, { active });
  }

  setCatchAll(id: number, isCatchAll: boolean) {
    return this.http.patch(`${this.base}/accounts/${id}/catchall`, {
      isCatchAll,
    });
  }

  getBuzon(email: string) {
    return this.http.get<BuzonEmail[]>(
      `${this.base}/buzon/${encodeURIComponent(email)}`,
    );
  }

  getEmailsByPlatform(email: string, platform: string) {
    return this.http.get<string[]>(
      `${this.base}/email/${encodeURIComponent(email)}/platform/${encodeURIComponent(platform)}`,
    );
  }
}
