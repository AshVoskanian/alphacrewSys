import { inject, Injectable } from '@angular/core';
import { SessionStorageService } from './session-storage.service';
import { Router } from '@angular/router';
import { LocalStorageService } from './local-storage.service';
import { RoleManagementService } from './role-management.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'authToken';

  private router = inject(Router);
  private sessionStorageService = inject(SessionStorageService);
  private localStorageService = inject(LocalStorageService);
  private roleManagementService = inject(RoleManagementService);

  set userInfo(user: any) {
    this.localStorageService.setItem<string>('user', JSON.stringify(user));
    this.roleManagementService.setRoles(user?.roles);
  }

  getToken(): string | null {
    return this.localStorageService.getItem<string>(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token?.trim();
  }

  logout() {
    this.roleManagementService.clear();
    this.sessionStorageService.clear();
    this.localStorageService.clear();
    this.router.navigateByUrl('landing/auth').then();
  }

  setToken(token: string) {
    this.localStorageService.setItem<string>(this.tokenKey, token);
  }
}
