import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `
    <nav style="margin: 20px;">
      <a routerLink="/registrar" style="margin-right: 20px;">Registrar Gmail</a>
      <a routerLink="/correo">Ver Correo</a>
      <a routerLink="/imap-registrar" style="margin-left: 20px;"
        >Registrar IMAP</a
      >
    </nav>
    <router-outlet></router-outlet>
  `,
})
export class AppComponent {}
