import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface BuzonEmail {
  subject: string;
  from: string;
  date: string;
  html: string;
}

@Injectable({ providedIn: 'root' })
export class CorreoService {
  private readonly base = `${environment.apiUrl}/correo`;

  constructor(private http: HttpClient) {}

  /** Público — sin JWT */
  getCorreoPorPlataforma(email: string, platform: string, clave: string) {
    const url = `${this.base}/email/${encodeURIComponent(email)}/platform/${encodeURIComponent(platform)}?clave=${encodeURIComponent(clave)}`;
    return this.http.get<string[]>(url);
  }

  /** Privado — lectura por plataforma con JWT */
  getCorreoPrivadoPorPlataforma(email: string, platform: string) {
    return this.http.get<string[]>(
      `${this.base}/privado/${encodeURIComponent(email)}/platform/${encodeURIComponent(platform)}`,
    );
  }

  /** Privado — buzón general últimos 5 */
  getBuzonGeneral(email: string) {
    return this.http.get<BuzonEmail[]>(
      `${this.base}/buzon/${encodeURIComponent(email)}`,
    );
  }

  normalizeToHtml(res: any): string {
    if (Array.isArray(res)) return res.join('<hr>');
    if (typeof res === 'string') return res;
    if (res?.correos && Array.isArray(res.correos))
      return res.correos.join('<hr>');
    if (res?.html) return res.html;
    return '<p>No se pudo cargar el contenido.</p>';
  }
}
