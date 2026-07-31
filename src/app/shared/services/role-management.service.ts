import { inject, Injectable, signal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

const USER_ROLES_KEY = 'userRoles';

@Injectable({
  providedIn: 'root',
})
export class RoleManagementService {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly rolesSignal = signal<string[]>(this.readFromStorage());

  /** Reactive list of current user roles. */
  readonly roles = this.rolesSignal.asReadonly();

  setRoles(roles: unknown): void {
    const normalized = this.normalizeRoles(roles);
    this.localStorageService.setItem(USER_ROLES_KEY, normalized);
    this.rolesSignal.set(normalized);
  }

  getRoles(): string[] {
    return this.rolesSignal();
  }

  hasRole(role: string): boolean {
    return this.getRoles().some(
      (userRole) => userRole.toLowerCase() === role.toLowerCase()
    );
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.hasRole(role));
  }

  clear(): void {
    this.localStorageService.removeItem(USER_ROLES_KEY);
    this.rolesSignal.set([]);
  }

  private readFromStorage(): string[] {
    const stored = this.localStorageService.getItem<string[]>(USER_ROLES_KEY);
    return this.normalizeRoles(stored);
  }

  private normalizeRoles(roles: unknown): string[] {
    if (!Array.isArray(roles)) {
      return [];
    }

    return roles
      .map((role) => {
        if (typeof role === 'string') {
          return role.trim();
        }

        if (role && typeof role === 'object') {
          const value =
            (role as { name?: string; roleName?: string; role?: string }).name
            ?? (role as { roleName?: string }).roleName
            ?? (role as { role?: string }).role;

          return typeof value === 'string' ? value.trim() : '';
        }

        return '';
      })
      .filter((role) => !!role);
  }
}
