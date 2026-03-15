import { Component, inject, OnInit, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { menuItems as menuItemsData } from '../../../../data/menu';
import { Menu } from '../../../../interface/menu';
import { NavService } from '../../../../services/nav.service';
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
  private readonly destroyRef = inject(DestroyRef);

  readonly menuItems: Menu[] = menuItemsData.filter(item => item.title);

  activeMenuItem: Menu | undefined;

  active = signal(false);

  ngOnInit(): void {
    this.updateActiveMenuItemFromRoute();

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateActiveMenuItemFromRoute());
  }

  updateActiveMenuItemFromRoute(): void {
    const pathWithoutQuery = this.router.url?.split('?')[0];

    this.activeMenuItem = menuItemsData.find(
      item => item.type === 'link' && pathWithoutQuery?.includes(item.path ?? '')
    );

    if (!this.activeMenuItem) {
      const fullUrl = window.location.href;
      this.activeMenuItem = menuItemsData.find(
        item => item.type === 'extTabLink' && fullUrl.includes(item.path ?? '')
      );
    }
  }

  selectMenuItem(menuItem: Menu): void {
    this.activeMenuItem = menuItem;
  }

  toggleLanguage() {
    this.active.update(prev => !prev);
  }
}
