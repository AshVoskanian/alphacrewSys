import { Component, computed, inject, Input } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LayoutService } from '../../../../services/layout.service';
import { FeatherIconComponent } from "../../../ui/feather-icon/feather-icon.component";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map } from "rxjs";

@Component({
  selector: 'app-header-logo',
  imports: [ RouterModule, FeatherIconComponent ],
  templateUrl: './header-logo.component.html',
  styleUrl: './header-logo.component.scss'
})

export class HeaderLogoComponent {
  private _router: Router = inject(Router);

  @Input() icon: string;
  @Input() type: string;

  urlSig = toSignal(
    this._router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this._router.url }
  )

  logoColor = computed(() => {
    const url = this.urlSig();

    if (url.includes('/dashboard')) return '#52526c';
    if (url.includes('/crew')) return '#7366FF';
    if (url.includes('/schedule')) return '#ffb829';

    return '#111827';
  });

  constructor(public layoutService: LayoutService) {
  }

  toggleSidebar() {
    this.layoutService.closeSidebar = !this.layoutService.closeSidebar;
  }
}
