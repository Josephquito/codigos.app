import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Me } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private http = inject(HttpClient);

  me() {
    return firstValueFrom(this.http.get<Me>(`${environment.apiUrl}/auth/me`));
  }
}
