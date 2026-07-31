import { inject, Injectable, signal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

const USER_ROLES_KEY = 'userRoles';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root',
})
export class RoleManagementService {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly rolesSignal = signal<string[]>(this.readFromStorage());

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
    const target = role.trim().toLowerCase();
    return this.getRoles().some((userRole) => userRole.toLowerCase() === target);
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
    const stored = this.normalizeRoles(
      this.localStorageService.getItem<string[]>(USER_ROLES_KEY)
    );

    // Sessions created before roles were persisted separately still carry them on the user object.
    return stored.length ? stored : this.normalizeRoles(this.readUserRoles());
  }

  private readUserRoles(): unknown {
    const stored = this.localStorageService.getItem<unknown>(USER_KEY);
    const user = typeof stored === 'string' ? this.parseJson(stored) : stored;

    if (!user || typeof user !== 'object') {
      return null;
    }

    return (user as Record<string, unknown>)['roles'];
  }

  private parseJson(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private normalizeRoles(roles: unknown): string[] {
    if (typeof roles === 'string') {
      return roles.split(',').map((role) => role.trim()).filter(Boolean);
    }

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
            (role as { name?: string }).name
            ?? (role as { roleName?: string }).roleName
            ?? (role as { role?: string }).role;

          return typeof value === 'string' ? value.trim() : '';
        }

        return '';
      })
      .filter(Boolean);
  }
}
