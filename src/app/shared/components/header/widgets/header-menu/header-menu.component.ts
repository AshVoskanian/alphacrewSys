import { Component, DestroyRef, ElementRef, HostListener, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';

import { menuItems as menuItemsData } from '../../../../data/menu';
import { Menu } from '../../../../interface/menu';
import { LegacySystemService } from '../../../../services/legacy-system.service';
import { SvgIconComponent } from '../../../ui/svg-icon/svg-icon.component';

@Component({
  selector: 'app-header-menu',
  imports: [CommonModule, TranslateModule, SvgIconComponent, RouterModule],
  templateUrl: './header-menu.component.html',
  styleUrl: './header-menu.component.scss'
})
export class HeaderMenuComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly legacySystemService = inject(LegacySystemService);
  readonly isLegacySystem = this.legacySystemService.isLegacySystem;

  readonly menuItems: WritableSignal<Menu[]> = signal(
    menuItemsData.filter(item => item.title)
  );
  readonly activeMenuItem: WritableSignal<Menu | undefined> = signal<Menu | undefined>(undefined);
  readonly isDropdownOpen = signal(false);

  ngOnInit(): void {
    this.setActiveMenuItemFromRoute();

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.setActiveMenuItemFromRoute());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isDropdownOpen()) return;
    const target = event.target as Node;
    if (this.elementRef.nativeElement.contains(target)) return;
    this.isDropdownOpen.set(false);
  }

  private setActiveMenuItemFromRoute(): void {
    const pathWithoutQuery = this.router.url?.split('?')[0];
    let found = menuItemsData.find(
      item => item.type === 'link' && pathWithoutQuery?.includes(item.path ?? '')
    );
    if (!found) {
      const fullUrl = window.location.href;
      found = menuItemsData.find(
        item => item.type === 'extTabLink' && fullUrl.includes(item.path ?? '')
      );
    }
    this.activeMenuItem.set(found ?? menuItemsData.filter(item => item.title)[0]);
  }

  selectMenuItem(menuItem: Menu): void {
    this.activeMenuItem.set(menuItem);
    this.isDropdownOpen.set(false);
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen.update(prev => !prev);
  }
}
