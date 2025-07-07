// src/app/services/gmail.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class GmailService {
  private readonly baseUrl = 'http://localhost:3000/gmail';

  constructor(private http: HttpClient) {}

  getLastEmailHtml(email: string) {
    return this.http.get(`${this.baseUrl}/last/${email}`, {
      responseType: 'text', // porque esperamos HTML como texto
    });
  }
}
