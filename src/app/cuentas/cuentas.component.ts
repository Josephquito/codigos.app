import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cuentas.component.html',
  styleUrls: ['./cuentas.component.css'],
})
export class CuentasComponent implements OnInit {
  cuentas: any[] = [];
  cuentasOriginal: any[] = []; // 🔁 respaldo para buscar
  plataformas = ['disney', 'netflix', 'prime', 'chatgpt', 'crunchyroll'];
  editando: Record<string, Record<string, boolean>> = {};
  filtroCorreo: string = '';
  nuevaCuenta = {
    emailAlias: '',
    plataforma: 'disney',
    clave: '',
  };
  cargando = false;

  readonly apiUrl = 'https://codigos-api.onrender.com/cuentas';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCuentas();
  }

  cargarCuentas() {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    };

    this.http.get<any[]>(this.apiUrl, { headers }).subscribe((data) => {
      this.cuentas = data;
      this.cuentasOriginal = data; // 🟩 Guardamos copia completa para filtrar
      this.editando = {}; // Reiniciar estados de edición
    });
  }

  editar(correo: string, plataforma: string) {
    this.editando = {};
    this.editando[correo] = { [plataforma]: true };
  }

  guardarClave(correo: string, plataforma: string, nuevaClave: string) {
    const body = { clave: nuevaClave };
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    };

    this.http
      .put(`${this.apiUrl}/${correo}/${plataforma}`, body, { headers })
      .subscribe(() => {
        this.editando[correo][plataforma] = false;
      });
  }

  registrarCuenta() {
    this.cargando = true;

    const body = {
      emailAlias: this.nuevaCuenta.emailAlias.trim().toLowerCase(),
      plataforma: this.nuevaCuenta.plataforma.trim().toLowerCase(),
      clave: this.nuevaCuenta.clave.trim(),
    };

    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    };

    this.http.post(this.apiUrl, body, { headers }).subscribe({
      next: () => {
        this.nuevaCuenta = { emailAlias: '', plataforma: 'disney', clave: '' };
        this.cargarCuentas();
      },
      error: (error) => {
        console.error('Error al registrar cuenta:', error);
      },
      complete: () => {
        this.cargando = false;
      },
    });
  }

  buscarCorreo() {
    const texto = this.filtroCorreo.trim().toLowerCase();

    if (!texto) {
      this.cuentas = this.cuentasOriginal;
      return;
    }

    this.cuentas = this.cuentasOriginal.filter((cuenta) =>
      cuenta.correo.toLowerCase().includes(texto)
    );
  }
  eliminarCuenta(correo: string, plataforma: string) {
    const confirmado = confirm(
      `¿Eliminar la cuenta ${correo} (${plataforma})?`
    );
    if (!confirmado) return;

    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    };

    this.http
      .delete(`${this.apiUrl}/${correo}/${plataforma}`, { headers })
      .subscribe(() => {
        this.cargarCuentas();
      });
  }
  editarUnico(correo: string, plataforma: string) {
    // Limpia todo
    this.editando = {};

    // Activa solo la celda seleccionada
    this.editando[correo] = { [plataforma]: true };
  }
}
