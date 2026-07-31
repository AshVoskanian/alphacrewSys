import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { RoleManagementService } from '../services/role-management.service';

export type HasRolesMatchType = 'any' | 'all';

@Directive({
  selector: '[appHasRoles]',
})
export class HasRolesDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly roleManagementService = inject(RoleManagementService);

  readonly appHasRoles = input<string[]>([]);
  readonly appHasRolesType = input<HasRolesMatchType>('any');

  private hasView = false;

  constructor() {
    effect(() => {
      this.roleManagementService.roles();
      this.updateView();
    });
  }

  private updateView(): void {
    const requiredRoles = this.appHasRoles() ?? [];
    const matchType = this.appHasRolesType() ?? 'any';
    const allowed =
      matchType === 'all'
        ? this.roleManagementService.hasAllRoles(requiredRoles)
        : this.roleManagementService.hasAnyRole(requiredRoles);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }

    if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = true;
    }
  }
}
